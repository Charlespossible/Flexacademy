import { prisma } from "../config/database";
import { logger } from "../utils/logger";

interface GradedAnswer {
  questionId: string;
  isCorrect: boolean;
}

/**
 * Recalculates and persists TopicMastery after a quiz or exam submission.
 *
 * Groups submitted answers by topic, fetches existing mastery records, and
 * upserts cumulative stats (totalAttempts, correctAnswers, accuracyPercent,
 * masteryLevel). Questions without a topicId are silently skipped.
 *
 * Must be called BEFORE runGapDetection so the gap engine reads fresh data.
 */
export async function updateTopicMastery(
  userId: string,
  gradedAnswers: GradedAnswer[]
): Promise<void> {
  if (gradedAnswers.length === 0) return;

  const questionIds = gradedAnswers.map((a) => a.questionId);

  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: { id: true, topicId: true, subjectId: true },
  });

  const questionMap = new Map(questions.map((q) => [q.id, q]));

  // Aggregate this session's results by topic
  const topicGroups = new Map<
    string,
    { subjectId: string | null; attempts: number; correct: number }
  >();

  for (const answer of gradedAnswers) {
    const q = questionMap.get(answer.questionId);
    if (!q?.topicId) continue;

    const group = topicGroups.get(q.topicId) ?? {
      subjectId: q.subjectId,
      attempts: 0,
      correct: 0,
    };
    group.attempts++;
    if (answer.isCorrect) group.correct++;
    topicGroups.set(q.topicId, group);
  }

  if (topicGroups.size === 0) return;

  for (const [topicId, group] of topicGroups) {
    const existing = await prisma.topicMastery.findUnique({
      where: { userId_topicId: { userId, topicId } },
      select: { totalAttempts: true, correctAnswers: true },
    });

    const newTotal = (existing?.totalAttempts ?? 0) + group.attempts;
    const newCorrect = (existing?.correctAnswers ?? 0) + group.correct;
    const newAccuracy = newTotal > 0 ? (newCorrect / newTotal) * 100 : 0;
    const newMastery = Math.min(100, Math.round(newAccuracy));

    await prisma.topicMastery.upsert({
      where: { userId_topicId: { userId, topicId } },
      update: {
        totalAttempts: newTotal,
        correctAnswers: newCorrect,
        accuracyPercent: newAccuracy,
        masteryLevel: newMastery,
        lastAttemptAt: new Date(),
      },
      create: {
        userId,
        topicId,
        subjectId: group.subjectId,
        totalAttempts: group.attempts,
        correctAnswers: group.correct,
        accuracyPercent: (group.correct / group.attempts) * 100,
        masteryLevel: Math.min(
          100,
          Math.round((group.correct / group.attempts) * 100)
        ),
        lastAttemptAt: new Date(),
      },
    });
  }

  logger.debug(
    { userId, topicsUpdated: topicGroups.size },
    "TopicMastery updated after submission"
  );
}

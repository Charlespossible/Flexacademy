import { GapSeverity, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { logger } from "../utils/logger";
import { anthropic, REASONING_PARAMS, extractText } from "../config/anthropic";

// ── Thresholds ────────────────────────────────────────────────────────────────
const GAP_THRESHOLD = 70;                  // mastery below this = gap
const FLASHCARD_WEAKNESS_THRESHOLD = 0.5;  // ≥50% AGAIN+HARD over window = flashcard gap signal
const FLASHCARD_MIN_REVIEWS = 5;           // minimum reviews to count as a signal
const FLASHCARD_REVIEW_WINDOW_DAYS = 30;
const FLASHCARD_TRIGGER_COUNT = 5;         // ≥5 weak reviews in 7 days triggers background detection
const AI_TUTOR_SESSION_THRESHOLD = 3;      // ≥3 sessions on same topic = conversation gap signal
const AI_TUTOR_WINDOW_DAYS = 14;

// ── Severity helpers ──────────────────────────────────────────────────────────
function computeSeverity(masteryLevel: number): GapSeverity {
  if (masteryLevel < 30) return "CRITICAL";
  if (masteryLevel < 50) return "HIGH";
  if (masteryLevel < 60) return "MEDIUM";
  return "LOW";
}

function flashcardWeaknessToSeverity(weaknessRate: number): GapSeverity {
  if (weaknessRate >= 0.8) return "CRITICAL";
  if (weaknessRate >= 0.65) return "HIGH";
  return "MEDIUM";
}

// ── Flashcard signal types ────────────────────────────────────────────────────
interface FlashcardGapSignal {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  weaknessRate: number;
  totalReviews: number;
  againCount: number;
  hardCount: number;
}

// ── Signal 2: Scan flashcard review history for per-topic failure patterns ────
async function analyzeFlashcardGaps(studentId: string): Promise<FlashcardGapSignal[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - FLASHCARD_REVIEW_WINDOW_DAYS);

  // Only decks linked to a curriculum topic carry a reliable gap signal
  const decks = await prisma.flashcardDeck.findMany({
    where: { userId: studentId, topicId: { not: null } },
    select: { id: true, topicId: true },
  });

  if (decks.length === 0) return [];

  const signals: FlashcardGapSignal[] = [];

  for (const deck of decks) {
    const topicId = deck.topicId!;

    const cardIds = (
      await prisma.flashcard.findMany({
        where: { deckId: deck.id },
        select: { id: true },
      })
    ).map((c) => c.id);

    if (cardIds.length === 0) continue;

    const reviews = await prisma.flashcardReview.findMany({
      where: {
        userId: studentId,
        flashcardId: { in: cardIds },
        reviewedAt: { gte: cutoff },
      },
      select: { result: true },
    });

    if (reviews.length < FLASHCARD_MIN_REVIEWS) continue;

    const againCount = reviews.filter((r) => r.result === "AGAIN").length;
    const hardCount  = reviews.filter((r) => r.result === "HARD").length;
    const weaknessRate = (againCount + hardCount) / reviews.length;

    if (weaknessRate < FLASHCARD_WEAKNESS_THRESHOLD) continue;

    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: { subject: { select: { id: true, name: true } } },
    });

    if (!topic) continue;

    signals.push({
      topicId,
      topicName: topic.name,
      subjectId: topic.subject.id,
      subjectName: topic.subject.name,
      weaknessRate,
      totalReviews: reviews.length,
      againCount,
      hardCount,
    });
  }

  return signals;
}

// ── Lightweight post-review trigger ──────────────────────────────────────────
// Called immediately after any AGAIN/HARD flashcard review. Counts recent weak
// reviews for this topic; fires full gap detection only when threshold is crossed.
export async function checkFlashcardGapSignal(
  studentId: string,
  topicId: string
): Promise<void> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);

  const deckIds = (
    await prisma.flashcardDeck.findMany({
      where: { userId: studentId, topicId },
      select: { id: true },
    })
  ).map((d) => d.id);

  if (deckIds.length === 0) return;

  const cardIds = (
    await prisma.flashcard.findMany({
      where: { deckId: { in: deckIds } },
      select: { id: true },
    })
  ).map((c) => c.id);

  if (cardIds.length === 0) return;

  const weakReviewCount = await prisma.flashcardReview.count({
    where: {
      userId: studentId,
      flashcardId: { in: cardIds },
      result: { in: ["AGAIN", "HARD"] },
      reviewedAt: { gte: cutoff },
    },
  });

  if (weakReviewCount >= FLASHCARD_TRIGGER_COUNT) {
    logger.info(
      { studentId, topicId, weakReviewCount },
      "Flashcard gap signal threshold reached — queuing gap detection"
    );
    runGapDetection(studentId).catch((err) =>
      logger.warn({ err, studentId }, "Background gap detection failed after flashcard signal")
    );
  }
}

// ── Signal 3: AI Tutor conversation pattern ────────────────────────────────────
// A student returning to FlexBot 3+ times about the same topic in two weeks is
// a reliable signal they are genuinely struggling, not just browsing.
export async function checkAiTutorGapSignal(
  studentId: string,
  topicName: string,
  sessionId: string
): Promise<void> {
  if (!topicName?.trim()) return;

  // Skip if this session has already triggered a gap signal
  const session = await prisma.aiTutorSession.findUnique({
    where: { id: sessionId },
    select: { insightTriggered: true },
  });
  if (session?.insightTriggered) return;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - AI_TUTOR_WINDOW_DAYS);

  const sessionCount = await prisma.aiTutorSession.count({
    where: {
      userId: studentId,
      topic: { contains: topicName, mode: "insensitive" },
      createdAt: { gte: cutoff },
    },
  });

  if (sessionCount >= AI_TUTOR_SESSION_THRESHOLD) {
    await prisma.aiTutorSession.update({
      where: { id: sessionId },
      data: {
        insightTriggered: true,
        gapsDetected: [
          {
            topicName,
            confidence: "MEDIUM",
            source: "ai_conversation_pattern",
            sessionCount,
          },
        ] as unknown as Prisma.InputJsonValue,
      },
    });

    logger.info(
      { studentId, topicName, sessionCount },
      "AI Tutor gap signal threshold reached — queuing gap detection"
    );

    runGapDetection(studentId).catch((err) =>
      logger.warn({ err, studentId }, "Background gap detection failed after AI Tutor signal")
    );
  }
}

// ── Tutor brief generation ─────────────────────────────────────────────────────
interface TutorBrief {
  summary: string;
  approach: string;
  focusAreas: Array<{ area: string; suggestion: string; priority: string }>;
}

async function generateTutorBrief(
  studentName: string,
  topicName: string,
  subjectName: string,
  evidence: Record<string, unknown>,
  masteryLevel: number
): Promise<TutorBrief> {
  const sources = (evidence.detectionSources as string[]) ?? ["quiz"];

  const flashcardLine = evidence.flashcardSignals
    ? `- Flashcard reviews (last 30 days): ${(evidence.flashcardSignals as any).totalReviews} reviews, ${Math.round((evidence.flashcardSignals as any).weaknessRate * 100)}% marked AGAIN or HARD — persistent recall failure.`
    : "";

  const aiTutorLine = evidence.aiTutorSignals
    ? `- AI Tutor sessions on this topic: ${(evidence.aiTutorSignals as any).sessionCount} in the last two weeks — student keeps returning for help.`
    : "";

  const prompt = `You are an assistant on FlexAcademy, an AI-powered Nigerian tutoring platform.
A student named ${studentName} is struggling with "${topicName}" in ${subjectName}.

Evidence collected from multiple signal sources (${sources.join(", ")}):
- Current estimated mastery: ${masteryLevel}%
- Quiz/test attempts: ${evidence.totalAttempts}, correct: ${evidence.correctAnswers} (${evidence.accuracyPercent}% accuracy)
${flashcardLine}
${aiTutorLine}

Write a concise brief for the assigned human tutor. Be direct and practical.

Respond ONLY with valid JSON (no markdown):
{
  "summary": "2-3 sentence summary of the student's struggle and the evidence pattern",
  "approach": "2-3 sentence recommended teaching approach for this specific gap",
  "focusAreas": [
    {"area": "specific sub-concept", "suggestion": "how to teach it", "priority": "HIGH|MEDIUM|LOW"}
  ]
}
Provide 3-5 focus areas.`;

  try {
    const response = await anthropic.messages.create({
      ...REASONING_PARAMS,
      // Adaptive thinking shares this budget with the response. The brief
      // itself is ~700 tokens; the rest is headroom for reasoning.
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = extractText(response) ?? "{}";
    const jsonMatch = text.replace(/```json|```/g, "").trim().match(/\{[\s\S]*\}/);

    if (jsonMatch) return JSON.parse(jsonMatch[0]) as TutorBrief;
  } catch (err) {
    logger.warn({ err, topicName }, "AI brief generation failed, using fallback");
  }

  return {
    summary: `${studentName} has ${masteryLevel}% mastery in "${topicName}" (${subjectName}). Signal sources: ${sources.join(", ")}. Accuracy is ${evidence.accuracyPercent}% over ${evidence.totalAttempts} attempts — immediate targeted instruction is needed.`,
    approach: `Focus on fundamentals of ${topicName}. Use worked examples and guided practice before moving to independent work. Reinforce with short quizzes after each concept.`,
    focusAreas: [
      { area: topicName, suggestion: "Review core definitions and principles", priority: "HIGH" },
      { area: `${topicName} — application`, suggestion: "Work through exam-style questions step by step", priority: "HIGH" },
    ],
  };
}

// ── Core gap detection engine ──────────────────────────────────────────────────
// Idempotent — skips topics that already have an open gap record.
// Integrates three signal sources:
//   1. Quiz / exam TopicMastery (formal assessments)
//   2. Flashcard review patterns (spaced-repetition failure rate per topic)
//   3. AI Tutor conversation frequency (same topic asked repeatedly)
export interface GapDetectionResult {
  newGapsDetected: number;
  insightsGenerated: number;
  existingOpenGaps: number;
  regressedGaps: number;
  totalWeakTopics: number;
}

export async function runGapDetection(studentId: string): Promise<GapDetectionResult> {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, firstName: true, lastName: true },
  });

  if (!student) {
    logger.warn({ studentId }, "runGapDetection: student not found, skipping");
    return { newGapsDetected: 0, insightsGenerated: 0, existingOpenGaps: 0, regressedGaps: 0, totalWeakTopics: 0 };
  }

  const assignment = await prisma.studentTutorAssignment.findFirst({
    where: { studentId, status: "ACTIVE" },
    include: {
      tutorProfile: { select: { id: true, userId: true } },
      subject: { select: { name: true } },
    },
  });

  // ── Signal 1: Quiz / test mastery data ───────────────────────────────────────
  const weakMasteryTopics = await prisma.topicMastery.findMany({
    where: { userId: studentId, masteryLevel: { lt: GAP_THRESHOLD } },
    include: {
      topic: { include: { subject: { select: { id: true, name: true } } } },
    },
    orderBy: { masteryLevel: "asc" },
  });

  // ── Signal 2: Flashcard failure patterns ─────────────────────────────────────
  const flashcardGaps = await analyzeFlashcardGaps(studentId);

  // Merge signals into a unified weak-topic map, keyed by topicId
  interface WeakTopicEntry {
    topicId: string;
    topicName: string;
    subjectId: string;
    subjectName: string;
    masteryLevel: number;
    totalAttempts: number;
    correctAnswers: number;
    accuracyPercent: number;
    flashcardSignal?: FlashcardGapSignal;
    sources: string[];
  }

  const topicMap = new Map<string, WeakTopicEntry>();

  for (const wt of weakMasteryTopics) {
    topicMap.set(wt.topicId, {
      topicId: wt.topicId,
      topicName: wt.topic.name,
      subjectId: wt.topic.subject.id,
      subjectName: wt.topic.subject.name,
      masteryLevel: wt.masteryLevel,
      totalAttempts: wt.totalAttempts,
      correctAnswers: wt.correctAnswers,
      accuracyPercent: Number(wt.accuracyPercent),
      sources: ["quiz"],
    });
  }

  // Merge flashcard signals — annotate existing entries, or add new flashcard-only entries
  for (const fg of flashcardGaps) {
    const existing = topicMap.get(fg.topicId);
    if (existing) {
      existing.flashcardSignal = fg;
      existing.sources.push("flashcard");
    } else {
      // Flashcard-only gap: no quiz data yet. Estimate mastery conservatively.
      const estimatedMastery = Math.round((1 - fg.weaknessRate) * 60);
      topicMap.set(fg.topicId, {
        topicId: fg.topicId,
        topicName: fg.topicName,
        subjectId: fg.subjectId,
        subjectName: fg.subjectName,
        masteryLevel: estimatedMastery,
        totalAttempts: fg.totalReviews,
        correctAnswers: fg.totalReviews - fg.againCount - fg.hardCount,
        accuracyPercent: Math.round((1 - fg.weaknessRate) * 100),
        flashcardSignal: fg,
        sources: ["flashcard"],
      });
    }
  }

  const allWeakTopics = Array.from(topicMap.values());

  if (allWeakTopics.length === 0) {
    return { newGapsDetected: 0, insightsGenerated: 0, existingOpenGaps: 0, regressedGaps: 0, totalWeakTopics: 0 };
  }

  const existingOpenGaps = await prisma.learningGap.findMany({
    where: {
      studentId,
      topicId: { in: allWeakTopics.map((t) => t.topicId) },
      status: { in: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS"] },
    },
    select: { topicId: true },
  });
  const existingTopicIds = new Set(existingOpenGaps.map((g) => g.topicId));
  const newWeakTopics = allWeakTopics.filter((t) => !existingTopicIds.has(t.topicId));

  let insightsGenerated = 0;

  for (const wt of newWeakTopics) {
    const recentAnswers = await prisma.attemptAnswer.findMany({
      where: {
        attempt: { userId: studentId },
        question: { topicId: wt.topicId },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { isCorrect: true },
    });

    // Build enriched evidence that captures all signal sources
    const evidence: Record<string, unknown> = {
      totalAttempts: wt.totalAttempts,
      correctAnswers: wt.correctAnswers,
      accuracyPercent: wt.accuracyPercent,
      recentCorrectRate:
        recentAnswers.length > 0
          ? Math.round(
              (recentAnswers.filter((a) => a.isCorrect).length / recentAnswers.length) * 100
            )
          : 0,
      detectedAt: new Date().toISOString(),
      detectionSources: wt.sources,
    };

    if (wt.flashcardSignal) {
      evidence.flashcardSignals = {
        totalReviews: wt.flashcardSignal.totalReviews,
        againCount: wt.flashcardSignal.againCount,
        hardCount: wt.flashcardSignal.hardCount,
        weaknessRate: Math.round(wt.flashcardSignal.weaknessRate * 100) / 100,
        signalStrength:
          wt.flashcardSignal.weaknessRate >= 0.8
            ? "HIGH"
            : wt.flashcardSignal.weaknessRate >= 0.65
            ? "MEDIUM"
            : "LOW",
      };
    }

    const severity =
      wt.flashcardSignal && !wt.sources.includes("quiz")
        ? flashcardWeaknessToSeverity(wt.flashcardSignal.weaknessRate)
        : computeSeverity(wt.masteryLevel);

    const gap = await prisma.learningGap.create({
      data: {
        studentId,
        assignmentId: assignment?.id ?? null,
        topicId: wt.topicId,
        subjectId: wt.subjectId,
        severity,
        status: "OPEN",
        masteryAtDetection: wt.masteryLevel,
        evidence: evidence as unknown as Prisma.InputJsonValue,
      },
    });

    if (assignment) {
      const brief = await generateTutorBrief(
        `${student.firstName} ${student.lastName}`,
        wt.topicName,
        wt.subjectName,
        evidence,
        wt.masteryLevel
      );

      const insight = await prisma.tutorInsight.create({
        data: {
          gapId: gap.id,
          tutorProfileId: assignment.tutorProfile.id,
          studentId,
          aiSummary: brief.summary,
          recommendedApproach: brief.approach,
          focusAreas: brief.focusAreas as unknown as Prisma.InputJsonValue,
        },
      });
      insightsGenerated++;

      await prisma.notification.create({
        data: {
          userId: assignment.tutorProfile.userId,
          type: "TUTOR_INSIGHT_READY",
          title: "New Student Gap Detected",
          body: `${student.firstName} ${student.lastName} needs help with "${wt.topicName}" (${gap.severity} severity). A brief is ready for you.`,
          metadata: {
            insightId: insight.id,
            gapId: gap.id,
            studentId,
            severity: gap.severity,
            sources: wt.sources,
          } as unknown as Prisma.InputJsonValue,
        },
      });
    }

    await prisma.notification.create({
      data: {
        userId: studentId,
        type: "GAP_DETECTED",
        title: "Learning Gap Identified",
        body: `AI has flagged a gap in "${wt.topicName}". ${
          assignment
            ? "Your tutor has been notified and will help you."
            : "Work through the related study materials to improve."
        }`,
        metadata: {
          gapId: gap.id,
          topicId: wt.topicId,
          severity: gap.severity,
        } as unknown as Prisma.InputJsonValue,
      },
    });
  }

  // Re-flag resolved gaps that have fallen below the threshold again (regression)
  const resolvedGaps = await prisma.learningGap.findMany({
    where: {
      studentId,
      topicId: { in: allWeakTopics.map((t) => t.topicId) },
      status: "RESOLVED",
    },
    select: { id: true, topicId: true },
  });

  let regressedCount = 0;
  for (const rg of resolvedGaps) {
    const current = allWeakTopics.find((t) => t.topicId === rg.topicId);
    if (current && current.masteryLevel < GAP_THRESHOLD) {
      await prisma.learningGap.update({
        where: { id: rg.id },
        data: { status: "REGRESSED" },
      });
      regressedCount++;
    }
  }

  const result: GapDetectionResult = {
    newGapsDetected: newWeakTopics.length,
    insightsGenerated,
    existingOpenGaps: existingOpenGaps.length,
    regressedGaps: regressedCount,
    totalWeakTopics: allWeakTopics.length,
  };

  logger.info({ studentId, ...result }, "Gap detection completed");
  return result;
}

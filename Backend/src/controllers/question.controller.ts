import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../config/database";
import { Prisma, ExamCategory, DifficultyLevel } from "@prisma/client";
import { ApiResponse, ApiError } from "../utils/ApiResponse";
import { logger } from "../utils/logger";
import { SubmitAttemptBody, ReportReason } from "../types";
import { runGapDetection } from "../services/gapDetection.service";
import { updateTopicMastery } from "../services/topicMastery.service";

// ─────────────────────────────────────────────────────────────────────────────
// QUESTIONS & PAST PAPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/questions — List questions with filters
 */
export const getQuestions = async (
  req: Request<
    object,
    object,
    object,
    {
      topicId?: string;
      examCategory?: string;
      year?: string;
      difficulty?: string;
      page?: string;
      limit?: string;
    }
  >,
  res: Response
): Promise<void> => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const where: Prisma.QuestionWhereInput = { isActive: true };

  if (req.query.topicId) where.topicId = req.query.topicId;
  if (req.query.examCategory) where.examCategory = req.query.examCategory as ExamCategory;
  if (req.query.year) where.year = Number(req.query.year);
  if (req.query.difficulty) where.difficulty = req.query.difficulty as DifficultyLevel;

  const [questions, total] = await Promise.all([
    prisma.question.findMany({
      where,
      select: {
        id: true,
        body: true,
        questionType: true,
        difficulty: true,
        examCategory: true,
        year: true,
        marks: true,
        topic: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.question.count({ where }),
  ]);

  logger.debug({ count: questions.length, total, filters: req.query }, "Questions fetched");

  res
    .status(StatusCodes.OK)
    .json(ApiResponse.paginated(questions, { total, page, limit }));
};

/**
 * GET /api/v1/questions/past — Get past exam questions
 */
export const getPastQuestions = async (
  req: Request<
    object,
    object,
    object,
    { exam?: string; subject?: string; year?: string; page?: string; limit?: string }
  >,
  res: Response
): Promise<void> => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const skip = (page - 1) * limit;

  const where: Prisma.QuestionWhereInput = {
    isActive: true,
  };

  if (req.query.exam) {
    where.examCategory = req.query.exam as ExamCategory;
  }

  if (req.query.year) {
    where.year = Number(req.query.year);
  }

  const [questions, total, subjects] = await Promise.all([
    prisma.question.findMany({
      where,
      include: {
        topic: { select: { id: true, name: true, subject: { select: { name: true } } } },
      },
      orderBy: [{ year: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
    prisma.question.count({ where }),
    prisma.subject.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    }),
  ]);

  logger.debug({ exam: req.query.exam, year: req.query.year, count: questions.length }, "Past questions fetched");

  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      { questions, subjects, total, page, limit },
      "Past questions retrieved successfully"
    )
  );
};

/**
 * GET /api/v1/questions/years — Get available exam years per category
 */
export const getQuestionYears = async (
  req: Request<object, object, object, { exam?: string; subject?: string }>,
  res: Response
): Promise<void> => {
  const where: Prisma.QuestionWhereInput = { isActive: true };

  if (req.query.exam) {
    where.examCategory = req.query.exam as ExamCategory;
  }

  const years = await prisma.question.findMany({
    where,
    select: { year: true },
    distinct: ["year"],
    orderBy: { year: "desc" },
  });

  const uniqueYears = years.map((q) => q.year).filter((y): y is number => y !== null);

  logger.debug({ years: uniqueYears }, "Question years fetched");

  res.status(StatusCodes.OK).json(
    ApiResponse.success({ years: uniqueYears }, "Years retrieved successfully")
  );
};

/**
 * POST /api/v1/questions/:id/report — Report a question
 */
export const reportQuestion = async (
  req: Request<
    { id: string },
    object,
    { reason: ReportReason; description?: string }
  >,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const { id: questionId } = req.params;
  const { reason, description } = req.body;

  // Validate question exists
  const question = await prisma.question.findUnique({
    where: { id: questionId },
  });

  if (!question) {
    throw ApiError(StatusCodes.NOT_FOUND, "Question not found.");
  }

  // Create report
  const report = await prisma.contentReport.create({
    data: {
      reporterId: userId,
      questionId,
      entityType: "question",
      entityId: questionId,
      reason,
      description: description ?? null,
      status: "OPEN",
    },
  });

  logger.info({ userId, questionId, reason }, "Question reported");

  res.status(StatusCodes.CREATED).json(
    ApiResponse.success({ report }, "Question reported successfully")
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// QUIZZES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/quizzes — List available quizzes
 */
export const getQuizzes = async (
  req: Request<
    object,
    object,
    object,
    {
      subject?: string;
      examCategory?: string;
      difficulty?: string;
      page?: string;
      limit?: string;
    }
  >,
  res: Response
): Promise<void> => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const where: Prisma.QuizWhereInput = { isPublished: true };

  if (req.query.difficulty) where.difficulty = req.query.difficulty as DifficultyLevel;
  if (req.query.examCategory) where.examCategory = req.query.examCategory as ExamCategory;

  const [quizzes, total] = await Promise.all([
    prisma.quiz.findMany({
      where,
      include: {
        _count: { select: { questions: true, attempts: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.quiz.count({ where }),
  ]);

  logger.debug({ count: quizzes.length, total }, "Quizzes fetched");

  res
    .status(StatusCodes.OK)
    .json(ApiResponse.paginated(quizzes, { total, page, limit }));
};

/**
 * GET /api/v1/quizzes/:id — Get quiz details
 */
export const getQuiz = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const { id: quizId } = req.params;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        include: { question: { select: { id: true, body: true, questionType: true, options: true, marks: true, imageUrl: true } } },
        orderBy: { order: "asc" },
      },
      _count: { select: { attempts: true } },
    },
  });

  if (!quiz) {
    throw ApiError(StatusCodes.NOT_FOUND, "Quiz not found.");
  }

  logger.debug({ quizId }, "Quiz fetched");

  res.status(StatusCodes.OK).json(
    ApiResponse.success(quiz, "Quiz retrieved successfully")
  );
};

/**
 * POST /api/v1/quizzes/:id/start — Start a quiz attempt
 */
export const startQuizAttempt = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const { id: quizId } = req.params;

  // Verify quiz exists
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { include: { question: true } } },
  });

  if (!quiz) {
    throw ApiError(StatusCodes.NOT_FOUND, "Quiz not found.");
  }

  // Create attempt
  const attempt = await prisma.quizAttempt.create({
    data: {
      userId,
      quizId,
      score: 0,
      totalMarks: quiz.questions.reduce((sum, q) => sum + q.question.marks, 0),
      startedAt: new Date(),
    },
  });

  logger.info({ userId, quizId, attemptId: attempt.id }, "Quiz attempt started");

  res.status(StatusCodes.CREATED).json(
    ApiResponse.success(
      { attempt, quiz: { id: quiz.id, title: quiz.title, timeLimit: quiz.timeLimit } },
      "Quiz attempt started"
    )
  );
};

/**
 * POST /api/v1/quizzes/attempts/:id/submit — Submit quiz answers
 */
export const submitQuizAttempt = async (
  req: Request<{ id: string }, object, SubmitAttemptBody>,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const { id: attemptId } = req.params;
  const { answers, timeTaken } = req.body;

  // Fetch attempt with validation
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: { quiz: { include: { questions: { include: { question: true } } } } },
  });

  if (!attempt) {
    throw ApiError(StatusCodes.NOT_FOUND, "Quiz attempt not found.");
  }

  if (attempt.userId !== userId) {
    throw ApiError(StatusCodes.FORBIDDEN, "Unauthorized attempt access.");
  }

  if (attempt.completedAt) {
    throw ApiError(StatusCodes.BAD_REQUEST, "Quiz attempt already submitted.");
  }

  // Calculate score
  let totalScore = 0;
  const maxMarks = attempt.quiz.questions.reduce((sum, q) => sum + q.question.marks, 0);

  const answersWithCorrection = await Promise.all(
    answers.map(async (answer) => {
      const question = attempt.quiz.questions.find((q) => q.questionId === answer.questionId);

      if (!question) {
        return {
          attemptId,
          questionId: answer.questionId,
          selectedOption: answer.selectedOption,
          isCorrect: false,
          marksAwarded: 0,
          timeTaken: answer.timeTaken,
        };
      }

      const isCorrect =
        answer.selectedOption ===
        (Array.isArray(question.question.options)
          ? (question.question.options as unknown as Array<{isCorrect: boolean; id: string}>).find((o) => o.isCorrect)?.id
          : JSON.parse(JSON.stringify(question.question.options))?.find((o: unknown) => {
            const opt = o as {isCorrect: boolean; id: string};
            return opt.isCorrect;
          })?.id);

      const marksAwarded = isCorrect ? question.question.marks : 0;
      totalScore += marksAwarded;

      return {
        attemptId,
        questionId: answer.questionId,
        selectedOption: answer.selectedOption,
        isCorrect,
        marksAwarded,
        timeTaken: answer.timeTaken,
      };
    })
  );

  const percentage = Math.round((totalScore / maxMarks) * 100);
  const isPassed = percentage >= attempt.quiz.passMark;

  // Update attempt and create answers
  const updatedAttempt = await prisma.$transaction(async (tx) => {
    // Create answer records
    await tx.attemptAnswer.createMany({
      data: answersWithCorrection,
    });

    // Update attempt with results
    return tx.quizAttempt.update({
      where: { id: attemptId },
      data: {
        score: totalScore,
        totalMarks: maxMarks,
        percentage: percentage,
        isPassed,
        completedAt: new Date(),
        timeTaken,
      },
    });
  });

  logger.info(
    { userId, attemptId, score: totalScore, percentage, isPassed },
    "Quiz attempt submitted"
  );

  // Update mastery then detect gaps in background — order matters
  const quizGraded = answersWithCorrection.map((a) => ({ questionId: a.questionId, isCorrect: a.isCorrect }));
  updateTopicMastery(userId, quizGraded)
    .then(() => runGapDetection(userId))
    .catch((err) => logger.warn({ err, userId, attemptId }, "Post-quiz mastery/gap update failed"));

  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      {
        attempt: updatedAttempt,
        results: { totalScore, maxMarks, percentage, isPassed },
      },
      "Quiz submitted successfully"
    )
  );
};

/**
 * GET /api/v1/quizzes/attempts/:id/results — Get quiz attempt results
 */
export const getQuizResults = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const { id: attemptId } = req.params;

  const [attempt, answers] = await Promise.all([
    prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: { quiz: { select: { title: true, passMark: true } } },
    }),
    prisma.attemptAnswer.findMany({
      where: { attemptId },
      include: { question: { select: { id: true, body: true, explanation: true, options: true } } },
    }),
  ]);

  if (!attempt) {
    throw ApiError(StatusCodes.NOT_FOUND, "Quiz attempt not found.");
  }

  if (attempt.userId !== userId) {
    throw ApiError(StatusCodes.FORBIDDEN, "Unauthorized results access.");
  }

  const wrongAnswers = answers.filter((a) => !a.isCorrect);

  logger.debug({ userId, attemptId, wrongCount: wrongAnswers.length }, "Quiz results fetched");

  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      {
        attempt,
        answers,
        wrongAnswers,
        performance: {
          correct: answers.filter((a) => a.isCorrect).length,
          total: answers.length,
          percentage: attempt.percentage,
          passed: attempt.isPassed,
        },
      },
      "Quiz results retrieved successfully"
    )
  );
};

/**
 * GET /api/v1/quizzes/me/attempts — Get user's quiz attempt history
 */
export const getUserQuizAttempts = async (
  req: Request<object, object, object, { page?: string; limit?: string }>,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const [attempts, total] = await Promise.all([
    prisma.quizAttempt.findMany({
      where: { userId },
      include: { quiz: { select: { title: true, examCategory: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.quizAttempt.count({ where: { userId } }),
  ]);

  logger.debug({ userId, count: attempts.length }, "User quiz attempts fetched");

  res
    .status(StatusCodes.OK)
    .json(ApiResponse.paginated(attempts, { total, page, limit }));
};

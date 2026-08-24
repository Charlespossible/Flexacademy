import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { ApiResponse, ApiError } from "../utils/ApiResponse";
import { logger } from "../utils/logger";
import { StartExamSimulationBody, SubmitSimulationBody } from "../types";
import { runGapDetection } from "../services/gapDetection.service";
import { updateTopicMastery } from "../services/topicMastery.service";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/exams/simulate — Start timed exam simulation
// ─────────────────────────────────────────────────────────────────────────────
export const startExamSimulation = async (
  req: Request<object, object, StartExamSimulationBody>,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const { examCategory, subjectId, year, timeLimitMins = 180 } = req.body;

  if (!examCategory) {
    throw ApiError(StatusCodes.BAD_REQUEST, "Exam category required.");
  }

  // Fetch questions for this exam configuration
  const where: Prisma.QuestionWhereInput = {
    isActive: true,
    examCategory,
  };

  if (year) where.year = year;

  const questions = await prisma.question.findMany({
    where,
    select: {
      id: true,
      body: true,
      questionType: true,
      options: true,
      marks: true,
      imageUrl: true,
      difficulty: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (questions.length === 0) {
    throw ApiError(
      StatusCodes.NOT_FOUND,
      "No questions available for this exam configuration."
    );
  }

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  // Create exam simulation record
  const simulation = await prisma.examSimulation.create({
    data: {
      userId,
      examCategory,
      subjectId: subjectId ?? null,
      year: year ?? null,
      title: `${examCategory} Simulation ${new Date().toLocaleDateString()}`,
      totalQuestions: questions.length,
      timeLimitMins,
      status: "IN_PROGRESS",
      questionSnapshot: questions,
      startedAt: new Date(),
    },
  });

  logger.info(
    { userId, simulationId: simulation.id, examCategory, totalQuestions: questions.length },
    "Exam simulation started"
  );

  res.status(StatusCodes.CREATED).json(
    ApiResponse.success(
      {
        simulation: {
          id: simulation.id,
          examCategory: simulation.examCategory,
          totalQuestions: simulation.totalQuestions,
          timeLimitMins: simulation.timeLimitMins,
          totalMarks,
          startedAt: simulation.startedAt,
        },
        questions: questions.map((q) => ({
          id: q.id,
          body: q.body,
          questionType: q.questionType,
          options: q.options,
          marks: q.marks,
          imageUrl: q.imageUrl,
        })),
      },
      "Exam simulation started - Timer began"
    )
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/exams/simulate/me — Get user's simulation history
// ─────────────────────────────────────────────────────────────────────────────
export const getMySimulations = async (
  req: Request<object, object, object, { page?: string; limit?: string }>,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const [simulations, total] = await Promise.all([
    prisma.examSimulation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        examCategory: true,
        title: true,
        status: true,
        score: true,
        totalMarks: true,
        percentage: true,
        isPassed: true,
        startedAt: true,
        submittedAt: true,
      },
    }),
    prisma.examSimulation.count({ where: { userId } }),
  ]);

  logger.debug({ userId, count: simulations.length }, "User simulations fetched");

  res
    .status(StatusCodes.OK)
    .json(ApiResponse.paginated(simulations, { total, page, limit }));
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/exams/simulate/:id — Get running simulation or results
// ─────────────────────────────────────────────────────────────────────────────
export const getSimulation = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const { id: simulationId } = req.params;

  const simulation = await prisma.examSimulation.findUnique({
    where: { id: simulationId },
    include: {
      answers: {
        select: {
          id: true,
          questionId: true,
          selectedOption: true,
          isCorrect: true,
          marksAwarded: true,
        },
      },
    },
  });

  if (!simulation) {
    throw ApiError(StatusCodes.NOT_FOUND, "Simulation not found.");
  }

  if (simulation.userId !== userId) {
    throw ApiError(StatusCodes.FORBIDDEN, "Unauthorized simulation access.");
  }

  // If still in progress, calculate remaining time
  let secondsRemaining = null;

  if (simulation.status === "IN_PROGRESS") {
    const elapsedSeconds = Math.floor(
      (Date.now() - simulation.startedAt.getTime()) / 1000
    );
    const totalSeconds = simulation.timeLimitMins * 60;
    secondsRemaining = Math.max(0, totalSeconds - elapsedSeconds);

    // Auto-submit if time expired
    if (secondsRemaining === 0) {
      await prisma.examSimulation.update({
        where: { id: simulationId },
        data: {
          status: "TIMED_OUT",
          autoSubmittedAt: new Date(),
        },
      });

      throw ApiError(
        StatusCodes.CONFLICT,
        "Time expired - exam auto-submitted."
      );
    }
  }

  logger.debug({ userId, simulationId, status: simulation.status }, "Simulation fetched");

  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      {
        simulation,
        secondsRemaining,
        isExpired: secondsRemaining !== null && secondsRemaining === 0,
      },
      "Simulation data retrieved"
    )
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/exams/simulate/:id/submit — Submit exam answers
// ─────────────────────────────────────────────────────────────────────────────
export const submitSimulation = async (
  req: Request<{ id: string }, object, SubmitSimulationBody>,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const { id: simulationId } = req.params;
  const { answers } = req.body;

  // Fetch simulation
  const simulation = await prisma.examSimulation.findUnique({
    where: { id: simulationId },
  });

  if (!simulation) {
    throw ApiError(StatusCodes.NOT_FOUND, "Simulation not found.");
  }

  if (simulation.userId !== userId) {
    throw ApiError(StatusCodes.FORBIDDEN, "Unauthorized submission.");
  }

  if (simulation.status !== "IN_PROGRESS") {
    throw ApiError(
      StatusCodes.BAD_REQUEST,
      `Cannot submit exam with status: ${simulation.status}`
    );
  }

  // Check if time expired
  const elapsedSeconds = Math.floor(
    (Date.now() - simulation.startedAt.getTime()) / 1000
  );
  const totalSeconds = simulation.timeLimitMins * 60;

  if (elapsedSeconds > totalSeconds) {
    throw ApiError(StatusCodes.REQUEST_TOO_LONG, "Exam time limit exceeded.");
  }

  // Snapshot holds the marks each question was worth at exam time
  const questionSnapshot = (simulation.questionSnapshot as unknown as Array<{ id: string; marks: number }>) || [];
  const snapshotMarks = new Map(questionSnapshot.map((q) => [q.id, q.marks]));

  // Fetch live correctAnswer + options from DB — never trust snapshot for grading
  const submittedIds = answers.map((a) => a.questionId);
  const dbQuestions = await prisma.question.findMany({
    where: { id: { in: submittedIds } },
    select: { id: true, correctAnswer: true, options: true },
  });
  const dbQuestionMap = new Map(dbQuestions.map((q) => [q.id, q]));

  // Grade answers
  let totalScore = 0;
  const gradedAnswers = answers.map((answer) => {
    const dbQ = dbQuestionMap.get(answer.questionId);
    const marks = snapshotMarks.get(answer.questionId) ?? 1;

    if (!dbQ) {
      return {
        simulationId,
        questionId: answer.questionId,
        selectedOption: answer.selectedOption,
        isCorrect: false,
        marksAwarded: 0,
        timeTaken: 0,
      };
    }

    // Resolve correct answer: prefer explicit correctAnswer field, fall back to
    // the isCorrect flag inside the options array
    let correctOptionId: string | undefined = dbQ.correctAnswer ?? undefined;
    if (!correctOptionId && Array.isArray(dbQ.options)) {
      correctOptionId = (dbQ.options as Array<{ id: string; isCorrect: boolean }>)
        .find((o) => o.isCorrect)?.id;
    }

    const isCorrect = !!correctOptionId && answer.selectedOption === correctOptionId;
    const marksAwarded = isCorrect ? marks : 0;
    totalScore += marksAwarded;

    return {
      simulationId,
      questionId: answer.questionId,
      selectedOption: answer.selectedOption,
      isCorrect,
      marksAwarded,
      timeTaken: 0,
    };
  });

  const totalMarks = questionSnapshot.reduce((sum, q) => sum + q.marks, 0);
  const percentage = Math.round((totalScore / totalMarks) * 100);
  const isPassed = percentage >= 50; // Default pass mark

  // Update simulation with results
  const updatedSimulation = await prisma.$transaction(async (tx) => {
    // Create answer records
    await tx.examSimulationAnswer.createMany({
      data: gradedAnswers,
    });

    // Update simulation
    return tx.examSimulation.update({
      where: { id: simulationId },
      data: {
        status: "SUBMITTED",
        score: totalScore,
        totalMarks,
        percentage: percentage,
        isPassed,
        submittedAt: new Date(),
      },
    });
  });

  logger.info(
    { userId, simulationId, score: totalScore, percentage, isPassed },
    "Exam simulation submitted"
  );

  // Update mastery then detect gaps in background — order matters
  const examGraded = gradedAnswers.map((a) => ({ questionId: a.questionId, isCorrect: a.isCorrect }));
  updateTopicMastery(userId, examGraded)
    .then(() => runGapDetection(userId))
    .catch((err) => logger.warn({ err, userId, simulationId }, "Post-exam mastery/gap update failed"));

  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      {
        simulation: updatedSimulation,
        results: {
          score: totalScore,
          totalMarks,
          percentage,
          isPassed,
          answersCount: answers.length,
        },
      },
      "Exam submitted successfully"
    )
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/exams/simulate/:id/results — Get detailed exam results
// ─────────────────────────────────────────────────────────────────────────────
export const getSimulationResults = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const { id: simulationId } = req.params;

  const simulation = await prisma.examSimulation.findUnique({
    where: { id: simulationId },
    include: {
      answers: {
        include: {
          question: {
            select: {
              id: true,
              body: true,
              explanation: true,
              correctAnswer: true,
              options: true,
            },
          },
        },
      },
    },
  });

  if (!simulation) {
    throw ApiError(StatusCodes.NOT_FOUND, "Simulation not found.");
  }

  if (simulation.userId !== userId) {
    throw ApiError(StatusCodes.FORBIDDEN, "Unauthorized results access.");
  }

  if (simulation.status !== "SUBMITTED") {
    throw ApiError(
      StatusCodes.BAD_REQUEST,
      "Results only available for submitted exams."
    );
  }

  const correctAnswers = simulation.answers.filter((a) => a.isCorrect).length;
  const wrongAnswers = simulation.answers.filter((a) => !a.isCorrect);

  // Build detailed results
  const detailedAnswers = simulation.answers.map((answer) => ({
    questionId: answer.questionId,
    questionBody: answer.question?.body,
    userAnswer: answer.selectedOption,
    correctAnswer: answer.question?.correctAnswer,
    isCorrect: answer.isCorrect,
    marksAwarded: answer.marksAwarded,
    explanation: answer.question?.explanation,
  }));

  logger.debug(
    { userId, simulationId, correctCount: correctAnswers, wrongCount: wrongAnswers.length },
    "Simulation results fetched"
  );

  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      {
        simulation: {
          id: simulation.id,
          examCategory: simulation.examCategory,
          title: simulation.title,
          score: simulation.score,
          totalMarks: simulation.totalMarks,
          percentage: simulation.percentage,
          isPassed: simulation.isPassed,
          submittedAt: simulation.submittedAt,
        },
        performance: {
          totalQuestions: simulation.totalQuestions,
          correctAnswers,
          wrongAnswers: wrongAnswers.length,
          percentage: simulation.percentage,
        },
        details: {
          allAnswers: detailedAnswers,
          wrongAnswers: detailedAnswers.filter((a) => !a.isCorrect),
        },
      },
      "Exam results retrieved successfully"
    )
  );
};
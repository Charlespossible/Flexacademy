import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../config/database";
import { ApiResponse, ApiError } from "../utils/ApiResponse";
import { logger } from "../utils/logger";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/parent/children — list all linked children with summary stats
// ─────────────────────────────────────────────────────────────────────────────
export const getChildren = async (req: Request, res: Response): Promise<void> => {
  const parentId = req.user?.id;
  if (!parentId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const links = await prisma.parentStudentLink.findMany({
    where: { parentId },
    orderBy: { createdAt: "asc" },
    include: {
      child: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          email: true,
          studentProfile: {
            select: {
              gradeLevel: true,
              curriculum: true,
              studyStreakDays: true,
              longestStreak: true,
              totalXp: true,
              targetExams: true,
            },
          },
        },
      },
    },
  });

  // Augment each child with open gap count and last quiz score
  const children = await Promise.all(
    links.map(async (link) => {
      const [openGapsCount, lastQuiz] = await Promise.all([
        prisma.learningGap.count({
          where: { studentId: link.studentId, status: "OPEN" },
        }),
        prisma.quizAttempt.findFirst({
          where: { userId: link.studentId },
          orderBy: { completedAt: "desc" },
          select: { percentage: true, completedAt: true },
        }),
      ]);

      return {
        linkId: link.id,
        isVerified: link.isVerified,
        nickname: link.nickname,
        child: {
          ...link.child,
          openGapsCount,
          lastScore: lastQuiz ? Number(lastQuiz.percentage) : null,
          lastActive: lastQuiz?.completedAt ?? null,
        },
      };
    })
  );

  res.status(StatusCodes.OK).json(ApiResponse.success(children, "Children retrieved"));
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/parent/link-child — link to a student by email
// ─────────────────────────────────────────────────────────────────────────────
export const linkChild = async (req: Request, res: Response): Promise<void> => {
  const parentId = req.user?.id;
  if (!parentId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");
  if (req.user?.role !== "PARENT") {
    throw ApiError(StatusCodes.FORBIDDEN, "Only parent accounts can link to a student.");
  }

  const { studentEmail, nickname } = req.body as { studentEmail?: string; nickname?: string };
  if (!studentEmail?.trim()) {
    throw ApiError(StatusCodes.BAD_REQUEST, "studentEmail is required.");
  }

  const student = await prisma.user.findUnique({
    where: { email: studentEmail.trim().toLowerCase() },
    select: { id: true, role: true, firstName: true, lastName: true },
  });

  if (!student) throw ApiError(StatusCodes.NOT_FOUND, "No account found with that email address.");
  if (student.role !== "STUDENT") {
    throw ApiError(StatusCodes.BAD_REQUEST, "That account is not a student account.");
  }
  if (student.id === parentId) {
    throw ApiError(StatusCodes.BAD_REQUEST, "You cannot link to your own account.");
  }

  const existing = await prisma.parentStudentLink.findUnique({
    where: { parentId_studentId: { parentId, studentId: student.id } },
  });
  if (existing) throw ApiError(StatusCodes.CONFLICT, "You are already linked to this student.");

  const link = await prisma.parentStudentLink.create({
    data: {
      parentId,
      studentId: student.id,
      nickname: nickname?.trim() || student.firstName,
      isVerified: true, // auto-verify; email confirmation flow can be layered on later
    },
  });

  logger.info({ parentId, studentId: student.id }, "Parent-child link created");

  res.status(StatusCodes.CREATED).json(
    ApiResponse.success(
      {
        linkId: link.id,
        childName: `${student.firstName} ${student.lastName}`,
        isVerified: link.isVerified,
      },
      `Successfully linked to ${student.firstName} ${student.lastName}`
    )
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/parent/children/:id/progress — detailed progress for one child
// ─────────────────────────────────────────────────────────────────────────────
export const getChildProgress = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const parentId = req.user?.id;
  if (!parentId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const { id: childId } = req.params;

  const link = await prisma.parentStudentLink.findUnique({
    where: { parentId_studentId: { parentId, studentId: childId } },
  });
  if (!link) throw ApiError(StatusCodes.FORBIDDEN, "You are not linked to this student.");

  const [profile, recentQuizzes, openGaps, recentSessions] = await Promise.all([
    prisma.studentProfile.findUnique({
      where: { userId: childId },
      select: {
        gradeLevel: true,
        curriculum: true,
        studyStreakDays: true,
        longestStreak: true,
        totalXp: true,
        targetExams: true,
        weeklyGoalMins: true,
      },
    }),
    prisma.quizAttempt.findMany({
      where: { userId: childId },
      orderBy: { completedAt: "desc" },
      take: 5,
      select: {
        percentage: true,
        completedAt: true,
        quiz: { select: { title: true, examCategory: true } },
      },
    }),
    prisma.learningGap.findMany({
      where: { studentId: childId, status: "OPEN" },
      take: 5,
      orderBy: { detectedAt: "desc" },
      select: {
        id: true,
        severity: true,
        // LearningGap has no `gapScore`; mastery at detection is the
        // equivalent signal (0-100).
        masteryAtDetection: true,
        detectedAt: true,
        // Subject is reached through the topic relation — LearningGap holds
        // only a scalar subjectId, not a Subject relation.
        topic: {
          select: {
            name: true,
            subject: { select: { name: true } },
          },
        },
      },
    }),
    prisma.studySession.findMany({
      where: { userId: childId },
      orderBy: { date: "desc" },
      take: 7,
      select: { date: true, durationMins: true, subject: true, xpEarned: true },
    }),
  ]);

  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      { profile, recentQuizzes, openGaps, recentSessions, nickname: link.nickname },
      "Child progress retrieved"
    )
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/parent/alerts — all alerts for this parent
// ─────────────────────────────────────────────────────────────────────────────
export const getAlerts = async (req: Request, res: Response): Promise<void> => {
  const parentId = req.user?.id;
  if (!parentId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const alerts = await prisma.parentAlert.findMany({
    where: { parentId },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      link: {
        select: {
          nickname: true,
          child: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  res.status(StatusCodes.OK).json(ApiResponse.success(alerts, "Alerts retrieved"));
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/parent/alerts/:id/read — mark one alert as read
// ─────────────────────────────────────────────────────────────────────────────
export const markAlertRead = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const parentId = req.user?.id;
  if (!parentId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const alert = await prisma.parentAlert.findFirst({
    where: { id: req.params.id, parentId },
  });
  if (!alert) throw ApiError(StatusCodes.NOT_FOUND, "Alert not found.");

  await prisma.parentAlert.update({
    where: { id: alert.id },
    data: { isRead: true },
  });

  res.status(StatusCodes.OK).json(ApiResponse.success(null, "Alert marked as read"));
};

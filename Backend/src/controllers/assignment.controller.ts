import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AssignmentStatus } from "@prisma/client";
import { prisma } from "../config/database";
import { ApiResponse, ApiError } from "../utils/ApiResponse";
import { logger } from "../utils/logger";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/assignments
// Admin or system creates a student-tutor assignment for a subject.
// Validates tutor capacity and prevents duplicate active assignments.
// ─────────────────────────────────────────────────────────────────────────────
export const createAssignment = async (req: Request, res: Response): Promise<void> => {
  const { studentId, tutorProfileId, subjectId } = req.body;

  if (!studentId || !tutorProfileId || !subjectId) {
    throw ApiError(StatusCodes.BAD_REQUEST, "studentId, tutorProfileId, and subjectId are required.");
  }

  // Validate all three entities in parallel
  const [student, tutorProfile, subject] = await Promise.all([
    prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, role: true, firstName: true, lastName: true },
    }),
    prisma.tutorProfile.findUnique({
      where: { id: tutorProfileId },
      select: { id: true, userId: true, isVerified: true, applicationStatus: true, maxStudents: true },
    }),
    prisma.subject.findUnique({
      where: { id: subjectId },
      select: { id: true, name: true },
    }),
  ]);

  if (!student || student.role !== "STUDENT") {
    throw ApiError(StatusCodes.NOT_FOUND, "Student not found.");
  }
  if (!tutorProfile) {
    throw ApiError(StatusCodes.NOT_FOUND, "Tutor profile not found.");
  }
  if (!tutorProfile.isVerified || tutorProfile.applicationStatus !== "APPROVED") {
    throw ApiError(StatusCodes.FORBIDDEN, "Tutor is not verified or approved yet.");
  }
  if (!subject) {
    throw ApiError(StatusCodes.NOT_FOUND, "Subject not found.");
  }

  // Check tutor capacity — count active assignments against maxStudents
  const activeCount = await prisma.studentTutorAssignment.count({
    where: { tutorProfileId, status: "ACTIVE" },
  });
  if (activeCount >= tutorProfile.maxStudents) {
    throw ApiError(
      StatusCodes.CONFLICT,
      `This tutor has reached their maximum student capacity (${tutorProfile.maxStudents}).`
    );
  }

  // Prevent duplicate active assignment for same student + subject
  const existing = await prisma.studentTutorAssignment.findFirst({
    where: { studentId, subjectId, status: { in: ["ACTIVE", "PAUSED"] } },
  });
  if (existing) {
    throw ApiError(StatusCodes.CONFLICT, "Student already has an active assignment for this subject.");
  }

  const assignment = await prisma.studentTutorAssignment.create({
    data: { studentId, tutorProfileId, subjectId },
    include: {
      student: { select: { firstName: true, lastName: true, email: true } },
      tutorProfile: {
        select: { userId: true, user: { select: { firstName: true, lastName: true } } },
      },
      subject: { select: { name: true } },
    },
  });

  // Notify both parties in parallel
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: tutorProfile.userId,
        type: "SYSTEM",
        title: "New Student Assigned",
        body: `${student.firstName} ${student.lastName} has been assigned to you for ${subject.name}.`,
        metadata: { assignmentId: assignment.id, studentId, subjectId },
      },
    }),
    prisma.notification.create({
      data: {
        userId: studentId,
        type: "SYSTEM",
        title: "Tutor Assigned",
        body: `You have been assigned a tutor for ${subject.name}. Your personalised learning journey begins now.`,
        metadata: { assignmentId: assignment.id },
      },
    }),
  ]);

  logger.info({ assignmentId: assignment.id, studentId, tutorProfileId }, "Student-tutor assignment created");

  res.status(StatusCodes.CREATED).json(
    ApiResponse.success(assignment, "Assignment created successfully")
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/assignments/me  (student perspective)
// Returns the student's current active/paused assignments with tutor info
// and a summary of open learning gaps per assignment.
// ─────────────────────────────────────────────────────────────────────────────
export const getMyAssignment = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const assignments = await prisma.studentTutorAssignment.findMany({
    where: { studentId: userId, status: { in: ["ACTIVE", "PAUSED"] } },
    include: {
      tutorProfile: {
        select: {
          id: true,
          bio: true,
          specializations: true,
          rating: true,
          totalSessions: true,
          user: { select: { firstName: true, lastName: true, avatar: true } },
        },
      },
      subject: { select: { id: true, name: true, icon: true } },
      gaps: {
        where: { status: { in: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS"] } },
        select: {
          id: true, severity: true, status: true,
          topic: { select: { name: true } },
        },
        orderBy: { severity: "asc" },
      },
    },
  });

  res.status(StatusCodes.OK).json(
    ApiResponse.success(assignments, "Your assignments retrieved")
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/assignments/me/students  (tutor perspective)
// Returns all students currently assigned to the calling tutor with
// top-level mastery stats so the tutor can see who needs the most attention.
// ─────────────────────────────────────────────────────────────────────────────
export const getTutorStudents = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!tutorProfile) throw ApiError(StatusCodes.NOT_FOUND, "Tutor profile not found.");

  const assignments = await prisma.studentTutorAssignment.findMany({
    where: { tutorProfileId: tutorProfile.id, status: { in: ["ACTIVE", "PAUSED"] } },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          studentProfile: {
            select: { gradeLevel: true, curriculum: true, totalXp: true, studyStreakDays: true },
          },
        },
      },
      subject: { select: { id: true, name: true, icon: true } },
      gaps: {
        where: { status: { in: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS"] } },
        select: { id: true, severity: true, status: true, topic: { select: { name: true } } },
      },
    },
    orderBy: { startedAt: "desc" },
  });

  // Attach aggregate mastery stats per student without N+1 — batch the aggregates
  const enriched = await Promise.all(
    assignments.map(async (a) => {
      const stats = await prisma.topicMastery.aggregate({
        where: { userId: a.studentId },
        _avg: { masteryLevel: true },
        _count: { id: true },
      });
      return {
        ...a,
        masteryStats: {
          avgMastery: Math.round(stats._avg.masteryLevel ?? 0),
          topicsTracked: stats._count.id,
        },
      };
    })
  );

  res.status(StatusCodes.OK).json(
    ApiResponse.success(enriched, "Assigned students retrieved")
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/assignments/students/:studentId  (tutor perspective)
// Full AI-generated performance profile for a specific assigned student.
// Guards: the calling tutor must have an active assignment with this student.
// ─────────────────────────────────────────────────────────────────────────────
export const getStudentPerformanceProfile = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { studentId } = req.params;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!tutorProfile) throw ApiError(StatusCodes.NOT_FOUND, "Tutor profile not found.");

  // Guard: tutor must be assigned to this student
  const assignment = await prisma.studentTutorAssignment.findFirst({
    where: {
      studentId,
      tutorProfileId: tutorProfile.id,
      status: { in: ["ACTIVE", "PAUSED"] },
    },
  });
  if (!assignment) {
    throw ApiError(StatusCodes.FORBIDDEN, "You do not have an active assignment with this student.");
  }

  // Fetch all performance data in parallel
  const [student, topicMastery, recentQuizzes, recentExams, activeGaps, recentSessions] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: studentId },
        select: {
          id: true, firstName: true, lastName: true, avatar: true,
          studentProfile: true,
        },
      }),
      prisma.topicMastery.findMany({
        where: { userId: studentId },
        include: {
          topic: { select: { id: true, name: true, subject: { select: { id: true, name: true } } } },
        },
        orderBy: { masteryLevel: "asc" },
      }),
      prisma.quizAttempt.findMany({
        where: { userId: studentId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          percentage: true, isPassed: true, createdAt: true,
          quiz: { select: { title: true, examCategory: true } },
        },
      }),
      prisma.examSimulation.findMany({
        where: { userId: studentId, status: { in: ["SUBMITTED", "TIMED_OUT"] } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { percentage: true, examCategory: true, createdAt: true, status: true },
      }),
      prisma.learningGap.findMany({
        where: { studentId, status: { in: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS"] } },
        include: { topic: { select: { id: true, name: true } } },
        orderBy: { severity: "asc" },
      }),
      prisma.studySession.findMany({
        where: {
          userId: studentId,
          date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        select: { durationMins: true, xpEarned: true, date: true },
      }),
    ]);

  if (!student) throw ApiError(StatusCodes.NOT_FOUND, "Student not found.");

  const avgMastery =
    topicMastery.length > 0
      ? Math.round(topicMastery.reduce((s, t) => s + t.masteryLevel, 0) / topicMastery.length)
      : 0;

  const avgQuizScore =
    recentQuizzes.length > 0
      ? Math.round(
          recentQuizzes.reduce((s, q) => s + Number(q.percentage), 0) / recentQuizzes.length
        )
      : 0;

  const totalStudyMins30d = recentSessions.reduce((s, ss) => s + ss.durationMins, 0);

  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      {
        student,
        assignment,
        performanceSummary: {
          avgMastery,
          avgQuizScore,
          totalStudyMins30d,
          topicsTracked: topicMastery.length,
          activeGapsCount: activeGaps.length,
        },
        topicMastery,
        recentQuizzes,
        recentExams,
        activeGaps,
      },
      "Student performance profile retrieved"
    )
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/assignments/:id/status
// Tutor, student, or admin can change assignment status to PAUSED, COMPLETED,
// or TERMINATED. Sets endedAt when finalising.
// ─────────────────────────────────────────────────────────────────────────────
export const updateAssignmentStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const allowed: AssignmentStatus[] = ["PAUSED", "COMPLETED", "TERMINATED"];
  if (!allowed.includes(status)) {
    throw ApiError(StatusCodes.BAD_REQUEST, `Status must be one of: ${allowed.join(", ")}`);
  }

  const assignment = await prisma.studentTutorAssignment.findUnique({ where: { id } });
  if (!assignment) throw ApiError(StatusCodes.NOT_FOUND, "Assignment not found.");
  if (assignment.status !== "ACTIVE" && assignment.status !== "PAUSED") {
    throw ApiError(StatusCodes.CONFLICT, "Only ACTIVE or PAUSED assignments can be updated.");
  }

  // Access check — only the assigned tutor, the student, or admins
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  const isAssignedTutor = tutorProfile?.id === assignment.tutorProfileId;
  const isStudent = userId === assignment.studentId;
  const isAdmin = req.user?.role === "ADMIN" || req.user?.role === "SUPER_ADMIN";

  if (!isAssignedTutor && !isStudent && !isAdmin) {
    throw ApiError(StatusCodes.FORBIDDEN, "Access denied.");
  }

  const isFinal = status === "COMPLETED" || status === "TERMINATED";

  const updated = await prisma.studentTutorAssignment.update({
    where: { id },
    data: {
      status,
      notes: notes ?? assignment.notes,
      endedAt: isFinal ? new Date() : assignment.endedAt,
    },
  });

  logger.info({ assignmentId: id, status, updatedBy: userId }, "Assignment status updated");

  res.status(StatusCodes.OK).json(
    ApiResponse.success(updated, `Assignment ${status.toLowerCase()} successfully`)
  );
};

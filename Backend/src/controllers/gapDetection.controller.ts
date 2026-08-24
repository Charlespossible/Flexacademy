import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { GapStatus } from "@prisma/client";
import { prisma } from "../config/database";
import { ApiResponse, ApiError } from "../utils/ApiResponse";
import { logger } from "../utils/logger";
import { runGapDetection } from "../services/gapDetection.service";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/gaps/detect/:studentId  (tutor or admin)
// Manual trigger: validates the student, delegates to the shared
// runGapDetection service, then returns counts to the caller.
// ─────────────────────────────────────────────────────────────────────────────
export const detectGaps = async (req: Request, res: Response): Promise<void> => {
  const { studentId } = req.params;
  const requesterId = req.user?.id;
  if (!requesterId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, role: true },
  });
  if (!student || student.role !== "STUDENT") {
    throw ApiError(StatusCodes.NOT_FOUND, "Student not found.");
  }

  const result = await runGapDetection(studentId);

  const message =
    result.newGapsDetected === 0 && result.existingOpenGaps === 0
      ? "No weak areas detected. Keep up the great work!"
      : "Gap detection completed successfully";

  res.status(StatusCodes.OK).json(ApiResponse.success(result, message));
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/gaps/me  (student)
// Student views their own learning gaps with optional status filter.
// ─────────────────────────────────────────────────────────────────────────────
export const getMyGaps = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const { status } = req.query;
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { studentId: userId };
  if (status) where.status = status;

  const [gaps, total] = await Promise.all([
    prisma.learningGap.findMany({
      where,
      include: {
        topic: {
          select: { id: true, name: true, subject: { select: { id: true, name: true } } },
        },
        insights: {
          select: { id: true, isRead: true, isActedOn: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: [{ severity: "asc" }, { detectedAt: "desc" }],
      skip,
      take: limit,
    }),
    prisma.learningGap.count({ where }),
  ]);

  res.status(StatusCodes.OK).json(ApiResponse.paginated(gaps, { total, page, limit }));
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/gaps/students/:studentId  (tutor)
// Tutor views all gaps for an assigned student.
// Guards: calling tutor must have an active assignment with the student.
// ─────────────────────────────────────────────────────────────────────────────
export const getStudentGaps = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { studentId } = req.params;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!tutorProfile) throw ApiError(StatusCodes.NOT_FOUND, "Tutor profile not found.");

  const assignment = await prisma.studentTutorAssignment.findFirst({
    where: {
      studentId,
      tutorProfileId: tutorProfile.id,
      status: { in: ["ACTIVE", "PAUSED"] },
    },
  });
  if (!assignment) {
    throw ApiError(StatusCodes.FORBIDDEN, "You do not have an assignment with this student.");
  }

  const gaps = await prisma.learningGap.findMany({
    where: { studentId },
    include: {
      topic: {
        select: { id: true, name: true, subject: { select: { id: true, name: true } } },
      },
      insights: {
        where: { tutorProfileId: tutorProfile.id },
        select: { id: true, aiSummary: true, isRead: true, isActedOn: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: [{ severity: "asc" }, { status: "asc" }, { detectedAt: "desc" }],
  });

  res.status(StatusCodes.OK).json(ApiResponse.success(gaps, "Student gaps retrieved"));
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/gaps/:id/status  (tutor)
// Tutor moves a gap to ACKNOWLEDGED or IN_PROGRESS to signal awareness.
// ─────────────────────────────────────────────────────────────────────────────
export const updateGapStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const tutorWritable: GapStatus[] = ["ACKNOWLEDGED", "IN_PROGRESS"];
  if (!tutorWritable.includes(status)) {
    throw ApiError(StatusCodes.BAD_REQUEST, `Status must be one of: ${tutorWritable.join(", ")}`);
  }

  const gap = await prisma.learningGap.findUnique({ where: { id } });
  if (!gap) throw ApiError(StatusCodes.NOT_FOUND, "Learning gap not found.");

  const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId }, select: { id: true } });
  const assignment = await prisma.studentTutorAssignment.findFirst({
    where: {
      studentId: gap.studentId,
      tutorProfileId: tutorProfile?.id ?? "",
      status: { in: ["ACTIVE", "PAUSED"] },
    },
  });
  if (!assignment) throw ApiError(StatusCodes.FORBIDDEN, "Access denied.");

  const updated = await prisma.learningGap.update({ where: { id }, data: { status } });

  res.status(StatusCodes.OK).json(
    ApiResponse.success(updated, `Gap marked as ${status.toLowerCase()}`)
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/gaps/:id/re-evaluate  (tutor or admin)
// After tutor intervention, re-checks current mastery. Resolves the gap if
// mastery >= threshold; marks REGRESSED if mastery has dropped.
// ─────────────────────────────────────────────────────────────────────────────
export const triggerReEvaluation = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const gap = await prisma.learningGap.findUnique({
    where: { id },
    include: { topic: { select: { name: true } } },
  });
  if (!gap) throw ApiError(StatusCodes.NOT_FOUND, "Learning gap not found.");

  const isAdmin = req.user?.role === "ADMIN" || req.user?.role === "SUPER_ADMIN";
  if (!isAdmin) {
    const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId }, select: { id: true } });
    const assignment = await prisma.studentTutorAssignment.findFirst({
      where: {
        studentId: gap.studentId,
        tutorProfileId: tutorProfile?.id ?? "",
        status: { in: ["ACTIVE", "PAUSED"] },
      },
    });
    if (!assignment) throw ApiError(StatusCodes.FORBIDDEN, "Access denied.");
  }

  const currentMastery = await prisma.topicMastery.findUnique({
    where: { userId_topicId: { userId: gap.studentId, topicId: gap.topicId } },
    select: { masteryLevel: true },
  });

  if (!currentMastery) {
    res.status(StatusCodes.OK).json(
      ApiResponse.success(
        { improved: false, message: "No updated mastery data yet. Encourage the student to attempt more questions." },
        "Re-evaluation complete"
      )
    );
    return;
  }

  const GAP_THRESHOLD = 70;
  const previousMastery = Number(gap.masteryAtDetection);
  const currentLevel = currentMastery.masteryLevel;
  const improved = currentLevel >= GAP_THRESHOLD;
  const regressed = currentLevel < previousMastery - 5;

  let newStatus: GapStatus = gap.status as GapStatus;
  if (improved) newStatus = "RESOLVED";
  else if (regressed) newStatus = "REGRESSED";

  await prisma.learningGap.update({
    where: { id },
    data: {
      status: newStatus,
      resolvedAt: improved ? new Date() : undefined,
      resolvedMastery: improved ? currentLevel : undefined,
    },
  });

  await prisma.tutorIntervention.updateMany({
    where: { insight: { gapId: id }, aiReEvaluated: false },
    data: { aiReEvaluated: true, postMastery: currentLevel },
  });

  if (improved) {
    await prisma.notification.create({
      data: {
        userId: gap.studentId,
        type: "STUDENT_IMPROVED",
        title: "Gap Resolved — Great Work!",
        body: `Your mastery of "${gap.topic.name}" has improved to ${currentLevel}%. The gap has been marked as resolved.`,
        metadata: { gapId: id, topicId: gap.topicId, newMastery: currentLevel },
      },
    });
  }

  logger.info({ gapId: id, previousMastery, currentLevel, newStatus }, "Gap re-evaluation complete");

  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      { improved, regressed, previousMastery, currentMastery: currentLevel, gapStatus: newStatus },
      improved
        ? "Gap resolved — mastery threshold reached!"
        : regressed
        ? "Mastery has regressed. Further intervention needed."
        : "Student is still working on this area. Keep going."
    )
  );
};

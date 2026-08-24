import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../config/database";
import { ApiResponse, ApiError } from "../utils/ApiResponse";
import { logger } from "../utils/logger";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/insights/me  (tutor)
// Lists all AI-generated insights for the calling tutor, unread first.
// Supports filtering by isRead and isActedOn query params.
// ─────────────────────────────────────────────────────────────────────────────
export const getTutorInsights = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!tutorProfile) throw ApiError(StatusCodes.NOT_FOUND, "Tutor profile not found.");

  const { isRead, isActedOn } = req.query;
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { tutorProfileId: tutorProfile.id };
  if (isRead !== undefined) where.isRead = isRead === "true";
  if (isActedOn !== undefined) where.isActedOn = isActedOn === "true";

  const [insights, total] = await Promise.all([
    prisma.tutorInsight.findMany({
      where,
      include: {
        gap: {
          select: {
            id: true,
            severity: true,
            status: true,
            masteryAtDetection: true,
            detectedAt: true,
            topic: { select: { id: true, name: true, subject: { select: { id: true, name: true } } } },
          },
        },
        student: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        interventions: {
          select: { id: true, completedAt: true, aiReEvaluated: true, postMastery: true },
          orderBy: { completedAt: "desc" },
          take: 1,
        },
      },
      orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
    prisma.tutorInsight.count({ where }),
  ]);

  res.status(StatusCodes.OK).json(ApiResponse.paginated(insights, { total, page, limit }));
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/insights/:id  (tutor)
// Full detail of a single insight including the gap evidence, all
// previous interventions, and student profile snapshot.
// ─────────────────────────────────────────────────────────────────────────────
export const getInsightDetail = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!tutorProfile) throw ApiError(StatusCodes.NOT_FOUND, "Tutor profile not found.");

  const insight = await prisma.tutorInsight.findUnique({
    where: { id },
    include: {
      gap: {
        include: {
          topic: {
            include: { subject: { select: { id: true, name: true } } },
          },
        },
      },
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          studentProfile: {
            select: { gradeLevel: true, curriculum: true, targetExams: true, studyStreakDays: true },
          },
        },
      },
      interventions: {
        orderBy: { completedAt: "desc" },
        include: {
          booking: { select: { id: true, scheduledAt: true, status: true, durationMins: true } },
        },
      },
    },
  });

  if (!insight) throw ApiError(StatusCodes.NOT_FOUND, "Insight not found.");
  if (insight.tutorProfileId !== tutorProfile.id) {
    throw ApiError(StatusCodes.FORBIDDEN, "Access denied.");
  }

  res.status(StatusCodes.OK).json(ApiResponse.success(insight, "Insight detail retrieved"));
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/insights/:id/read  (tutor)
// Marks an insight as read and advances the linked gap from OPEN to
// ACKNOWLEDGED so the student and system know the tutor is aware.
// ─────────────────────────────────────────────────────────────────────────────
export const markInsightRead = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!tutorProfile) throw ApiError(StatusCodes.NOT_FOUND, "Tutor profile not found.");

  const insight = await prisma.tutorInsight.findUnique({ where: { id } });
  if (!insight) throw ApiError(StatusCodes.NOT_FOUND, "Insight not found.");
  if (insight.tutorProfileId !== tutorProfile.id) {
    throw ApiError(StatusCodes.FORBIDDEN, "Access denied.");
  }

  const [updated] = await Promise.all([
    prisma.tutorInsight.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    }),
    // Advance gap from OPEN → ACKNOWLEDGED (only if still OPEN)
    prisma.learningGap.updateMany({
      where: { id: insight.gapId, status: "OPEN" },
      data: { status: "ACKNOWLEDGED" },
    }),
  ]);

  res.status(StatusCodes.OK).json(ApiResponse.success(updated, "Insight marked as read"));
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/insights/:id/intervene  (tutor)
// Tutor logs what they did after reviewing an insight. Creates a
// TutorIntervention record, advances the gap to IN_PROGRESS, marks the
// insight as acted on, and notifies the student.
// Optional bookingId links the intervention to a scheduled session.
// ─────────────────────────────────────────────────────────────────────────────
export const logIntervention = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { action, notes, bookingId } = req.body;
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  if (!action?.trim()) {
    throw ApiError(StatusCodes.BAD_REQUEST, "action is required — describe what you did.");
  }

  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!tutorProfile) throw ApiError(StatusCodes.NOT_FOUND, "Tutor profile not found.");

  const insight = await prisma.tutorInsight.findUnique({
    where: { id },
    include: {
      gap: {
        select: { id: true, studentId: true, topicId: true, topic: { select: { name: true } } },
      },
    },
  });
  if (!insight) throw ApiError(StatusCodes.NOT_FOUND, "Insight not found.");
  if (insight.tutorProfileId !== tutorProfile.id) {
    throw ApiError(StatusCodes.FORBIDDEN, "Access denied.");
  }

  // Validate the booking belongs to this tutor+student pair if supplied
  if (bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { tutorProfileId: true, studentId: true },
    });
    if (!booking || booking.tutorProfileId !== tutorProfile.id) {
      throw ApiError(StatusCodes.BAD_REQUEST, "Invalid booking reference.");
    }
    if (booking.studentId !== insight.gap.studentId) {
      throw ApiError(StatusCodes.BAD_REQUEST, "Booking does not belong to this student.");
    }
  }

  const intervention = await prisma.tutorIntervention.create({
    data: {
      insightId: id,
      tutorProfileId: tutorProfile.id,
      studentId: insight.gap.studentId,
      bookingId: bookingId ?? null,
      action,
      notes: notes ?? null,
      completedAt: new Date(),
    },
  });

  // Update insight and gap state in parallel
  await Promise.all([
    prisma.tutorInsight.update({
      where: { id },
      data: { isActedOn: true, actedOnAt: new Date() },
    }),
    prisma.learningGap.update({
      where: { id: insight.gapId },
      data: { status: "IN_PROGRESS" },
    }),
    prisma.notification.create({
      data: {
        userId: insight.gap.studentId,
        type: "INTERVENTION_REQUIRED",
        title: "Your Tutor Has Taken Action",
        body: `Your tutor has reviewed your performance in "${insight.gap.topic.name}" and made adjustments to your learning plan. Keep practising!`,
        metadata: { interventionId: intervention.id, topicId: insight.gap.topicId },
      },
    }),
  ]);

  logger.info(
    { interventionId: intervention.id, insightId: id, tutorProfileId: tutorProfile.id },
    "Tutor intervention logged"
  );

  res.status(StatusCodes.CREATED).json(
    ApiResponse.success(intervention, "Intervention logged successfully")
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/insights/interventions  (tutor)
// Paginated history of all interventions made by the calling tutor,
// including the linked student, gap topic, and session if applicable.
// ─────────────────────────────────────────────────────────────────────────────
export const getInterventionHistory = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!tutorProfile) throw ApiError(StatusCodes.NOT_FOUND, "Tutor profile not found.");

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const skip = (page - 1) * limit;

  const [interventions, total] = await Promise.all([
    prisma.tutorIntervention.findMany({
      where: { tutorProfileId: tutorProfile.id },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        insight: {
          select: {
            id: true,
            aiSummary: true,
            gap: { select: { topic: { select: { id: true, name: true } }, severity: true } },
          },
        },
        booking: { select: { id: true, scheduledAt: true, status: true } },
      },
      orderBy: { completedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.tutorIntervention.count({ where: { tutorProfileId: tutorProfile.id } }),
  ]);

  res.status(StatusCodes.OK).json(ApiResponse.paginated(interventions, { total, page, limit }));
};

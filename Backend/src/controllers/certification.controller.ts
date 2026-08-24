import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ExamCategory } from "@prisma/client";
import { prisma } from "../config/database";
import { ApiResponse, ApiError } from "../utils/ApiResponse";
import { logger } from "../utils/logger";

// Minimum AI readiness score for a student to request certification
const READINESS_THRESHOLD = 75;

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/certifications/me  (student)
// Returns all certification records for the calling student across all
// exam categories, latest first.
// ─────────────────────────────────────────────────────────────────────────────
export const getMyCertifications = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const certifications = await prisma.examReadinessCertification.findMany({
    where: { studentId: userId },
    orderBy: { createdAt: "desc" },
  });

  res.status(StatusCodes.OK).json(
    ApiResponse.success(certifications, "Certifications retrieved")
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/certifications/me/readiness  (student)
// Computes the student's live AI readiness score from TopicMastery data,
// shows a subject-level breakdown, counts open learning gaps, and indicates
// whether the student is eligible to request certification.
// Optional ?examCategory= filter scopes the response to a specific exam.
// ─────────────────────────────────────────────────────────────────────────────
export const getReadinessStatus = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const { examCategory } = req.query;

  const [topicMastery, openGapsCount, existingCert] = await Promise.all([
    prisma.topicMastery.findMany({
      where: { userId },
      include: {
        topic: { include: { subject: { select: { id: true, name: true } } } },
      },
    }),
    prisma.learningGap.count({
      where: {
        studentId: userId,
        status: { in: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS"] },
      },
    }),
    examCategory
      ? prisma.examReadinessCertification.findFirst({
          where: { studentId: userId, examCategory: examCategory as ExamCategory },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve(null),
  ]);

  if (topicMastery.length === 0) {
    res.status(StatusCodes.OK).json(
      ApiResponse.success(
        {
          aiReadinessScore: 0,
          readinessLevel: "NOT_STARTED",
          openGaps: 0,
          subjectBreakdown: [],
          certification: null,
          eligibleForCertification: false,
          message: "Complete some quizzes or lessons first to generate your readiness score.",
        },
        "Readiness status retrieved"
      )
    );
    return;
  }

  const aiReadinessScore = Math.round(
    topicMastery.reduce((s, t) => s + t.masteryLevel, 0) / topicMastery.length
  );

  // Build per-subject breakdown
  const subjectMap: Record<string, { name: string; scores: number[] }> = {};
  topicMastery.forEach((tm) => {
    const subj = tm.topic.subject;
    if (!subjectMap[subj.id]) subjectMap[subj.id] = { name: subj.name, scores: [] };
    subjectMap[subj.id].scores.push(tm.masteryLevel);
  });
  const subjectBreakdown = Object.entries(subjectMap).map(([subjectId, data]) => ({
    subjectId,
    name: data.name,
    avgScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
    topicsCount: data.scores.length,
  }));

  const readinessLevel =
    aiReadinessScore < 40 ? "NOT_READY" :
    aiReadinessScore < 60 ? "NEEDS_WORK" :
    aiReadinessScore < 75 ? "NEARLY_READY" :
    aiReadinessScore < 90 ? "EXAM_READY" : "OUTSTANDING";

  const eligibleForCertification = aiReadinessScore >= READINESS_THRESHOLD && openGapsCount === 0;

  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      {
        aiReadinessScore,
        readinessLevel,
        openGaps: openGapsCount,
        subjectBreakdown,
        certification: existingCert,
        eligibleForCertification,
        thresholdRequired: READINESS_THRESHOLD,
      },
      "Readiness status retrieved"
    )
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/certifications/request  (student)
// Student requests an exam readiness certification. AI validates the score
// and open gap count before creating a PENDING_REVIEW record. The assigned
// tutor is notified to review and co-sign.
// ─────────────────────────────────────────────────────────────────────────────
export const requestCertification = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const { examCategory } = req.body;
  if (!examCategory) throw ApiError(StatusCodes.BAD_REQUEST, "examCategory is required.");

  // Block duplicate pending/certified requests
  const existing = await prisma.examReadinessCertification.findFirst({
    where: {
      studentId: userId,
      examCategory,
      status: { in: ["PENDING_REVIEW", "CERTIFIED"] },
    },
  });
  if (existing) {
    throw ApiError(
      StatusCodes.CONFLICT,
      "A certification is already pending or active for this exam category."
    );
  }

  const [topicMastery, openGapsCount, assignment] = await Promise.all([
    prisma.topicMastery.findMany({
      where: { userId },
      include: { topic: { include: { subject: { select: { id: true, name: true } } } } },
    }),
    prisma.learningGap.count({
      where: {
        studentId: userId,
        status: { in: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS"] },
      },
    }),
    prisma.studentTutorAssignment.findFirst({
      where: { studentId: userId, status: "ACTIVE" },
      include: { tutorProfile: { select: { userId: true } } },
    }),
  ]);

  if (topicMastery.length === 0) {
    throw ApiError(
      StatusCodes.BAD_REQUEST,
      "No study data found. Complete some quizzes or exams first."
    );
  }

  const aiReadinessScore = Math.round(
    topicMastery.reduce((s, t) => s + t.masteryLevel, 0) / topicMastery.length
  );

  if (aiReadinessScore < READINESS_THRESHOLD) {
    throw ApiError(
      StatusCodes.FORBIDDEN,
      `Your readiness score (${aiReadinessScore}%) is below the minimum threshold (${READINESS_THRESHOLD}%). Keep studying and close your open gaps first.`
    );
  }

  if (openGapsCount > 0) {
    throw ApiError(
      StatusCodes.FORBIDDEN,
      `You have ${openGapsCount} unresolved learning gap(s). Work with your tutor to resolve them before requesting certification.`
    );
  }

  // Build subject-level score breakdown for the certificate record
  const subjectMap: Record<string, { name: string; scores: number[] }> = {};
  topicMastery.forEach((tm) => {
    const subj = tm.topic.subject;
    if (!subjectMap[subj.id]) subjectMap[subj.id] = { name: subj.name, scores: [] };
    subjectMap[subj.id].scores.push(tm.masteryLevel);
  });
  const subjectBreakdown: Record<string, number> = {};
  Object.entries(subjectMap).forEach(([id, data]) => {
    subjectBreakdown[id] = Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length);
  });

  const certification = await prisma.examReadinessCertification.create({
    data: {
      studentId: userId,
      assignmentId: assignment?.id ?? null,
      examCategory,
      aiReadinessScore,
      subjectBreakdown,
      openGapsCount: 0,
      status: "PENDING_REVIEW",
    },
  });

  // Notify the assigned tutor to review and co-sign
  if (assignment) {
    await prisma.notification.create({
      data: {
        userId: assignment.tutorProfile.userId,
        type: "CERTIFICATION_READY",
        title: "Student Exam Readiness — Review Required",
        body: `A student has requested ${examCategory} exam readiness certification with an AI score of ${aiReadinessScore}%. Please review and co-sign.`,
        metadata: {
          certificationId: certification.id,
          examCategory,
          aiScore: aiReadinessScore,
        },
      },
    });
  }

  logger.info(
    { certificationId: certification.id, studentId: userId, examCategory, aiReadinessScore },
    "Exam readiness certification requested"
  );

  res.status(StatusCodes.CREATED).json(
    ApiResponse.success(
      certification,
      assignment
        ? "Certification request submitted. Your tutor has been notified to review and co-sign."
        : "Certification request submitted. An admin will review your readiness."
    )
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/certifications/:id/co-sign  (tutor)
// Tutor reviews the AI score and formally certifies the student as
// exam-ready. Status moves to CERTIFIED. Student is notified.
// ─────────────────────────────────────────────────────────────────────────────
export const tutorCoSign = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { notes } = req.body;
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!tutorProfile) throw ApiError(StatusCodes.NOT_FOUND, "Tutor profile not found.");

  const certification = await prisma.examReadinessCertification.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!certification) throw ApiError(StatusCodes.NOT_FOUND, "Certification not found.");
  if (certification.status !== "PENDING_REVIEW") {
    throw ApiError(StatusCodes.CONFLICT, "Only PENDING_REVIEW certifications can be co-signed.");
  }

  // Tutor must have an active/paused assignment with this student
  const assignment = await prisma.studentTutorAssignment.findFirst({
    where: {
      studentId: certification.studentId,
      tutorProfileId: tutorProfile.id,
      status: { in: ["ACTIVE", "PAUSED"] },
    },
  });
  if (!assignment) {
    throw ApiError(StatusCodes.FORBIDDEN, "You are not assigned to this student.");
  }

  const now = new Date();
  const updated = await prisma.examReadinessCertification.update({
    where: { id },
    data: {
      status: "CERTIFIED",
      tutorReviewedBy: tutorProfile.id,
      tutorCoSignedAt: now,
      tutorNotes: notes ?? null,
      certifiedAt: now,
    },
  });

  await prisma.notification.create({
    data: {
      userId: certification.studentId,
      type: "CERTIFICATION_READY",
      title: "You Are Exam-Ready! 🎓",
      body: `Congratulations ${certification.student.firstName}! Your tutor has officially certified you as ready for the ${certification.examCategory} exam. You've earned it!`,
      metadata: { certificationId: id, examCategory: certification.examCategory },
    },
  });

  logger.info(
    { certificationId: id, studentId: certification.studentId, tutorProfileId: tutorProfile.id },
    "Exam readiness certification co-signed"
  );

  res.status(StatusCodes.OK).json(
    ApiResponse.success(updated, "Student has been certified as exam-ready")
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/certifications/:id/defer  (tutor)
// Tutor decides the student needs more preparation. Status moves to DEFERRED
// with a mandatory reason. Student is notified to keep working.
// ─────────────────────────────────────────────────────────────────────────────
export const tutorDefer = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  if (!reason?.trim()) {
    throw ApiError(StatusCodes.BAD_REQUEST, "Deferral reason is required.");
  }

  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!tutorProfile) throw ApiError(StatusCodes.NOT_FOUND, "Tutor profile not found.");

  const certification = await prisma.examReadinessCertification.findUnique({ where: { id } });
  if (!certification) throw ApiError(StatusCodes.NOT_FOUND, "Certification not found.");
  if (certification.status !== "PENDING_REVIEW") {
    throw ApiError(StatusCodes.CONFLICT, "Only PENDING_REVIEW certifications can be deferred.");
  }

  const assignment = await prisma.studentTutorAssignment.findFirst({
    where: {
      studentId: certification.studentId,
      tutorProfileId: tutorProfile.id,
      status: { in: ["ACTIVE", "PAUSED"] },
    },
  });
  if (!assignment) {
    throw ApiError(StatusCodes.FORBIDDEN, "You are not assigned to this student.");
  }

  const updated = await prisma.examReadinessCertification.update({
    where: { id },
    data: {
      status: "DEFERRED",
      tutorReviewedBy: tutorProfile.id,
      tutorCoSignedAt: new Date(),
      deferredReason: reason,
    },
  });

  await prisma.notification.create({
    data: {
      userId: certification.studentId,
      type: "EXAM_READINESS_UPDATED",
      title: "Certification Deferred — Keep Going",
      body: `Your tutor has reviewed your readiness and recommends further preparation before the ${certification.examCategory} exam. Check your learning gaps and keep improving!`,
      metadata: { certificationId: id, reason },
    },
  });

  logger.info(
    { certificationId: id, studentId: certification.studentId, reason },
    "Exam readiness certification deferred"
  );

  res.status(StatusCodes.OK).json(
    ApiResponse.success(updated, "Certification deferred — student notified to continue preparation")
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/certifications/verify/:certificationId  (public)
// Public verification endpoint — anyone with the certification ID can
// confirm a student's exam readiness credential (employers, exam boards, etc.)
// ─────────────────────────────────────────────────────────────────────────────
export const verifyCertification = async (req: Request, res: Response): Promise<void> => {
  const { certificationId } = req.params;

  const certification = await prisma.examReadinessCertification.findUnique({
    where: { id: certificationId },
    select: {
      id: true,
      examCategory: true,
      aiReadinessScore: true,
      status: true,
      certifiedAt: true,
      tutorCoSignedAt: true,
      student: { select: { firstName: true, lastName: true } },
    },
  });

  if (!certification || certification.status !== "CERTIFIED") {
    res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      message: "Certification not found or has not been issued.",
    });
    return;
  }

  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      {
        credentialId: certification.id,
        studentName: `${certification.student.firstName} ${certification.student.lastName}`,
        examCategory: certification.examCategory,
        readinessScore: certification.aiReadinessScore,
        certifiedAt: certification.certifiedAt,
        tutorVerifiedAt: certification.tutorCoSignedAt,
        status: "VALID",
      },
      "Certification is valid"
    )
  );
};

import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../config/database";
import { ApiResponse, ApiError } from "../utils/ApiResponse";

// POST /api/v1/tutors/apply
// Saves profile fields + creates a formal TutorApplication in one transaction.
// Sets applicationStatus → UNDER_REVIEW so the admin queue picks it up.
export const applyAsTutor = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const {
    bio, qualifications, specializations, subjectIds,
    yearsOfExperience, hourlyRate, coverLetter,
  } = req.body;

  if (!bio || bio.trim().length < 50) {
    throw ApiError(StatusCodes.BAD_REQUEST, "Bio must be at least 50 characters.");
  }

  const profile = await prisma.tutorProfile.findUnique({
    where: { userId },
    include: { application: true },
  });
  if (!profile) throw ApiError(StatusCodes.NOT_FOUND, "Tutor profile not found.");
  if (profile.application) {
    throw ApiError(StatusCodes.CONFLICT, "You have already submitted an application.");
  }

  await prisma.$transaction([
    prisma.tutorProfile.update({
      where: { userId },
      data: {
        bio: bio.trim(),
        qualifications:  qualifications  ?? [],
        specializations: specializations ?? [],
        subjectIds:      subjectIds      ?? [],
        yearsOfExperience: Number(yearsOfExperience ?? 0),
        ...(hourlyRate !== undefined && { hourlyRate: Number(hourlyRate) }),
        applicationStatus: "UNDER_REVIEW",
      },
    }),
    prisma.tutorApplication.create({
      data: {
        tutorProfileId: profile.id,
        status:         "UNDER_REVIEW",
        coverLetter:    coverLetter ?? null,
        submittedAt:    new Date(),
      },
    }),
  ]);

  res.status(StatusCodes.CREATED).json(
    ApiResponse.success(null, "Application submitted. You'll hear from us within 48 hours.")
  );
};

// PATCH /api/v1/tutors/me
export const updateTutorProfile = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const { bio, qualifications, specializations, subjectIds, yearsOfExperience, hourlyRate } = req.body;

  const profile = await prisma.tutorProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) throw ApiError(StatusCodes.NOT_FOUND, "Tutor profile not found.");

  const updated = await prisma.tutorProfile.update({
    where: { userId },
    data: {
      ...(bio              !== undefined && { bio }),
      ...(qualifications   !== undefined && { qualifications }),
      ...(specializations  !== undefined && { specializations }),
      ...(subjectIds       !== undefined && { subjectIds }),
      ...(yearsOfExperience !== undefined && { yearsOfExperience: Number(yearsOfExperience) }),
      ...(hourlyRate       !== undefined && { hourlyRate: Number(hourlyRate) }),
    },
  });

  res.status(StatusCodes.OK).json(ApiResponse.success(updated, "Profile updated successfully."));
};

// GET /api/v1/tutors/me/dashboard
export const getTutorDashboard = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      rating: true,
      totalReviews: true,
      totalSessions: true,
      isVerified: true,
      applicationStatus: true,
    },
  });
  if (!tutorProfile) throw ApiError(StatusCodes.NOT_FOUND, "Tutor profile not found.");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    unreadInsightsCount,
    totalInsightsCount,
    upcomingBookings,
    completedSessions,
    assignments,
    monthlyEarnings,
    totalEarnings,
  ] = await Promise.all([
    prisma.tutorInsight.count({
      where: { tutorProfileId: tutorProfile.id, isRead: false },
    }),
    prisma.tutorInsight.count({
      where: { tutorProfileId: tutorProfile.id },
    }),
    prisma.booking.findMany({
      where: {
        tutorProfileId: tutorProfile.id,
        scheduledAt: { gte: now, lte: nextWeek },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: {
        id: true,
        subject: true,
        topic: true,
        scheduledAt: true,
        durationMins: true,
        status: true,
        student: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
      orderBy: { scheduledAt: "asc" },
      take: 5,
    }),
    prisma.booking.count({
      where: { tutorProfileId: tutorProfile.id, status: "COMPLETED" },
    }),
    prisma.studentTutorAssignment.findMany({
      where: { tutorProfileId: tutorProfile.id, status: "ACTIVE" },
      select: {
        id: true,
        studentId: true,
        startedAt: true,
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            studentProfile: {
              select: { gradeLevel: true, curriculum: true, studyStreakDays: true },
            },
          },
        },
        subject: { select: { name: true } },
        gaps: {
          where: { status: { in: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS"] } },
          select: { id: true },
        },
      },
      take: 12,
    }),
    prisma.tutorEarning.aggregate({
      where: { tutorProfileId: tutorProfile.id, createdAt: { gte: startOfMonth } },
      _sum: { netAmount: true },
    }),
    prisma.tutorEarning.aggregate({
      where: { tutorProfileId: tutorProfile.id },
      _sum: { netAmount: true },
    }),
  ]);

  // Latest quiz score per assigned student
  const studentIds = assignments.map((a) => a.studentId);
  const recentAttempts =
    studentIds.length > 0
      ? await prisma.quizAttempt.findMany({
          where: { userId: { in: studentIds }, completedAt: { not: null } },
          select: { userId: true, percentage: true, completedAt: true },
          orderBy: { completedAt: "desc" },
          take: studentIds.length * 5,
        })
      : [];

  const lastScoreByStudent = new Map<string, number>();
  for (const attempt of recentAttempts) {
    if (!lastScoreByStudent.has(attempt.userId)) {
      lastScoreByStudent.set(attempt.userId, Number(attempt.percentage));
    }
  }

  const students = assignments.map((a) => ({
    assignmentId: a.id,
    studentId: a.studentId,
    firstName: a.student.firstName,
    lastName: a.student.lastName,
    avatar: a.student.avatar ?? null,
    subject: a.subject.name,
    gradeLevel: a.student.studentProfile?.gradeLevel ?? null,
    curriculum: a.student.studentProfile?.curriculum ?? null,
    streakDays: a.student.studentProfile?.studyStreakDays ?? 0,
    openGaps: a.gaps.length,
    lastScore: lastScoreByStudent.get(a.studentId) ?? null,
    startedAt: a.startedAt,
  }));

  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      {
        profile: {
          id: tutorProfile.id,
          rating: Number(tutorProfile.rating),
          totalReviews: tutorProfile.totalReviews,
          totalSessions: tutorProfile.totalSessions,
          isVerified: tutorProfile.isVerified,
          applicationStatus: tutorProfile.applicationStatus,
        },
        stats: {
          unreadInsights: unreadInsightsCount,
          totalInsights: totalInsightsCount,
          assignedStudents: assignments.length,
          upcomingBookings: upcomingBookings.length,
          completedSessions,
          monthlyEarnings: Number(monthlyEarnings._sum.netAmount ?? 0),
          totalEarnings: Number(totalEarnings._sum.netAmount ?? 0),
        },
        students,
        upcomingBookings,
      },
      "Tutor dashboard retrieved"
    )
  );
};

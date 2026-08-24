import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../config/database";
import { ApiResponse, ApiError } from "../utils/ApiResponse";
import { logger } from "../utils/logger";
import { User } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

type SafeUser = Omit<User, "passwordHash" | "refreshTokenHash" | "suspendedBy">;

const sanitizeUser = (user: User): SafeUser => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // suspendedBy is an admin user id — the suspended user has no need for it.
  const { passwordHash, refreshTokenHash, suspendedBy, ...safe } = user;
  return safe;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/users/me — Fetch current user profile
// ─────────────────────────────────────────────────────────────────────────────
export const getMe = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      studentProfile: true,
      tutorProfile: true,
      subscription: true,
      badges: { include: { badge: true } },
    },
  });

  if (!user) throw ApiError(StatusCodes.NOT_FOUND, "User not found.");

  logger.debug({ userId }, "Fetched user profile");

  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      {
        user: sanitizeUser(user),
        studentProfile: user.studentProfile,
        tutorProfile: user.tutorProfile,
        subscription: user.subscription,
        badges: user.badges.map((ub) => ub.badge),
      },
      "Profile retrieved successfully"
    )
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/users/me — Update user profile
// ─────────────────────────────────────────────────────────────────────────────
export const updateMe = async (
  req: Request<
    object,
    object,
    {
      firstName?: string;
      lastName?: string;
      phone?: string;
      gradeLevel?: string;
      curriculum?: string;
      school?: string;
      state?: string;
      weeklyGoalMins?: number;
      targetExams?: string[];
      preferredSubjectIds?: string[];
    }
  >,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const {
    firstName, lastName, phone,
    gradeLevel, curriculum, school, state,
    weeklyGoalMins, targetExams, preferredSubjectIds,
  } = req.body;

  // Update user base fields
  const userUpdates: { [key: string]: unknown } = {};
  if (firstName !== undefined) userUpdates.firstName = firstName;
  if (lastName !== undefined) userUpdates.lastName = lastName;
  if (phone !== undefined) userUpdates.phone = phone;

  // Update user and student profile in transaction
  const updatedUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: userUpdates,
    });

    // Update student profile if STUDENT role
    if (user.role === "STUDENT") {
      const updateData: { [key: string]: unknown } = {};
      if (gradeLevel !== undefined) updateData.gradeLevel = gradeLevel;
      if (curriculum !== undefined) updateData.curriculum = curriculum;
      if (school !== undefined) updateData.school = school;
      if (state !== undefined) updateData.state = state;
      if (weeklyGoalMins !== undefined) updateData.weeklyGoalMins = weeklyGoalMins;
      if (targetExams !== undefined) updateData.targetExams = targetExams;
      if (preferredSubjectIds !== undefined) updateData.preferredSubjectIds = preferredSubjectIds;

      if (Object.keys(updateData).length > 0) {
        await tx.studentProfile.update({
          where: { userId },
          data: updateData,
        });
      }
    }

    return user;
  });

  logger.info({ userId }, "User profile updated");

  res
    .status(StatusCodes.OK)
    .json(
      ApiResponse.success(sanitizeUser(updatedUser), "Profile updated successfully")
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/users/me/avatar — Upload/update user avatar
// ─────────────────────────────────────────────────────────────────────────────
export const updateAvatar = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  // Expects file.url from multer or cloud storage middleware
  const avatarUrl = (req as { file?: { url: string } }).file?.url;
  if (!avatarUrl) {
    throw ApiError(StatusCodes.BAD_REQUEST, "No avatar file provided.");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { avatar: avatarUrl },
  });

  logger.info({ userId }, "Avatar updated");

  res
    .status(StatusCodes.OK)
    .json(
      ApiResponse.success({ avatar: updatedUser.avatar }, "Avatar updated successfully")
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/users/me/dashboard — Fetch user dashboard summary
// ─────────────────────────────────────────────────────────────────────────────
export const getDashboard = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const [
    user,
    enrolledCourses,
    completedCourses,
    activeStudyPlan,
    recentBadges,
    currentStreak,
    totalXp,
    topicMastery,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: { studentProfile: true, subscription: true },
    }),
    prisma.enrollment.count({ where: { userId } }),
    prisma.enrollment.count({ where: { userId, isCompleted: true } }),
    prisma.studyPlan.findFirst({
      where: { userId, status: "ACTIVE" },
      include: { items: true },
    }),
    prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      take: 5,
      orderBy: { earnedAt: "desc" },
    }),
    prisma.studentProfile.findUnique({
      where: { userId },
      select: { studyStreakDays: true },
    }),
    prisma.studentProfile.findUnique({
      where: { userId },
      select: { totalXp: true },
    }),
    prisma.topicMastery.findMany({
      where: { userId },
      orderBy: { masteryLevel: "desc" },
      take: 5,
    }),
  ]);

  if (!user) throw ApiError(StatusCodes.NOT_FOUND, "User not found.");

  logger.debug({ userId }, "Dashboard fetched");

  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      {
        user: sanitizeUser(user),
        enrolledCourses,
        completedCourses,
        currentStreak: currentStreak?.studyStreakDays ?? 0,
        totalXp: totalXp?.totalXp ?? 0,
        subscription: user.subscription,
        activeStudyPlan,
        recentBadges: recentBadges.map((ub) => ub.badge),
        topicsByMastery: topicMastery,
      },
      "Dashboard retrieved successfully"
    )
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/users/me/badges — Fetch all user badges
// ─────────────────────────────────────────────────────────────────────────────
export const getBadges = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const badges = await prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true },
    orderBy: { earnedAt: "desc" },
  });

  logger.debug({ userId, count: badges.length }, "Badges fetched");

  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      badges.map((ub) => ({ ...ub.badge, earnedAt: ub.earnedAt })),
      "Badges retrieved successfully"
    )
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/users/me/streak — Fetch current study streak
// ─────────────────────────────────────────────────────────────────────────────
export const getStreak = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: { studyStreakDays: true, longestStreak: true, lastStudyDate: true },
  });

  if (!studentProfile) {
    throw ApiError(StatusCodes.NOT_FOUND, "Student profile not found.");
  }

  logger.debug({ userId }, "Streak data fetched");

  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      {
        currentStreak: studentProfile.studyStreakDays,
        longestStreak: studentProfile.longestStreak,
        lastStudyDate: studentProfile.lastStudyDate,
      },
      "Streak retrieved successfully"
    )
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/users/me/activity — Fetch user activity/study sessions
// ─────────────────────────────────────────────────────────────────────────────
export const getActivity = async (
  req: Request<object, object, object, { days?: string; limit?: string }>,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const days = Math.min(Number(req.query.days) || 30, 365); // max 1 year
  const limit = Math.min(Number(req.query.limit) || 50, 200);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const sessions = await prisma.studySession.findMany({
    where: { userId, createdAt: { gte: startDate } },
    include: { lesson: { select: { title: true, courseId: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  // Build heatmap data (date -> total minutes)
  const heatmap: { [date: string]: number } = {};
  sessions.forEach((session) => {
    const dateKey = session.date.toISOString().split("T")[0];
    heatmap[dateKey] = (heatmap[dateKey] ?? 0) + session.durationMins;
  });

  logger.debug({ userId, count: sessions.length }, "Activity fetched");

  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      { sessions, heatmap, totalMinutes: sessions.reduce((s, x) => s + x.durationMins, 0) },
      "Activity retrieved successfully"
    )
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/users/me/certificates — Fetch user certificates
// ─────────────────────────────────────────────────────────────────────────────
export const getCertificates = async (
  req: Request<object, object, object, { page?: string; limit?: string }>,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const [certificates, total] = await Promise.all([
    prisma.certificate.findMany({
      where: { userId },
      include: { course: { select: { title: true, slug: true, thumbnail: true } } },
      orderBy: { issuedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.certificate.count({ where: { userId } }),
  ]);

  logger.debug({ userId, count: certificates.length, total }, "Certificates fetched");

  res.status(StatusCodes.OK).json(
    ApiResponse.paginated(certificates, { total, page, limit })
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/users/me/bookmarks — Fetch user bookmarks
// ─────────────────────────────────────────────────────────────────────────────
export const getBookmarks = async (
  req: Request<object, object, object, { page?: string; limit?: string }>,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const [bookmarks, total] = await Promise.all([
    prisma.bookmark.findMany({
      where: { userId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            slug: true,
            courseId: true,
            course: { select: { title: true, thumbnail: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.bookmark.count({ where: { userId } }),
  ]);

  logger.debug({ userId, count: bookmarks.length, total }, "Bookmarks fetched");

  res.status(StatusCodes.OK).json(
    ApiResponse.paginated(bookmarks, { total, page, limit })
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/v1/users/me/bookmarks/:lessonId — Delete a bookmark
// ─────────────────────────────────────────────────────────────────────────────
export const deleteBookmark = async (
  req: Request<{ lessonId: string }>,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  const { lessonId } = req.params;

  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");
  if (!lessonId) throw ApiError(StatusCodes.BAD_REQUEST, "Lesson ID required.");

  const bookmark = await prisma.bookmark.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });

  if (!bookmark) {
    throw ApiError(StatusCodes.NOT_FOUND, "Bookmark not found.");
  }

  await prisma.bookmark.delete({
    where: { userId_lessonId: { userId, lessonId } },
  });

  logger.info({ userId, lessonId }, "Bookmark deleted");

  res.status(StatusCodes.OK).json(ApiResponse.success(null, "Bookmark deleted successfully"));
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/users/me/password — Change password (requires current password)
// ─────────────────────────────────────────────────────────────────────────────
export const changePassword = async (
  req: Request<object, object, { currentPassword: string; newPassword: string }>,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw ApiError(StatusCodes.BAD_REQUEST, "currentPassword and newPassword are required.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    throw ApiError(StatusCodes.BAD_REQUEST, "Password change is not available for OAuth accounts.");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    throw ApiError(StatusCodes.UNAUTHORIZED, "Current password is incorrect.");
  }

  if (newPassword.length < 8) {
    throw ApiError(StatusCodes.BAD_REQUEST, "New password must be at least 8 characters.");
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  logger.info({ userId }, "Password changed");

  res.status(StatusCodes.OK).json(ApiResponse.success(null, "Password changed successfully."));
};

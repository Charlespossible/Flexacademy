import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Prisma, CourseStatus } from "@prisma/client";
import { prisma } from "../config/database";
import { ApiResponse, ApiError } from "../utils/ApiResponse";
import { logger } from "../utils/logger";

// GET /admin/stats
export const getAdminStats = async (_req: Request, res: Response): Promise<void> => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [usersByRole, pendingApplications, approvedTutors, recentSignups, paidSubscriptions] =
    await Promise.all([
      prisma.user.groupBy({ by: ["role"], _count: { id: true } }),
      prisma.tutorApplication.count({
        where: { status: { in: ["PENDING", "UNDER_REVIEW"] } },
      }),
      prisma.tutorApplication.count({ where: { status: "APPROVED" } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.subscription.count({
        where: { status: "ACTIVE", tier: { not: "FREE" } },
      }),
    ]);

  const roleMap = usersByRole.reduce<Record<string, number>>((acc, r) => {
    acc[r.role] = r._count.id;
    return acc;
  }, {});

  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      {
        users: {
          total: Object.values(roleMap).reduce((a, b) => a + b, 0),
          students: roleMap.STUDENT ?? 0,
          tutors: roleMap.TUTOR ?? 0,
          parents: roleMap.PARENT ?? 0,
          admins: (roleMap.ADMIN ?? 0) + (roleMap.SUPER_ADMIN ?? 0),
        },
        applications: {
          pending: pendingApplications,
          approved: approvedTutors,
        },
        recentSignups,
        paidSubscriptions,
      },
      "Admin stats retrieved"
    )
  );
};

// GET /admin/tutors/applications
export const getTutorApplications = async (req: Request, res: Response): Promise<void> => {
  const { status, page = "1", limit = "15" } = req.query;
  const pageNum = Math.max(1, parseInt(page as string));
  const limitNum = Math.min(50, parseInt(limit as string));
  const skip = (pageNum - 1) * limitNum;

  const where: Prisma.TutorApplicationWhereInput = status
    ? { status: status as Prisma.EnumTutorApplicationStatusFilter }
    : {};

  const [applications, total] = await Promise.all([
    prisma.tutorApplication.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { submittedAt: "desc" },
      include: {
        tutorProfile: {
          select: {
            id: true,
            bio: true,
            qualifications: true,
            specializations: true,
            subjectIds: true,
            yearsOfExperience: true,
            hourlyRate: true,
            applicationStatus: true,
            isVerified: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
                createdAt: true,
                isActive: true,
              },
            },
          },
        },
      },
    }),
    prisma.tutorApplication.count({ where }),
  ]);

  // Resolve subject IDs → names in one extra query
  const allSubjectIds = [
    ...new Set(applications.flatMap((a) => a.tutorProfile.subjectIds as string[])),
  ];
  const subjects =
    allSubjectIds.length > 0
      ? await prisma.subject.findMany({
          where: { id: { in: allSubjectIds } },
          select: { id: true, name: true },
        })
      : [];
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));

  const enriched = applications.map((a) => ({
    ...a,
    tutorProfile: {
      ...a.tutorProfile,
      subjects: (a.tutorProfile.subjectIds as string[]).map((id) => ({
        id,
        name: subjectMap.get(id) ?? id,
      })),
    },
  }));

  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      {
        applications: enriched,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
      "Tutor applications retrieved"
    )
  );
};

// PATCH /admin/tutors/:id/approve   (:id = TutorProfile.id)
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/admin/courses — content review queue
// ─────────────────────────────────────────────────────────────────────────────
export const getCourseSubmissions = async (
  req: Request,
  res: Response
): Promise<void> => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  // Defaults to the review queue; pass ?status=APPROVED etc. to see others.
  const status = (req.query.status as CourseStatus | undefined) ?? "PENDING_REVIEW";

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where: { status },
      orderBy: { submittedAt: "asc" }, // oldest submission first — fair queue
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        difficulty: true,
        status: true,
        totalLessons: true,
        totalDuration: true,
        submittedAt: true,
        reviewNote: true,
        subject: { select: { id: true, name: true } },
        tutorProfile: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true, email: true, avatar: true } },
          },
        },
        lessons: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            contentType: true,
            videoUrl: true,
            duration: true,
            order: true,
            isFree: true,
          },
        },
      },
    }),
    prisma.course.count({ where: { status } }),
  ]);

  res
    .status(StatusCodes.OK)
    .json(ApiResponse.paginated(courses, { total, page, limit }));
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/admin/courses/:id/review — approve or reject submitted content
// ─────────────────────────────────────────────────────────────────────────────
export const reviewCourse = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { action, reviewNote } = req.body as {
    action: "approve" | "reject";
    reviewNote?: string;
  };
  const adminId = req.user?.id;

  if (!action || !["approve", "reject"].includes(action)) {
    throw ApiError(StatusCodes.BAD_REQUEST, "action must be 'approve' or 'reject'.");
  }
  if (action === "reject" && !reviewNote?.trim()) {
    throw ApiError(StatusCodes.BAD_REQUEST, "A review note is required when rejecting.");
  }

  const course = await prisma.course.findUnique({
    where: { id },
    include: { tutorProfile: { select: { userId: true } } },
  });
  if (!course) throw ApiError(StatusCodes.NOT_FOUND, "Course not found.");
  if (course.status !== "PENDING_REVIEW") {
    throw ApiError(StatusCodes.CONFLICT, "This course is not awaiting review.");
  }

  const approved = action === "approve";

  const updated = await prisma.$transaction(async (tx) => {
    // isPublished is what student-facing queries filter on, so approval flips
    // both it and the workflow status together.
    const c = await tx.course.update({
      where: { id },
      data: {
        status: approved ? "APPROVED" : "REJECTED",
        isPublished: approved,
        publishedAt: approved ? new Date() : null,
        reviewNote: reviewNote?.trim() ?? null,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });

    // Tell the author. Without this a rejection is invisible until they happen
    // to revisit the course, and feedback that isn't seen may as well not exist.
    if (course.tutorProfile?.userId) {
      await tx.notification.create({
        data: {
          userId: course.tutorProfile.userId,
          type: approved ? "COURSE_APPROVED" : "COURSE_REJECTED",
          title: approved
            ? `"${course.title}" is now live`
            : `"${course.title}" needs changes`,
          body: approved
            ? "Students can now see this course. Nice work."
            : reviewNote!.trim(),
          metadata: { courseId: id },
        },
      });
    }

    return c;
  });

  logger.debug({ courseId: id, action, adminId }, "Course reviewed");

  res
    .status(StatusCodes.OK)
    .json(ApiResponse.success(updated, `Course ${approved ? "approved" : "rejected"}`));
};

export const reviewTutorApplication = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { action, reviewNote } = req.body as {
    action: "approve" | "reject";
    reviewNote?: string;
  };
  const adminId = req.user?.id;

  if (!action || !["approve", "reject"].includes(action)) {
    throw ApiError(StatusCodes.BAD_REQUEST, "action must be 'approve' or 'reject'.");
  }
  if (action === "reject" && !reviewNote?.trim()) {
    throw ApiError(StatusCodes.BAD_REQUEST, "A review note is required when rejecting.");
  }

  const profile = await prisma.tutorProfile.findUnique({
    where: { id },
    include: { application: true },
  });
  if (!profile) throw ApiError(StatusCodes.NOT_FOUND, "Tutor profile not found.");
  if (!profile.application)
    throw ApiError(StatusCodes.NOT_FOUND, "No application exists for this tutor.");

  const newStatus = action === "approve" ? "APPROVED" : "REJECTED";

  await prisma.$transaction([
    prisma.tutorApplication.update({
      where: { id: profile.application.id },
      data: {
        status: newStatus,
        reviewNote: reviewNote?.trim() ?? null,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    }),
    prisma.tutorProfile.update({
      where: { id },
      data: {
        applicationStatus: newStatus,
        ...(action === "approve" && { isVerified: true }),
      },
    }),
  ]);

  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      null,
      action === "approve"
        ? "Application approved. The tutor is now verified on the platform."
        : "Application rejected."
    )
  );
};

// GET /admin/users
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  const { role, search, page = "1", limit = "20", isActive } = req.query;
  const pageNum = Math.max(1, parseInt(page as string));
  const limitNum = Math.min(100, parseInt(limit as string));
  const skip = (pageNum - 1) * limitNum;

  const where: Prisma.UserWhereInput = {
    ...(role && { role: role as Prisma.EnumRoleFilter }),
    ...(isActive !== undefined && { isActive: isActive === "true" }),
    ...(search && {
      OR: [
        { firstName: { contains: search as string, mode: "insensitive" } },
        { lastName: { contains: search as string, mode: "insensitive" } },
        { email: { contains: search as string, mode: "insensitive" } },
      ],
    }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        avatar: true,
        createdAt: true,
        lastLoginAt: true,
        suspendedAt: true,
        suspensionReason: true,
        tutorProfile: { select: { isVerified: true, applicationStatus: true } },
        subscription: { select: { tier: true, status: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      {
        users,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
      "Users retrieved"
    )
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /admin/users/:id/suspend — soft suspension
//
// A suspended user can still sign in and read why. What they lose is the
// ability to act. For tutors that means: no authoring, no new earnings, and
// their student assignments are paused. Already-published courses stay live —
// that content was vetted by an admin, and pulling it would penalise students
// who are partway through for something their tutor did.
// ─────────────────────────────────────────────────────────────────────────────
export const toggleUserSuspension = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { suspend, reason } = req.body as { suspend: boolean; reason?: string };
  const requestorRole = req.user?.role;
  const adminId = req.user?.id;

  if (typeof suspend !== "boolean") {
    throw ApiError(StatusCodes.BAD_REQUEST, "'suspend' must be true or false.");
  }
  // The reason is shown to the user on their dashboard, so it is not optional.
  if (suspend && !reason?.trim()) {
    throw ApiError(
      StatusCodes.BAD_REQUEST,
      "A reason is required — the user is shown this on their dashboard."
    );
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, suspendedAt: true, tutorProfile: { select: { id: true } } },
  });
  if (!target) throw ApiError(StatusCodes.NOT_FOUND, "User not found.");

  if (
    ["ADMIN", "SUPER_ADMIN"].includes(target.role) &&
    requestorRole !== "SUPER_ADMIN"
  ) {
    throw ApiError(StatusCodes.FORBIDDEN, "Only SUPER_ADMIN can suspend admin accounts.");
  }

  const isTutor = target.role === "TUTOR" && target.tutorProfile;

  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id },
      data: suspend
        ? {
            suspendedAt: new Date(),
            suspensionReason: reason!.trim(),
            suspendedBy: adminId,
          }
        : { suspendedAt: null, suspensionReason: null, suspendedBy: null },
      select: { id: true, suspendedAt: true, suspensionReason: true },
    });

    // Pause rather than terminate: assignments resume intact on reinstatement.
    if (isTutor) {
      await tx.studentTutorAssignment.updateMany({
        where: {
          tutorProfileId: target.tutorProfile!.id,
          status: suspend ? "ACTIVE" : "PAUSED",
        },
        data: { status: suspend ? "PAUSED" : "ACTIVE" },
      });
    }

    // The in-app notice. This is what makes the dashboard banner discoverable
    // rather than something the user has to stumble on.
    await tx.notification.create({
      data: {
        userId: id,
        type: suspend ? "TUTOR_SUSPENDED" : "TUTOR_REINSTATED",
        title: suspend ? "Your account has been suspended" : "Your account has been reinstated",
        body: suspend
          ? `${reason!.trim()} — contact support if you believe this is a mistake.`
          : "Full access has been restored. Thank you for your patience.",
        metadata: { suspendedBy: adminId ?? null },
      },
    });

    return user;
  });

  logger.debug({ userId: id, suspend, adminId }, "User suspension toggled");

  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      {
        isSuspended: updated.suspendedAt !== null,
        suspendedAt: updated.suspendedAt,
        suspensionReason: updated.suspensionReason,
      },
      suspend ? "User account suspended." : "User account reinstated."
    )
  );
};

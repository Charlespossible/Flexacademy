import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../config/database";
import { ApiResponse, ApiError } from "../utils/ApiResponse";
import { logger } from "../utils/logger";
import { DifficultyLevel } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// SUBJECTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/subjects — List all subjects
 */
export const getSubjects = async (_req: Request, res: Response): Promise<void> => {
  const subjects = await prisma.subject.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { courses: true, topics: true } },
    },
    orderBy: { name: "asc" },
  });

  logger.debug({ count: subjects.length }, "Subjects fetched");

  res.status(StatusCodes.OK).json(
    ApiResponse.success(subjects, "Subjects retrieved successfully")
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COURSES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/courses — List courses with filtering
 */
export const getCourses = async (
  req: Request<
    object,
    object,
    object,
    {
      subject?: string;
      grade?: string;
      difficulty?: string;
      track?: string;
      page?: string;
      limit?: string;
    }
  >,
  res: Response
): Promise<void> => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const where: {
    isPublished: boolean;
    subject?: { slug: string };
    difficulty?: DifficultyLevel;
    gradeLevel?: string;
  } = { isPublished: true };

  if (req.query.subject) {
    where.subject = { slug: req.query.subject };
  }
  if (req.query.difficulty) {
    where.difficulty = req.query.difficulty as DifficultyLevel;
  }
  if (req.query.grade) {
    where.gradeLevel = req.query.grade;
  }

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      include: {
        subject: { select: { id: true, name: true, icon: true, slug: true } },
        // Students should see who taught a course before they commit to it —
        // authorship is part of how they choose.
        tutorProfile: {
          select: {
            id: true,
            isVerified: true,
            rating: true,
            user: { select: { firstName: true, lastName: true, avatar: true } },
          },
        },
        _count: { select: { enrollments: true, lessons: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.course.count({ where }),
  ]);

  logger.debug({ count: courses.length, total }, "Courses fetched");

  res
    .status(StatusCodes.OK)
    .json(ApiResponse.paginated(courses, { total, page, limit }));
};

/**
 * GET /api/v1/courses/me/enrolled — the student's own courses, with progress.
 *
 * Backs the "My learning" view. Kept separate from the catalogue so the list a
 * student is working through never depends on catalogue filters.
 */
export const getMyEnrolledCourses = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    orderBy: { enrolledAt: "desc" },
    include: {
      course: {
        include: {
          subject: { select: { id: true, name: true, icon: true, slug: true } },
          tutorProfile: {
            select: {
              id: true,
              isVerified: true,
              rating: true,
              user: { select: { firstName: true, lastName: true, avatar: true } },
            },
          },
          _count: { select: { lessons: true } },
        },
      },
    },
  });

  // One query for all progress rows rather than N+1 across the list.
  const progressRows = await prisma.learningProgress.findMany({
    where: { userId, courseId: { in: enrollments.map((e) => e.courseId) } },
    select: { courseId: true, progressPercent: true },
  });
  const byCourse = new Map(
    progressRows.map((p) => [p.courseId, Number(p.progressPercent)])
  );

  const courseIds = enrollments.map((e) => e.courseId);

  // Where to send the student back to. Two batched queries rather than N+1:
  // lessons already started but unfinished win, and if there are none we fall
  // back to the first lesson they have not opened at all.
  const [inProgress, allLessons] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: {
        userId,
        isCompleted: false,
        lesson: { courseId: { in: courseIds }, isPublished: true },
      },
      orderBy: { updatedAt: "desc" },
      select: {
        watchedSecs: true,
        updatedAt: true,
        lesson: {
          select: { id: true, title: true, courseId: true, duration: true, order: true },
        },
      },
    }),
    prisma.lesson.findMany({
      where: { courseId: { in: courseIds }, isPublished: true },
      orderBy: { order: "asc" },
      select: { id: true, title: true, courseId: true, duration: true, order: true },
    }),
  ]);

  const completed = new Set(
    (
      await prisma.lessonProgress.findMany({
        where: { userId, isCompleted: true, lesson: { courseId: { in: courseIds } } },
        select: { lessonId: true },
      })
    ).map((p) => p.lessonId)
  );

  // First match wins: `inProgress` is already sorted most-recent-first.
  const resumeByCourse = new Map<string, (typeof inProgress)[number]>();
  for (const row of inProgress) {
    if (!resumeByCourse.has(row.lesson.courseId)) {
      resumeByCourse.set(row.lesson.courseId, row);
    }
  }

  const data = enrollments.map((e) => {
    const started = resumeByCourse.get(e.courseId);
    const nextUnstarted = allLessons.find(
      (l) => l.courseId === e.courseId && !completed.has(l.id)
    );

    const target = started?.lesson ?? nextUnstarted ?? null;

    return {
      ...e.course,
      enrolledAt: e.enrolledAt,
      isCompleted: e.isCompleted,
      progress: byCourse.get(e.courseId) ?? 0,
      resume: target
        ? {
            lessonId: target.id,
            title: target.title,
            duration: target.duration,
            watchedSecs: started?.watchedSecs ?? 0,
            /** Distinguishes "Resume" from "Start" in the UI. */
            hasStarted: Boolean(started && started.watchedSecs > 0),
            lastAccessedAt: started?.updatedAt ?? null,
          }
        : null,
    };
  });

  res
    .status(StatusCodes.OK)
    .json(ApiResponse.success(data, "Enrolled courses retrieved"));
};

/**
 * GET /api/v1/courses/:id — Get single course with enrolled check
 */
export const getCourse = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      subject: true,
      // The tutor panel on the course page: who made this, and are they vetted.
      tutorProfile: {
        select: {
          id: true,
          bio: true,
          isVerified: true,
          rating: true,
          totalReviews: true,
          yearsOfExperience: true,
          specializations: true,
          user: { select: { firstName: true, lastName: true, avatar: true } },
        },
      },
      lessons: {
        // contentType and duration drive the icon and runtime in the syllabus
        // list, so the student can see the shape of the course before enrolling.
        select: {
          id: true,
          title: true,
          slug: true,
          order: true,
          isFree: true,
          contentType: true,
          duration: true,
        },
        orderBy: { order: "asc" },
      },
      _count: { select: { enrollments: true } },
      reviews: {
        select: { id: true, rating: true, comment: true, createdAt: true },
        take: 5,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!course) {
    throw ApiError(StatusCodes.NOT_FOUND, "Course not found.");
  }

  // Check if user is enrolled
  let isEnrolled = false;
  let enrolledAt: Date | null = null;
  let progress = 0;

  if (userId) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: id } },
    });

    if (enrollment) {
      isEnrolled = true;
      enrolledAt = enrollment.enrolledAt;

      // Calculate progress
      const progressRecord = await prisma.learningProgress.findUnique({
        where: { userId_courseId: { userId, courseId: id } },
      });
      progress = progressRecord ? Number(progressRecord.progressPercent) : 0;
    }
  }

  logger.debug({ courseId: id, userId, isEnrolled }, "Course fetched");

  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      { ...course, isEnrolled, enrolledAt, progress },
      "Course retrieved successfully"
    )
  );
};

/**
 * POST /api/v1/courses/:id/enroll — Enroll user in course
 */
export const enrollCourse = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const { id: courseId } = req.params;

  // Verify course exists
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    throw ApiError(StatusCodes.NOT_FOUND, "Course not found.");
  }

  // Check subscription tier
  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  const hasAccess =
    course.requiredTier === "FREE" ||
    course.isFree ||
    ["PRO", "ELITE", "BASIC"].includes(subscription?.tier ?? "");

  if (!hasAccess) {
    throw ApiError(
      StatusCodes.FORBIDDEN,
      `This course requires ${course.requiredTier} tier or higher.`
    );
  }

  // Check if already enrolled
  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });

  if (existing) {
    res.status(StatusCodes.OK).json(
      ApiResponse.success({ enrollment: existing }, "Already enrolled in this course")
    );
    return;
  }

  // Create enrollment and progress record
  const enrollment = await prisma.$transaction(async (tx) => {
    const enroll = await tx.enrollment.create({
      data: { userId, courseId },
    });

    await tx.learningProgress.create({
      data: { userId, courseId, progressPercent: 0 },
    });

    return enroll;
  });

  logger.info({ userId, courseId }, "User enrolled in course");

  res.status(StatusCodes.CREATED).json(
    ApiResponse.success({ enrollment }, "Enrolled in course successfully")
  );
};

/**
 * GET /api/v1/courses/:id/reviews — Get course reviews
 */
export const getCourseReviews = async (
  req: Request<{ id: string }, object, object, { page?: string; limit?: string }>,
  res: Response
): Promise<void> => {
  const { id: courseId } = req.params;
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  // Verify course exists
  await prisma.course.findUniqueOrThrow({ where: { id: courseId } });

  const [reviews, total] = await Promise.all([
    prisma.courseReview.findMany({
      where: { courseId },
      include: { course: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.courseReview.count({ where: { courseId } }),
  ]);

  const averageRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

  logger.debug({ courseId, count: reviews.length }, "Course reviews fetched");

  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      { reviews, averageRating, total },
      "Reviews retrieved successfully"
    )
  );
};

/**
 * POST /api/v1/courses/:id/reviews — Submit course review
 */
export const reviewCourse = async (
  req: Request<{ id: string }, object, { rating: number; comment?: string }>,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const { id: courseId } = req.params;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    throw ApiError(StatusCodes.BAD_REQUEST, "Rating must be between 1 and 5.");
  }

  // Verify user is enrolled
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });

  if (!enrollment) {
    throw ApiError(
      StatusCodes.FORBIDDEN,
      "You must be enrolled to leave a review."
    );
  }

  // Check if already reviewed
  const existing = await prisma.courseReview.findUnique({
    where: { courseId_userId: { courseId, userId } },
  });

  if (existing) {
    throw ApiError(StatusCodes.CONFLICT, "You have already reviewed this course.");
  }

  const review = await prisma.courseReview.create({
    data: {
      courseId,
      userId,
      rating,
      comment: comment ?? null,
    },
  });

  logger.info({ userId, courseId, rating }, "Course reviewed");

  res.status(StatusCodes.CREATED).json(
    ApiResponse.success({ review }, "Review submitted successfully")
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LESSONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/lessons/:id — Get lesson details
 */
export const getLesson = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const { id: lessonId } = req.params;
  const userId = req.user?.id;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      course: { select: { id: true, title: true, slug: true } },
      topic: { select: { id: true, name: true } },
    },
  });

  if (!lesson) {
    throw ApiError(StatusCodes.NOT_FOUND, "Lesson not found.");
  }

  // Check user progress if authenticated
  let isCompleted = false;
  let watchedSeconds = 0;
  let isBookmarked = false;

  if (userId) {
    const progress = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    if (progress) {
      isCompleted = progress.isCompleted;
      watchedSeconds = progress.watchedSecs;
    }

    const bookmark = await prisma.bookmark.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    isBookmarked = !!bookmark;
  }

  logger.debug({ lessonId, userId }, "Lesson fetched");

  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      { ...lesson, isCompleted, watchedSeconds, isBookmarked },
      "Lesson retrieved successfully"
    )
  );
};

/**
 * POST /api/v1/lessons/:id/progress — record how far into a lesson the student is
 *
 * The heartbeat behind resume. Called periodically while a lesson plays and
 * flushed on pause/unload, so a student who closes the tab mid-lesson comes
 * back to the same second rather than the beginning.
 *
 * Deliberately separate from /complete: this never sets `isCompleted`, so a
 * heartbeat can't accidentally mark a lesson finished and award XP for it.
 *
 * Stores the *current* position, not the furthest reached — rewinding is a
 * deliberate act and resume should honour where the student actually left off.
 */
export const saveLessonProgress = async (
  req: Request<{ id: string }, object, { watchedSecs?: number }>,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const { id: lessonId } = req.params;
  const raw = Number(req.body?.watchedSecs);
  if (!Number.isFinite(raw) || raw < 0) {
    throw ApiError(StatusCodes.BAD_REQUEST, "watchedSecs must be a non-negative number.");
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, courseId: true, duration: true },
  });
  if (!lesson) throw ApiError(StatusCodes.NOT_FOUND, "Lesson not found.");

  // Never trust a client-supplied position beyond the media length. Lessons
  // uploaded before duration probing, or text lessons, have no duration — fall
  // back to an absurdity ceiling so a bad client cannot store nonsense.
  const MAX_PLAUSIBLE_SECS = 12 * 60 * 60;
  const watchedSecs = Math.min(
    Math.round(raw),
    lesson.duration ?? MAX_PLAUSIBLE_SECS
  );

  const existing = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
    select: { isCompleted: true },
  });

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: { userId, lessonId, watchedSecs, isCompleted: false },
    // Leave isCompleted alone — re-watching a finished lesson must not un-finish it.
    update: { watchedSecs },
  });

  // Keeps "continue learning" ordered by genuine recency rather than enrolment date.
  await prisma.learningProgress.updateMany({
    where: { userId, courseId: lesson.courseId },
    data: { lastAccessedAt: new Date() },
  });

  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      { watchedSecs, isCompleted: existing?.isCompleted ?? false },
      "Progress saved"
    )
  );
};

/**
 * POST /api/v1/lessons/:id/complete — Mark lesson as completed
 */
export const completeLesson = async (
  req: Request<{ id: string }, object, { watchedSecs?: number }>,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const { id: lessonId } = req.params;
  const { watchedSecs = 0 } = req.body;

  // Verify lesson exists
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) {
    throw ApiError(StatusCodes.NOT_FOUND, "Lesson not found.");
  }

  // Upsert lesson progress
  const progress = await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: { userId, lessonId, isCompleted: true, watchedSecs, completedAt: new Date() },
    update: { isCompleted: true, watchedSecs, completedAt: new Date() },
  });

  // Create study session for XP
  await prisma.studySession.create({
    data: {
      userId,
      lessonId,
      subject: lesson.courseId,
      durationMins: Math.round(watchedSecs / 60),
      xpEarned: Math.min(Math.round(watchedSecs / 60) * 10, 500),
      date: new Date(),
    },
  });

  // Roll the per-lesson completion up into course-level progress.
  //
  // Without this LearningProgress.progressPercent stays at 0 forever, and every
  // progress bar in the app reads zero no matter how much a student completes.
  // Recomputed from the lessons actually completed rather than incremented, so
  // it stays correct if lessons are added or removed from the course later.
  const [publishedLessons, completedCount] = await Promise.all([
    prisma.lesson.count({ where: { courseId: lesson.courseId, isPublished: true } }),
    prisma.lessonProgress.count({
      where: {
        userId,
        isCompleted: true,
        lesson: { courseId: lesson.courseId, isPublished: true },
      },
    }),
  ]);

  const percent =
    publishedLessons > 0
      ? Math.min(100, Math.round((completedCount / publishedLessons) * 100))
      : 0;

  await prisma.learningProgress.upsert({
    where: { userId_courseId: { userId, courseId: lesson.courseId } },
    create: { userId, courseId: lesson.courseId, progressPercent: percent },
    update: { progressPercent: percent, lastAccessedAt: new Date() },
  });

  // Finishing every lesson closes out the enrolment too.
  if (percent >= 100) {
    await prisma.enrollment.updateMany({
      where: { userId, courseId: lesson.courseId, isCompleted: false },
      data: { isCompleted: true, completedAt: new Date() },
    });
  }

  logger.info(
    { userId, lessonId, courseProgress: percent },
    "Lesson marked as completed"
  );

  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      { progress, courseProgress: percent },
      "Lesson completed successfully"
    )
  );
};

/**
 * POST /api/v1/lessons/:id/bookmark — Bookmark (or unbookmark) a lesson
 */
export const toggleBookmark = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const { id: lessonId } = req.params;

  // Verify lesson exists
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) {
    throw ApiError(StatusCodes.NOT_FOUND, "Lesson not found.");
  }

  // Check if already bookmarked
  const existing = await prisma.bookmark.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });

  if (existing) {
    // Remove bookmark
    await prisma.bookmark.delete({
      where: { userId_lessonId: { userId, lessonId } },
    });

    logger.info({ userId, lessonId }, "Lesson bookmark removed");

    res.status(StatusCodes.OK).json(
      ApiResponse.success(null, "Bookmark removed successfully")
    );
    return;
  }

  // Create bookmark
  const bookmark = await prisma.bookmark.create({
    data: { userId, lessonId },
  });

  logger.info({ userId, lessonId }, "Lesson bookmarked");

  res
    .status(StatusCodes.CREATED)
    .json(ApiResponse.success({ bookmark }, "Lesson bookmarked successfully"));
};

import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { CourseStatus, ContentType, Prisma } from "@prisma/client";

import { prisma } from "../config/database";
import { ApiResponse, ApiError } from "../utils/ApiResponse";
import { logger } from "../utils/logger";
import {
  generateFlashcardDrafts,
  NotEnoughContentError,
} from "../services/flashcardGeneration.service";
import {
  isCloudinaryConfigured,
  createUploadSignature,
  verifyUploadedAsset,
  destroyAsset,
} from "../config/cloudinary";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve the caller's tutor profile, or 403.
 *
 * Also enforces suspension. A suspended tutor keeps read access to the rest of
 * the platform and can see why they were suspended, but may not create or
 * change content — so this gate sits on every authoring endpoint, and the
 * response carries the reason rather than a bare "forbidden".
 */
async function requireTutorProfile(userId: string | undefined) {
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const profile = await prisma.tutorProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      isVerified: true,
      applicationStatus: true,
      user: { select: { suspendedAt: true, suspensionReason: true } },
    },
  });
  if (!profile) throw ApiError(StatusCodes.FORBIDDEN, "No tutor profile found.");

  if (profile.user.suspendedAt) {
    throw ApiError(
      StatusCodes.FORBIDDEN,
      `Your account is suspended, so you cannot edit content. Reason: ${
        profile.user.suspensionReason ?? "not specified"
      }`
    );
  }

  return profile;
}

/**
 * Load a course the caller owns, or 404.
 *
 * Scoped by tutorProfileId as well as id — a valid course id belonging to
 * another tutor must be indistinguishable from one that doesn't exist.
 */
async function ownedCourse(courseId: string, tutorProfileId: string) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, tutorProfileId },
  });
  if (!course) throw ApiError(StatusCodes.NOT_FOUND, "Course not found.");
  return course;
}

/**
 * Content is only editable before it goes to review, or after rejection.
 * Once submitted or approved it is frozen — otherwise a tutor could swap the
 * material out from under an approval, or edit what students are watching.
 */
function assertEditable(status: CourseStatus) {
  if (status === CourseStatus.PENDING_REVIEW) {
    throw ApiError(
      StatusCodes.CONFLICT,
      "This course is under review. Withdraw it before making changes."
    );
  }
  if (status === CourseStatus.APPROVED) {
    throw ApiError(
      StatusCodes.CONFLICT,
      "This course is published. Create a new version to make changes."
    );
  }
  if (status === CourseStatus.ARCHIVED) {
    throw ApiError(StatusCodes.CONFLICT, "This course is archived.");
  }
}

/** URL-safe slug with a short suffix so titles can repeat across tutors. */
function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return `${base || "course"}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Keep denormalised counters on Course in step with its lessons. */
async function recalcCourseTotals(courseId: string) {
  const agg = await prisma.lesson.aggregate({
    where: { courseId },
    _count: { _all: true },
    _sum: { duration: true },
  });
  await prisma.course.update({
    where: { id: courseId },
    data: {
      totalLessons: agg._count._all,
      totalDuration: agg._sum.duration ?? 0,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/authoring/uploads/sign — signed direct upload to Cloudinary
// ─────────────────────────────────────────────────────────────────────────────
export const signUpload = async (req: Request, res: Response): Promise<void> => {
  const profile = await requireTutorProfile(req.user?.id);

  if (!isCloudinaryConfigured) {
    throw ApiError(
      StatusCodes.SERVICE_UNAVAILABLE,
      "Video uploads are not configured. Contact support."
    );
  }

  const resourceType =
    req.body?.resourceType === "image" ? ("image" as const) : ("video" as const);

  const signature = createUploadSignature(profile.id, resourceType);

  res
    .status(StatusCodes.OK)
    .json(ApiResponse.success(signature, "Upload signature issued"));
};

// ─────────────────────────────────────────────────────────────────────────────
// Courses
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/v1/authoring/courses — the tutor's own courses, any status */
export const listMyCourses = async (req: Request, res: Response): Promise<void> => {
  const profile = await requireTutorProfile(req.user?.id);

  const courses = await prisma.course.findMany({
    where: { tutorProfileId: profile.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      thumbnail: true,
      difficulty: true,
      status: true,
      isPublished: true,
      totalLessons: true,
      totalDuration: true,
      reviewNote: true,
      submittedAt: true,
      reviewedAt: true,
      createdAt: true,
      updatedAt: true,
      subject: { select: { id: true, name: true } },
    },
  });

  res.status(StatusCodes.OK).json(ApiResponse.success(courses, "Courses retrieved"));
};

/** GET /api/v1/authoring/courses/:id — one owned course with its lessons */
export const getMyCourse = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const profile = await requireTutorProfile(req.user?.id);
  await ownedCourse(req.params.id, profile.id);

  const course = await prisma.course.findUnique({
    where: { id: req.params.id },
    include: {
      subject: { select: { id: true, name: true } },
      lessons: { orderBy: { order: "asc" } },
    },
  });

  res.status(StatusCodes.OK).json(ApiResponse.success(course, "Course retrieved"));
};

/** POST /api/v1/authoring/courses — create a draft */
export const createCourse = async (req: Request, res: Response): Promise<void> => {
  const profile = await requireTutorProfile(req.user?.id);
  const { subjectId, title, description, difficulty, gradeLevel, curriculum } =
    req.body ?? {};

  if (!title?.trim()) throw ApiError(StatusCodes.BAD_REQUEST, "Title is required.");
  if (!subjectId) throw ApiError(StatusCodes.BAD_REQUEST, "Subject is required.");

  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject) throw ApiError(StatusCodes.BAD_REQUEST, "Unknown subject.");

  const course = await prisma.course.create({
    data: {
      subjectId,
      tutorProfileId: profile.id,
      title: title.trim(),
      slug: slugify(title),
      description: description?.trim() || null,
      difficulty: difficulty ?? undefined,
      gradeLevel: gradeLevel ?? null,
      curriculum: curriculum ?? null,
      status: CourseStatus.DRAFT,
      isPublished: false,
    },
  });

  logger.debug({ courseId: course.id, tutorProfileId: profile.id }, "Course drafted");

  res.status(StatusCodes.CREATED).json(ApiResponse.success(course, "Course created"));
};

/** PATCH /api/v1/authoring/courses/:id — edit a draft or rejected course */
export const updateCourse = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const profile = await requireTutorProfile(req.user?.id);
  const existing = await ownedCourse(req.params.id, profile.id);
  assertEditable(existing.status);

  const { title, description, difficulty, gradeLevel, curriculum, thumbnail } =
    req.body ?? {};

  const course = await prisma.course.update({
    where: { id: existing.id },
    data: {
      ...(title?.trim() ? { title: title.trim() } : {}),
      ...(description !== undefined ? { description: description?.trim() || null } : {}),
      ...(difficulty !== undefined ? { difficulty } : {}),
      ...(gradeLevel !== undefined ? { gradeLevel: gradeLevel || null } : {}),
      ...(curriculum !== undefined ? { curriculum: curriculum || null } : {}),
      ...(thumbnail !== undefined ? { thumbnail: thumbnail || null } : {}),
    },
  });

  res.status(StatusCodes.OK).json(ApiResponse.success(course, "Course updated"));
};

/** POST /api/v1/authoring/courses/:id/submit — send for admin review */
export const submitCourse = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const profile = await requireTutorProfile(req.user?.id);
  const course = await ownedCourse(req.params.id, profile.id);
  assertEditable(course.status);

  // A course with no publishable lesson is not reviewable.
  const publishable = await prisma.lesson.count({
    where: { courseId: course.id, isPublished: true },
  });
  if (publishable === 0) {
    throw ApiError(
      StatusCodes.BAD_REQUEST,
      "Add at least one completed lesson before submitting for review."
    );
  }

  const updated = await prisma.course.update({
    where: { id: course.id },
    data: {
      status: CourseStatus.PENDING_REVIEW,
      submittedAt: new Date(),
      reviewNote: null,
      reviewedAt: null,
      reviewedBy: null,
    },
  });

  logger.debug({ courseId: course.id }, "Course submitted for review");

  res
    .status(StatusCodes.OK)
    .json(ApiResponse.success(updated, "Submitted for review"));
};

/** POST /api/v1/authoring/courses/:id/withdraw — pull back from review */
export const withdrawCourse = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const profile = await requireTutorProfile(req.user?.id);
  const course = await ownedCourse(req.params.id, profile.id);

  if (course.status !== CourseStatus.PENDING_REVIEW) {
    throw ApiError(StatusCodes.CONFLICT, "This course is not awaiting review.");
  }

  const updated = await prisma.course.update({
    where: { id: course.id },
    data: { status: CourseStatus.DRAFT, submittedAt: null },
  });

  res.status(StatusCodes.OK).json(ApiResponse.success(updated, "Withdrawn from review"));
};

/** DELETE /api/v1/authoring/courses/:id — only while it is a draft */
export const deleteCourse = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const profile = await requireTutorProfile(req.user?.id);
  const course = await ownedCourse(req.params.id, profile.id);

  if (course.status !== CourseStatus.DRAFT && course.status !== CourseStatus.REJECTED) {
    throw ApiError(
      StatusCodes.CONFLICT,
      "Only draft or rejected courses can be deleted."
    );
  }

  // Reclaim the video storage before the rows go.
  const lessons = await prisma.lesson.findMany({
    where: { courseId: course.id, videoPublicId: { not: null } },
    select: { videoPublicId: true },
  });

  await prisma.course.delete({ where: { id: course.id } });

  await Promise.all(
    lessons.map((l) => destroyAsset(l.videoPublicId as string, "video"))
  );

  res.status(StatusCodes.OK).json(ApiResponse.success(null, "Course deleted"));
};

// ─────────────────────────────────────────────────────────────────────────────
// Lessons
// ─────────────────────────────────────────────────────────────────────────────

/** POST /api/v1/authoring/courses/:id/lessons — add a lesson */
export const createLesson = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const profile = await requireTutorProfile(req.user?.id);
  const course = await ownedCourse(req.params.id, profile.id);
  assertEditable(course.status);

  const {
    title,
    contentType,
    content,
    videoPublicId,
    topicId,
    isFree,
    isPublished,
  } = req.body ?? {};

  if (!title?.trim()) throw ApiError(StatusCodes.BAD_REQUEST, "Title is required.");

  const type: ContentType = contentType ?? ContentType.VIDEO;

  // For video lessons, confirm the asset actually exists in our Cloudinary
  // account. Without this the client could persist any arbitrary URL.
  let videoUrl: string | null = null;
  let duration: number | null = null;
  if (type === ContentType.VIDEO) {
    if (!videoPublicId) {
      throw ApiError(StatusCodes.BAD_REQUEST, "A video upload is required.");
    }
    const asset = await verifyUploadedAsset(videoPublicId, "video");
    if (!asset) {
      throw ApiError(
        StatusCodes.BAD_REQUEST,
        "That video upload could not be verified. Please re-upload."
      );
    }
    videoUrl = asset.secureUrl;
    duration = asset.durationSecs;
  }

  const last = await prisma.lesson.findFirst({
    where: { courseId: course.id },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const lesson = await prisma.lesson.create({
    data: {
      courseId: course.id,
      topicId: topicId || null,
      title: title.trim(),
      slug: slugify(title),
      contentType: type,
      content: content?.trim() || null,
      videoUrl,
      videoPublicId: type === ContentType.VIDEO ? videoPublicId : null,
      duration,
      order: (last?.order ?? -1) + 1,
      isFree: Boolean(isFree),
      isPublished: isPublished !== false,
    },
  });

  await recalcCourseTotals(course.id);

  res.status(StatusCodes.CREATED).json(ApiResponse.success(lesson, "Lesson added"));
};

/** PATCH /api/v1/authoring/lessons/:lessonId — edit a lesson */
export const updateLesson = async (
  req: Request<{ lessonId: string }>,
  res: Response
): Promise<void> => {
  const profile = await requireTutorProfile(req.user?.id);

  const lesson = await prisma.lesson.findFirst({
    where: { id: req.params.lessonId, course: { tutorProfileId: profile.id } },
    include: { course: { select: { id: true, status: true } } },
  });
  if (!lesson) throw ApiError(StatusCodes.NOT_FOUND, "Lesson not found.");
  assertEditable(lesson.course.status);

  const { title, content, topicId, isFree, isPublished, videoPublicId } = req.body ?? {};

  const data: Prisma.LessonUpdateInput = {
    ...(title?.trim() ? { title: title.trim() } : {}),
    ...(content !== undefined ? { content: content?.trim() || null } : {}),
    ...(isFree !== undefined ? { isFree: Boolean(isFree) } : {}),
    ...(isPublished !== undefined ? { isPublished: Boolean(isPublished) } : {}),
    ...(topicId !== undefined
      ? topicId
        ? { topic: { connect: { id: topicId } } }
        : { topic: { disconnect: true } }
      : {}),
  };

  // Swapping the video: verify the replacement first, then bin the old asset —
  // never the other way round, or a bad upload loses the original.
  let replaced: string | null = null;
  if (videoPublicId && videoPublicId !== lesson.videoPublicId) {
    const asset = await verifyUploadedAsset(videoPublicId, "video");
    if (!asset) {
      throw ApiError(
        StatusCodes.BAD_REQUEST,
        "That video upload could not be verified. Please re-upload."
      );
    }
    data.videoUrl = asset.secureUrl;
    data.videoPublicId = videoPublicId;
    data.duration = asset.durationSecs;
    replaced = lesson.videoPublicId;
  }

  const updated = await prisma.lesson.update({
    where: { id: lesson.id },
    data,
  });

  if (replaced) await destroyAsset(replaced, "video");
  await recalcCourseTotals(lesson.course.id);

  res.status(StatusCodes.OK).json(ApiResponse.success(updated, "Lesson updated"));
};

/** PATCH /api/v1/authoring/courses/:id/lessons/reorder — persist a new order */
export const reorderLessons = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const profile = await requireTutorProfile(req.user?.id);
  const course = await ownedCourse(req.params.id, profile.id);
  assertEditable(course.status);

  const ids: string[] = req.body?.lessonIds ?? [];
  if (!Array.isArray(ids) || ids.length === 0) {
    throw ApiError(StatusCodes.BAD_REQUEST, "lessonIds must be a non-empty array.");
  }

  // Every id must belong to this course, or the whole reorder is rejected.
  const owned = await prisma.lesson.count({
    where: { courseId: course.id, id: { in: ids } },
  });
  if (owned !== ids.length) {
    throw ApiError(StatusCodes.BAD_REQUEST, "One or more lessons do not belong to this course.");
  }

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.lesson.update({ where: { id }, data: { order: index } })
    )
  );

  res.status(StatusCodes.OK).json(ApiResponse.success(null, "Lessons reordered"));
};

/** DELETE /api/v1/authoring/lessons/:lessonId */
export const deleteLesson = async (
  req: Request<{ lessonId: string }>,
  res: Response
): Promise<void> => {
  const profile = await requireTutorProfile(req.user?.id);

  const lesson = await prisma.lesson.findFirst({
    where: { id: req.params.lessonId, course: { tutorProfileId: profile.id } },
    include: { course: { select: { id: true, status: true } } },
  });
  if (!lesson) throw ApiError(StatusCodes.NOT_FOUND, "Lesson not found.");
  assertEditable(lesson.course.status);

  await prisma.lesson.delete({ where: { id: lesson.id } });
  if (lesson.videoPublicId) await destroyAsset(lesson.videoPublicId, "video");
  await recalcCourseTotals(lesson.course.id);

  res.status(StatusCodes.OK).json(ApiResponse.success(null, "Lesson deleted"));
};

// ─────────────────────────────────────────────────────────────────────────────
// Flashcards
//
// A deck belongs to a lesson and is revised by every student taking it, so the
// tutor authors here while students revise through /flashcards. Cards drafted
// by Claude land unverified and stay invisible to students until the tutor
// approves them one at a time.
// ─────────────────────────────────────────────────────────────────────────────

/** Load a lesson this tutor owns, with the context the generator needs. */
async function ownedLesson(lessonId: string, tutorProfileId: string) {
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, course: { tutorProfileId } },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          status: true,
          subject: { select: { name: true } },
        },
      },
    },
  });
  if (!lesson) throw ApiError(StatusCodes.NOT_FOUND, "Lesson not found.");
  return lesson;
}

/** The lesson deck, created on first use so the tutor never has to manage one. */
async function ensureDeck(
  lesson: { id: string; title: string; topicId: string | null },
  tutorProfileId: string
) {
  const existing = await prisma.flashcardDeck.findFirst({
    where: { lessonId: lesson.id },
  });
  if (existing) return existing;

  return prisma.flashcardDeck.create({
    data: {
      lessonId: lesson.id,
      tutorProfileId,
      topicId: lesson.topicId,
      title: `${lesson.title} — revision`,
      userId: null, // course content, not anyone's personal deck
    },
  });
}

async function syncCardCount(deckId: string) {
  const cardCount = await prisma.flashcard.count({ where: { deckId } });
  await prisma.flashcardDeck.update({ where: { id: deckId }, data: { cardCount } });
  return cardCount;
}

/**
 * GET /api/v1/authoring/lessons/:lessonId/flashcards
 * The tutor view — unlike the student endpoint, this returns unverified drafts.
 */
export const getLessonFlashcards = async (
  req: Request<{ lessonId: string }>,
  res: Response
): Promise<void> => {
  const profile = await requireTutorProfile(req.user?.id);
  const lesson = await ownedLesson(req.params.lessonId, profile.id);

  const deck = await prisma.flashcardDeck.findFirst({
    where: { lessonId: lesson.id },
    include: {
      cards: {
        // Drafts first: that is what the tutor is here to deal with.
        orderBy: [{ isVerified: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          front: true,
          back: true,
          tags: true,
          aiGenerated: true,
          isVerified: true,
          createdAt: true,
        },
      },
    },
  });

  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      {
        deck: deck ? { id: deck.id, title: deck.title, cardCount: deck.cardCount } : null,
        cards: deck?.cards ?? [],
        pendingReview: deck?.cards.filter((c) => !c.isVerified).length ?? 0,
        /** Generation reads lesson text; surfaced so the UI can explain a refusal. */
        hasSourceContent: Boolean(lesson.content && lesson.content.trim().length >= 120),
      },
      "Lesson flashcards retrieved"
    )
  );
};

/**
 * POST /api/v1/authoring/lessons/:lessonId/flashcards/generate
 * Draft cards from the lesson with Claude. Always unverified.
 */
export const generateLessonFlashcards = async (
  req: Request<{ lessonId: string }>,
  res: Response
): Promise<void> => {
  const profile = await requireTutorProfile(req.user?.id);
  const lesson = await ownedLesson(req.params.lessonId, profile.id);

  const count = Number((req.body as { count?: unknown })?.count) || 15;

  let drafts;
  try {
    drafts = await generateFlashcardDrafts({
      lessonTitle: lesson.title,
      courseTitle: lesson.course.title,
      subjectName: lesson.course.subject?.name,
      content: lesson.content ?? "",
      count,
    });
  } catch (err) {
    if (err instanceof NotEnoughContentError) {
      throw ApiError(StatusCodes.UNPROCESSABLE_ENTITY, err.message);
    }
    logger.error({ err, lessonId: lesson.id }, "Flashcard generation failed");
    throw ApiError(
      StatusCodes.SERVICE_UNAVAILABLE,
      "Could not generate cards right now. Please try again."
    );
  }

  if (drafts.length === 0) {
    throw ApiError(
      StatusCodes.UNPROCESSABLE_ENTITY,
      "No usable cards came back. Try adding more detail to the lesson notes."
    );
  }

  const deck = await ensureDeck(lesson, profile.id);

  await prisma.flashcard.createMany({
    data: drafts.map((d) => ({
      deckId: deck.id,
      front: d.front,
      back: d.back,
      tags: d.tags,
      aiGenerated: true,
      // The whole safety property of this feature. Never default this to true.
      isVerified: false,
    })),
  });

  await syncCardCount(deck.id);

  res.status(StatusCodes.CREATED).json(
    ApiResponse.success(
      { deckId: deck.id, generated: drafts.length },
      `${drafts.length} draft card${drafts.length === 1 ? "" : "s"} ready for your review`
    )
  );
};

/** POST /api/v1/authoring/lessons/:lessonId/flashcards — add one by hand */
export const addLessonFlashcard = async (
  req: Request<{ lessonId: string }>,
  res: Response
): Promise<void> => {
  const profile = await requireTutorProfile(req.user?.id);
  const lesson = await ownedLesson(req.params.lessonId, profile.id);

  const { front, back } = (req.body ?? {}) as { front?: string; back?: string };
  if (!front?.trim() || !back?.trim()) {
    throw ApiError(StatusCodes.BAD_REQUEST, "Both sides of the card are required.");
  }

  const deck = await ensureDeck(lesson, profile.id);
  const card = await prisma.flashcard.create({
    data: {
      deckId: deck.id,
      front: front.trim(),
      back: back.trim(),
      // Written by the tutor, so trusted immediately.
      aiGenerated: false,
      isVerified: true,
    },
  });

  await syncCardCount(deck.id);
  res.status(StatusCodes.CREATED).json(ApiResponse.success(card, "Card added"));
};

/** Load a card whose deck belongs to this tutor. */
async function ownedCard(cardId: string, tutorProfileId: string) {
  const card = await prisma.flashcard.findFirst({
    where: { id: cardId, deck: { tutorProfileId } },
    select: { id: true, deckId: true },
  });
  if (!card) throw ApiError(StatusCodes.NOT_FOUND, "Card not found.");
  return card;
}

/**
 * PATCH /api/v1/authoring/flashcards/:cardId
 * Edit either side and/or approve. Approving is what makes a draft visible.
 */
export const updateLessonFlashcard = async (
  req: Request<{ cardId: string }>,
  res: Response
): Promise<void> => {
  const profile = await requireTutorProfile(req.user?.id);
  await ownedCard(req.params.cardId, profile.id);

  const { front, back, isVerified } = (req.body ?? {}) as {
    front?: string;
    back?: string;
    isVerified?: boolean;
  };

  const data: Record<string, unknown> = {};
  if (typeof front === "string") {
    if (!front.trim()) throw ApiError(StatusCodes.BAD_REQUEST, "Front cannot be empty.");
    data.front = front.trim();
  }
  if (typeof back === "string") {
    if (!back.trim()) throw ApiError(StatusCodes.BAD_REQUEST, "Back cannot be empty.");
    data.back = back.trim();
  }
  if (typeof isVerified === "boolean") data.isVerified = isVerified;

  if (Object.keys(data).length === 0) {
    throw ApiError(StatusCodes.BAD_REQUEST, "Nothing to update.");
  }

  const card = await prisma.flashcard.update({
    where: { id: req.params.cardId },
    data,
  });

  res.status(StatusCodes.OK).json(ApiResponse.success(card, "Card updated"));
};

/** DELETE /api/v1/authoring/flashcards/:cardId */
export const deleteLessonFlashcard = async (
  req: Request<{ cardId: string }>,
  res: Response
): Promise<void> => {
  const profile = await requireTutorProfile(req.user?.id);
  const card = await ownedCard(req.params.cardId, profile.id);

  await prisma.$transaction(async (tx) => {
    // Students may already have revised it; clear dependents first.
    await tx.flashcardProgress.deleteMany({ where: { flashcardId: card.id } });
    await tx.flashcardReview.deleteMany({ where: { flashcardId: card.id } });
    await tx.flashcard.delete({ where: { id: card.id } });
  });

  await syncCardCount(card.deckId);
  res.status(StatusCodes.OK).json(ApiResponse.success(null, "Card deleted"));
};

/**
 * POST /api/v1/authoring/lessons/:lessonId/flashcards/verify-all
 * Approve every remaining draft at once, for a tutor who has read through them.
 * Still an explicit act — nothing is ever approved automatically.
 */
export const verifyAllLessonFlashcards = async (
  req: Request<{ lessonId: string }>,
  res: Response
): Promise<void> => {
  const profile = await requireTutorProfile(req.user?.id);
  const lesson = await ownedLesson(req.params.lessonId, profile.id);

  const deck = await prisma.flashcardDeck.findFirst({ where: { lessonId: lesson.id } });
  if (!deck) throw ApiError(StatusCodes.NOT_FOUND, "This lesson has no deck yet.");

  const { count } = await prisma.flashcard.updateMany({
    where: { deckId: deck.id, isVerified: false },
    data: { isVerified: true },
  });

  res.status(StatusCodes.OK).json(
    ApiResponse.success({ verified: count }, `${count} card${count === 1 ? "" : "s"} approved`)
  );
};

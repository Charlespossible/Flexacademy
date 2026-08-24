import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiResponse";
import { logger } from "../utils/logger";
import { checkFlashcardGapSignal } from "../services/gapDetection.service";

/**
 * SM-2 Algorithm Implementation
 * Spaced repetition formula for optimal learning retention
 *
 * Formula:
 * - EF' = max(1.3, EF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
 * - I(1) = 1, I(2) = 3, I(n) = I(n-1) * EF'
 *
 * Quality scale:
 * 0 (AGAIN): Complete blackout, inappropriate interruption
 * 1 (HARD): Serious difficulty, incorrect response
 * 2/3 (GOOD): Correct with effort/hesitation
 * 4 (EASY): Perfect response, no hesitation
 */

interface SM2Result {
  nextEF: number;
  nextInterval: number;
  nextReviewDate: Date;
}

const calculateSM2 = (
  currentEF: number,
  currentReps: number,
  currentInterval: number,
  quality: number
): SM2Result => {
  // Clamp quality to 0-4 range
  const q = Math.max(0, Math.min(4, quality));

  // Calculate new EF (ease factor)
  const nextEF = Math.max(1.3, currentEF + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));

  // Calculate interval for next review
  let nextInterval: number;
  if (q < 3) {
    // Failed - restart
    nextInterval = 1;
  } else if (currentReps === 0) {
    nextInterval = 1;
  } else if (currentReps === 1) {
    nextInterval = 3;
  } else {
    nextInterval = Math.round(currentInterval * nextEF);
  }

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);

  return { nextEF, nextInterval, nextReviewDate };
};

/**
 * Decks a student may revise:
 *   - their own personal decks
 *   - decks published alongside a lesson in a course they are enrolled in
 *   - decks explicitly marked public
 *
 * Returned as a Prisma filter so every read path applies the same rule rather
 * than each endpoint inventing its own.
 */
const revisableDeckFilter = (userId: string) => ({
  OR: [
    { userId },
    { isPublic: true },
    {
      lesson: {
        isPublished: true,
        course: { enrollments: { some: { userId } } },
      },
    },
  ],
});

/**
 * Decks a user may *look at*: everything they can revise, plus the decks a
 * tutor authored.
 *
 * Kept separate from `revisableDeckFilter` on purpose — a tutor must be able to
 * open and manage their own deck, but it should not turn up in their personal
 * revision queue. They wrote it; they are not studying it.
 */
const viewableDeckFilter = (userId: string) => ({
  OR: [
    ...revisableDeckFilter(userId).OR,
    { tutorProfile: { userId } },
  ],
});

/**
 * Editing is narrower than revising: a student owns their personal deck, and a
 * tutor owns the decks attached to their own lessons. Being enrolled in a
 * course never grants the right to change its cards.
 */
async function assertCanEditDeck(deckId: string, userId: string) {
  const deck = await prisma.flashcardDeck.findFirst({
    where: {
      id: deckId,
      OR: [
        { userId },
        { tutorProfile: { userId } },
      ],
    },
  });
  // 404 rather than 403 — someone else's deck should be indistinguishable
  // from one that does not exist.
  if (!deck) throw ApiError(StatusCodes.NOT_FOUND, "Deck not found");
  return deck;
}

/**
 * GET /api/v1/flashcards/due
 * Get all flashcards due for review today
 */
export const getDueFlashcards = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const deckId = req.query.deckId as string | undefined;

    const whereClause: any = {
      AND: [
        // Unverified AI drafts never reach a student.
        { isVerified: true },
        { deck: revisableDeckFilter(userId) },
        {
          OR: [
            // Never seen by this student — a brand-new card, always due.
            { progress: { none: { userId } } },
            // Or their own schedule says it is due.
            { progress: { some: { userId, nextReviewAt: { lte: new Date() } } } },
          ],
        },
      ],
    };

    if (deckId) {
      whereClause.AND.push({ deckId });
    }

    const [cards, total] = await Promise.all([
      prisma.flashcard.findMany({
        where: whereClause,
        skip,
        take: limit,
        select: {
          id: true,
          front: true,
          back: true,
          deck: { select: { id: true, title: true } },
          // Only this student's row — scheduling is per-student now.
          progress: {
            where: { userId },
            take: 1,
            select: {
              easeFactor: true,
              repetitions: true,
              interval: true,
              nextReviewAt: true,
            },
          },
        },
        // Deck order. Prisma cannot sort by a filtered relation's field, so
        // "most overdue first" is not expressible here; creation order at least
        // keeps a deck's cards in the sequence the tutor wrote them.
        orderBy: [{ createdAt: "asc" }],
      }),
      prisma.flashcard.count({ where: whereClause }),
    ]);

    // Flatten so the client sees one shape whether or not a card is new.
    const data = cards.map(({ progress, ...card }) => ({
      ...card,
      isNew: progress.length === 0,
      easeFactor: progress[0]?.easeFactor ?? 2.5,
      repetitions: progress[0]?.repetitions ?? 0,
      interval: progress[0]?.interval ?? 0,
      nextReviewAt: progress[0]?.nextReviewAt ?? null,
    }));

    return res.status(StatusCodes.OK).json({
      success: true,
      data,
      meta: { page, limit, total, dueTodayCount: total },
    });
  } catch (error) {
    logger.error({ message: "getDueFlashcards error:", error });
    if (error instanceof Error && "statusCode" in error) {
      return res
        .status((error as any).statusCode)
        .json({ success: false, message: (error as any).message });
    }
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Failed to fetch due flashcards" });
  }
};

/**
 * GET /api/v1/flashcards/decks/me
 * Get user's flashcard decks with stats
 */
export const getUserDecks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    // Personal decks plus every course deck this student can revise.
    const where = viewableDeckFilter(userId);

    const [decks, total] = await Promise.all([
      prisma.flashcardDeck.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          lesson: { select: { id: true, title: true, courseId: true } },
        },
      }),
      prisma.flashcardDeck.count({ where }),
    ]);

    // One query for every card on the page, with this student's progress
    // attached, then tally in memory. The previous shape fired four counts per
    // deck — 80 queries for a 20-deck page, and widening the deck set to
    // include course decks would have made that worse.
    const cards = await prisma.flashcard.findMany({
      where: { deckId: { in: decks.map((d) => d.id) }, isVerified: true },
      select: {
        deckId: true,
        progress: {
          where: { userId },
          take: 1,
          select: { repetitions: true, nextReviewAt: true },
        },
      },
    });

    const now = new Date();
    const tally = new Map<
      string,
      { total: number; due: number; new: number; mastered: number }
    >();

    for (const card of cards) {
      const t =
        tally.get(card.deckId) ?? { total: 0, due: 0, new: 0, mastered: 0 };
      const p = card.progress[0];

      t.total += 1;
      // Never seen counts as both new and due — same rule the queue applies.
      if (!p) {
        t.new += 1;
        t.due += 1;
      } else {
        if (p.nextReviewAt <= now) t.due += 1;
        if (p.repetitions >= 5) t.mastered += 1;
      }
      tally.set(card.deckId, t);
    }

    const enriched = decks.map((deck) => {
      const t = tally.get(deck.id) ?? { total: 0, due: 0, new: 0, mastered: 0 };
      return {
        id: deck.id,
        title: deck.title,
        description: deck.description,
        /** Distinguishes "my own cards" from a tutor's course deck. */
        isCourseDeck: Boolean(deck.lessonId),
        lesson: deck.lesson,
        totalCards: t.total,
        dueCards: t.due,
        newCards: t.new,
        masteredCards: t.mastered,
        createdAt: deck.createdAt,
      };
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: enriched,
      meta: { page, limit, total },
    });
  } catch (error) {
    logger.error({ message: "getUserDecks error:", error });
    if (error instanceof Error && "statusCode" in error) {
      return res
        .status((error as any).statusCode)
        .json({ success: false, message: (error as any).message });
    }
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Failed to fetch decks" });
  }
};

/**
 * POST /api/v1/flashcards/decks
 * Create a new flashcard deck
 */
export const createDeck = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

    const { title, description } = req.body;

    if (!title || title.trim().length === 0) {
      throw ApiError(StatusCodes.BAD_REQUEST, "Deck title is required");
    }

    const deck = await prisma.flashcardDeck.create({
      data: {
        userId,
        title: title.trim(),
        description: description?.trim() || null,
      },
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: deck,
    });
  } catch (error) {

    logger.error({ message: "createDeck error:", error });
    if (error instanceof Error && "statusCode" in error) {
      return res
        .status((error as any).statusCode)
        .json({ success: false, message: (error as any).message });
    }
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Failed to create deck" });
  }
};

/**
 * GET /api/v1/flashcards/decks/:id
 * Get deck with all its cards
 */
export const getDeck = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id: deckId } = req.params;

    if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

    const deck = await prisma.flashcardDeck.findFirst({
      where: { id: deckId, ...viewableDeckFilter(userId) },
      include: {
        lesson: { select: { id: true, title: true, courseId: true } },
        // Needed to answer "may this caller edit?" for tutor-authored decks,
        // where ownership runs through the tutor profile rather than userId.
        tutorProfile: { select: { userId: true } },
        cards: {
          where: { isVerified: true },
          orderBy: { createdAt: "asc" },
          // Attach only the caller's schedule to each card.
          include: { progress: { where: { userId }, take: 1 } },
        },
      },
    });

    if (!deck) {
      throw ApiError(StatusCodes.NOT_FOUND, "Deck not found or unauthorized");
    }

    const now = new Date();
    const withProgress = deck.cards.map(({ progress, ...card }) => ({
      ...card,
      isNew: progress.length === 0,
      easeFactor: progress[0]?.easeFactor ?? 2.5,
      repetitions: progress[0]?.repetitions ?? 0,
      interval: progress[0]?.interval ?? 0,
      nextReviewAt: progress[0]?.nextReviewAt ?? null,
    }));

    const stats = {
      total: withProgress.length,
      // "New" means never seen — the same definition getUserDecks uses. Counting
      // repetitions === 0 instead would fold in lapsed cards, which have been
      // seen and failed, and the two endpoints would disagree.
      new: withProgress.filter((c) => c.isNew).length,
      // Seen but not yet retained, including cards reset by an AGAIN grade.
      learning: withProgress.filter((c) => !c.isNew && c.repetitions < 5).length,
      mastered: withProgress.filter((c) => c.repetitions >= 5).length,
      // A card never seen is due, same rule the queue uses.
      due: withProgress.filter((c) => !c.nextReviewAt || c.nextReviewAt <= now).length,
    };

    // tutorProfile was fetched only to answer canEdit — don't ship the tutor's
    // user id to every student who opens the deck.
    const { tutorProfile, ...deckFields } = deck;

    return res.status(StatusCodes.OK).json({
      success: true,
      data: {
        ...deckFields,
        cards: withProgress,
        isCourseDeck: Boolean(deck.lessonId),
        // Personal owner, or the tutor who authored the course deck.
        canEdit: deck.userId === userId || tutorProfile?.userId === userId,
        stats,
      },
    });
  } catch (error) {
    logger.error({ message: "getDeck error:", error });
    if (error instanceof Error && "statusCode" in error) {
      return res
        .status((error as any).statusCode)
        .json({ success: false, message: (error as any).message });
    }
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Failed to fetch deck" });
  }
};

/**
 * PATCH /api/v1/flashcards/decks/:id
 * Update deck metadata
 */
export const updateDeck = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id: deckId } = req.params;
    const { title, description } = req.body;

    if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

    await assertCanEditDeck(deckId, userId);

    const updateData: any = {};
    if (title) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;

    // FIX 2: Guard against empty update payload to avoid a Prisma error
    if (Object.keys(updateData).length === 0) {
      throw ApiError(StatusCodes.BAD_REQUEST, "No fields provided to update");
    }

    const updated = await prisma.flashcardDeck.update({
      where: { id: deckId },
      data: updateData,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    logger.error({ message: "updateDeck error:", error });
    //logger.error("updateDeck error:", error);
    if (error instanceof Error && "statusCode" in error) {
      return res
        .status((error as any).statusCode)
        .json({ success: false, message: (error as any).message });
    }
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Failed to update deck" });
  }
};

/**
 * DELETE /api/v1/flashcards/decks/:id
 * Delete a deck and all its cards
 */
export const deleteDeck = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id: deckId } = req.params;

    if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

    await assertCanEditDeck(deckId, userId);

    await prisma.$transaction(async (tx) => {
      // FIX 3: Cascade-delete flashcardReview rows before deleting the
      // flashcards themselves. Without this, the FK constraint on
      // flashcardReview.cardId would throw a constraint-violation error
      // at runtime, making the entire transaction roll back.
      const cardIds = (
        await tx.flashcard.findMany({
          where: { deckId },
          select: { id: true },
        })
      ).map((c) => c.id);

      await tx.flashcardReview.deleteMany({
        where: {
          flashcardId: { in: cardIds } // Changed cardId to flashcardId 
        },
      });

      await tx.flashcard.deleteMany({ where: { deckId } });
      await tx.flashcardDeck.delete({ where: { id: deckId } });
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Deck deleted",
    });
  } catch (error) {
    logger.error({ message: "deleteDeck error:", error });
    if (error instanceof Error && "statusCode" in error) {
      return res
        .status((error as any).statusCode)
        .json({ success: false, message: (error as any).message });
    }
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Failed to delete deck" });
  }
};

/**
 * GET /api/v1/flashcards/decks/:deckId/cards
 * Get all cards in a deck (paginated)
 */
export const getDeckCards = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { deckId } = req.params;

    if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

    // A read: anyone entitled to revise the deck may list its cards.
    const deck = await prisma.flashcardDeck.findFirst({
      where: { id: deckId, ...viewableDeckFilter(userId) },
    });

    if (!deck) {
      throw ApiError(StatusCodes.NOT_FOUND, "Deck not found or unauthorized");
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const skip = (page - 1) * limit;

    const [cards, total] = await Promise.all([
      prisma.flashcard.findMany({
        where: { deckId },
        skip,
        take: limit,
        orderBy: { createdAt: "asc" },
      }),
      prisma.flashcard.count({ where: { deckId } }),
    ]);

    return res.status(StatusCodes.OK).json({
      success: true,
      data: cards,
      meta: { page, limit, total },
    });
  } catch (error) {
    logger.error({ message: "getDeckCards error:", error });
    if (error instanceof Error && "statusCode" in error) {
      return res
        .status((error as any).statusCode)
        .json({ success: false, message: (error as any).message });
    }
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Failed to fetch cards" });
  }
};

/**
 * POST /api/v1/flashcards/decks/:deckId/cards
 * Add a card to a deck
 */
export const addCard = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { deckId } = req.params;
    const { front, back } = req.body;

    if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

    if (!front || !back) {
      throw ApiError(StatusCodes.BAD_REQUEST, "Front and back content required");
    }

    // Owner only — being enrolled in a course does not permit editing its cards.
    await assertCanEditDeck(deckId, userId);

    // No scheduling fields here: a card starts with no progress rows at all,
    // and each student picks up their own the first time they review it.
    const card = await prisma.flashcard.create({
      data: {
        deckId,
        front: front.trim(),
        back: back.trim(),
      },
    });

    await prisma.flashcardDeck.update({
      where: { id: deckId },
      data: { cardCount: { increment: 1 } },
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: card,
    });
  } catch (error) {
    logger.error({ message: "addCard error:", error });
    if (error instanceof Error && "statusCode" in error) {
      return res
        .status((error as any).statusCode)
        .json({ success: false, message: (error as any).message });
    }
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Failed to add card" });
  }
};

/**
 * PATCH /api/v1/flashcards/:id
 * Update a flashcard
 */
export const updateCard = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id: cardId } = req.params;
    const { front, back } = req.body;

    if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

    // Verify ownership via deck
    const card = await prisma.flashcard.findUnique({
      where: { id: cardId },
      select: { id: true, deckId: true },
    });
    if (!card) throw ApiError(StatusCodes.NOT_FOUND, "Card not found or unauthorized");
    await assertCanEditDeck(card.deckId, userId);

    const updateData: any = {};
    if (front) updateData.front = front.trim();
    if (back) updateData.back = back.trim();

    // FIX 4: Guard against empty update payload to avoid a Prisma error
    if (Object.keys(updateData).length === 0) {
      throw ApiError(StatusCodes.BAD_REQUEST, "No fields provided to update");
    }

    const updated = await prisma.flashcard.update({
      where: { id: cardId },
      data: updateData,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    logger.error({ message: "updateCard error:", error });
    if (error instanceof Error && "statusCode" in error) {
      return res
        .status((error as any).statusCode)
        .json({ success: false, message: (error as any).message });
    }
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Failed to update card" });
  }
};

/**
 * DELETE /api/v1/flashcards/:id
 * Delete a flashcard
 */
export const deleteCard = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id: cardId } = req.params;

    if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

    // Verify ownership
    const card = await prisma.flashcard.findUnique({
      where: { id: cardId },
      select: { id: true, deckId: true },
    });
    if (!card) throw ApiError(StatusCodes.NOT_FOUND, "Card not found or unauthorized");
    await assertCanEditDeck(card.deckId, userId);

    // FIX 5: Delete associated review records before deleting the card
    // to avoid a FK constraint violation on flashcardReview.cardId.
    await prisma.$transaction(async (tx) => {
      await tx.flashcardReview.deleteMany({ where: { flashcardId: cardId } });
      await tx.flashcard.delete({ where: { id: cardId } });
      // Keep the denormalised counter honest. Without this it only ever grows,
      // since addCard increments it.
      await tx.flashcardDeck.update({
        where: { id: card.deckId },
        data: { cardCount: { decrement: 1 } },
      });
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Card deleted",
    });
  } catch (error) {
    logger.error({ message: "deleteCard error:", error });
    if (error instanceof Error && "statusCode" in error) {
      return res
        .status((error as any).statusCode)
        .json({ success: false, message: (error as any).message });
    }
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Failed to delete card" });
  }
};

/**
 * POST /api/v1/flashcards/:id/review
 * Review a card with SM-2 algorithm update
 */
export const reviewCard = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id: cardId } = req.params;
    const { quality } = req.body; // 0=AGAIN, 1=HARD, 2/3=GOOD, 4=EASY

    if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

    // FIX 6: Also validate that quality is an integer — non-integer values
    // (e.g. 2.7) pass the range check but are not valid SM-2 quality grades.
    if (
      quality === undefined ||
      typeof quality !== "number" ||
      !Number.isInteger(quality) ||
      quality < 0 ||
      quality > 4
    ) {
      throw ApiError(StatusCodes.BAD_REQUEST, "Quality must be an integer 0–4");
    }

    // The card must sit in a deck this student is entitled to revise — which
    // now includes tutor-authored decks from their enrolled courses, not just
    // decks they created themselves.
    const card = await prisma.flashcard.findFirst({
      where: {
        id: cardId,
        isVerified: true,
        deck: revisableDeckFilter(userId),
      },
      include: {
        deck: { select: { topicId: true } },
        progress: { where: { userId }, take: 1 },
      },
    });

    if (!card) {
      throw ApiError(StatusCodes.NOT_FOUND, "Card not found or unauthorized");
    }

    // This student's own schedule for this card. No row means they have never
    // seen it, so SM-2 starts from its defaults.
    const current = card.progress[0] ?? {
      easeFactor: 2.5,
      repetitions: 0,
      interval: 0,
    };

    const sm2Result = calculateSM2(
      current.easeFactor,
      current.repetitions,
      current.interval,
      quality
    );
    const nextReps = quality < 3 ? 0 : current.repetitions + 1;

    const updated = await prisma.$transaction(async (tx) => {
      // Upsert THIS student's progress. The card itself is never mutated, so
      // one student's review cannot move anybody else's due date.
      const newProgress = await tx.flashcardProgress.upsert({
        where: { userId_flashcardId: { userId, flashcardId: cardId } },
        create: {
          userId,
          flashcardId: cardId,
          easeFactor: sm2Result.nextEF,
          repetitions: nextReps,
          interval: sm2Result.nextInterval,
          nextReviewAt: sm2Result.nextReviewDate,
          lastReviewedAt: new Date(),
        },
        update: {
          easeFactor: sm2Result.nextEF,
          repetitions: nextReps,
          interval: sm2Result.nextInterval,
          nextReviewAt: sm2Result.nextReviewDate,
          lastReviewedAt: new Date(),
        },
      });

      // Create review record for stats/analytics
      // Map quality (0-4) to FlashcardReviewResult enum
      const resultMap: Record<number, "AGAIN" | "HARD" | "GOOD" | "EASY"> = {
        0: "AGAIN",
        1: "HARD",
        2: "GOOD",
        3: "GOOD",
        4: "EASY",
      };

      await tx.flashcardReview.create({
        data: {
          userId,
          flashcardId: cardId,
          result: resultMap[quality],
          easeFactor: sm2Result.nextEF,
          interval: sm2Result.nextInterval,
          repetitions: nextReps,
          nextReviewAt: sm2Result.nextReviewDate,
        },
      });

      return newProgress;
    });

    // Fire-and-forget gap signal check: AGAIN (0) or HARD (1) on a topic-linked deck
    // accumulates as a flashcard weakness signal feeding into gap detection.
    if (quality <= 1 && card.deck.topicId) {
      checkFlashcardGapSignal(userId, card.deck.topicId).catch((err) =>
        logger.warn(
          { err, userId, topicId: card.deck.topicId },
          "Flashcard gap signal check failed"
        )
      );
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      data: {
        cardId,
        nextReviewAt: updated.nextReviewAt,
        easeFactor: updated.easeFactor,
        repetitions: updated.repetitions,
        interval: updated.interval,
        message: `Card reviewed (quality: ${quality}) - scheduled for ${updated.nextReviewAt.toLocaleDateString()}`,
      },
    });
  } catch (error) {
    logger.error({ message: "reviewCard error:", error });
    if (error instanceof Error && "statusCode" in error) {
      return res
        .status((error as any).statusCode)
        .json({ success: false, message: (error as any).message });
    }
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Failed to review card" });
  }
};
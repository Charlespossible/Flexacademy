import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import {
  getDueFlashcards,
  getUserDecks,
  createDeck,
  getDeck,
  updateDeck,
  deleteDeck,
  getDeckCards,
  addCard,
  updateCard,
  deleteCard,
  reviewCard,
} from "../controllers/flashcard.controller";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Flashcards
 *   description: Spaced repetition flashcard system using SM-2 algorithm for optimal learning
 */

/**
 * @swagger
 * /flashcards/due:
 *   get:
 *     tags: [Flashcards]
 *     summary: Get cards due for review today
 *     description: Returns all flashcards scheduled for review today across all decks. SM-2 algorithm determines due dates based on prior reviews.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: deckId
 *         schema: { type: string, format: uuid, description: Filter by specific deck }
 *     responses:
 *       200:
 *         description: Cards due for review
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     total: { type: integer }
 *                     dueTodayCount: { type: integer }
 *       401: { description: Not authenticated }
 */
router.get("/due", getDueFlashcards);

/**
 * @swagger
 * /flashcards/decks/me:
 *   get:
 *     tags: [Flashcards]
 *     summary: Get user's flashcard decks with statistics
 *     description: Returns all decks owned by current user with card counts, new cards, mastered count, and due count.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, minimum: 1, maximum: 100 }
 *     responses:
 *       200:
 *         description: User's decks with stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       title: { type: string }
 *                       description: { type: string }
 *                       totalCards: { type: integer }
 *                       newCards: { type: integer }
 *                       dueCards: { type: integer }
 *                       masteredCards: { type: integer }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     total: { type: integer }
 *       401: { description: Not authenticated }
 */
router.get("/decks/me", getUserDecks);

/**
 * @swagger
 * /flashcards/decks:
 *   post:
 *     tags: [Flashcards]
 *     summary: Create a new flashcard deck
 *     description: Create an empty flashcard deck that can later be populated with cards.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string, minLength: 1 }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Deck created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *       400: { description: Invalid input }
 *       401: { description: Not authenticated }
 */
router.post("/decks", createDeck);

/**
 * @swagger
 * /flashcards/decks/{id}:
 *   get:
 *     tags: [Flashcards]
 *     summary: Get deck with all its cards and stats
 *     description: Returns complete deck information including card list and statistics (new, learning, mastered, due counts).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Deck with cards and stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     title: { type: string }
 *                     cards: { type: array }
 *                     stats:
 *                       type: object
 *                       properties:
 *                         total: { type: integer }
 *                         new: { type: integer }
 *                         learning: { type: integer }
 *                         mastered: { type: integer }
 *                         due: { type: integer }
 *       401: { description: Not authenticated }
 *       404: { description: Deck not found or unauthorized }
 *   patch:
 *     tags: [Flashcards]
 *     summary: Update deck metadata
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *     responses:
 *       200: { description: Deck updated }
 *       401: { description: Not authenticated }
 *       404: { description: Deck not found or unauthorized }
 *   delete:
 *     tags: [Flashcards]
 *     summary: Delete deck and all its cards
 *     description: Permanently removes deck and all associated cards. Cannot be undone.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Deck deleted }
 *       401: { description: Not authenticated }
 *       404: { description: Deck not found or unauthorized }
 */
router.get("/decks/:id", getDeck);
router.patch("/decks/:id", updateDeck);
router.delete("/decks/:id", deleteDeck);

/**
 * @swagger
 * /flashcards/decks/{deckId}/cards:
 *   get:
 *     tags: [Flashcards]
 *     summary: Get all cards in a deck (paginated)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deckId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50, minimum: 1, maximum: 200 }
 *     responses:
 *       200:
 *         description: Paginated card list
 *       401: { description: Not authenticated }
 *       404: { description: Deck not found or unauthorized }
 *   post:
 *     tags: [Flashcards]
 *     summary: Add a card to a deck
 *     description: Creates a new flashcard initialized with SM-2 defaults (easeFactor=2.5, repetitions=0).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deckId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [front, back]
 *             properties:
 *               front: { type: string, description: Question or term }
 *               back: { type: string, description: Answer or definition }
 *     responses:
 *       201: { description: Card added to deck }
 *       400: { description: Missing front/back }
 *       401: { description: Not authenticated }
 *       404: { description: Deck not found or unauthorized }
 */
router.get("/decks/:deckId/cards", getDeckCards);
router.post("/decks/:deckId/cards", addCard);

/**
 * @swagger
 * /flashcards/{id}:
 *   patch:
 *     tags: [Flashcards]
 *     summary: Update a flashcard's content
 *     description: Modify the front (question) or back (answer) of a card. Does not affect SM-2 scheduling.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               front: { type: string }
 *               back: { type: string }
 *     responses:
 *       200: { description: Card updated }
 *       401: { description: Not authenticated }
 *       404: { description: Card not found or unauthorized }
 *   delete:
 *     tags: [Flashcards]
 *     summary: Delete a flashcard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Card deleted }
 *       401: { description: Not authenticated }
 *       404: { description: Card not found or unauthorized }
 */
router.patch("/:id", updateCard);
router.delete("/:id", deleteCard);

/**
 * @swagger
 * /flashcards/{id}/review:
 *   post:
 *     tags: [Flashcards]
 *     summary: Review a card — updates SM-2 scheduling
 *     description: Submit review result (0-4). SM-2 algorithm calculates new ease factor, interval, and next review date. Quality 0=forgot, 4=perfect.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quality]
 *             properties:
 *               quality:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 4
 *                 description: 0=AGAIN (forgot), 1=HARD (difficult), 2/3=GOOD (correct), 4=EASY (perfect)
 *     responses:
 *       200:
 *         description: Review recorded — SM-2 updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     cardId: { type: string }
 *                     nextReviewAt: { type: string, format: date-time }
 *                     easeFactor: { type: number }
 *                     repetitions: { type: integer }
 *                     interval: { type: integer }
 *       400: { description: Invalid quality }
 *       401: { description: Not authenticated }
 *       404: { description: Card not found or unauthorized }
 */
router.post("/:id/review", reviewCard);

export default router;

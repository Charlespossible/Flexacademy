import { Router } from "express";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Full-text search across courses, lessons, questions, and topics
 */

/**
 * @swagger
 * /search:
 *   get:
 *     tags: [Search]
 *     summary: Search across the platform
 *     security: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string, minLength: 2 }
 *         description: Search query
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [course, lesson, question, topic, all], default: all }
 *       - in: query
 *         name: examCategory
 *         schema: { type: string, enum: [WAEC, JAMB, NECO, GCE, IGCSE, SAT] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Grouped search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 courses: { type: array }
 *                 lessons: { type: array }
 *                 questions: { type: array }
 *                 topics: { type: array }
 */
router.get("/", (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

export default router;

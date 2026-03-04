import { Router } from "express";
import {
  chat,
  generatePracticeQuestions,
  analyzePerformance,
  getSessions,
} from "../controllers/aiTutor.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { aiTutorRateLimiter } from "../middlewares/rateLimiter";
import { validate } from "../middlewares/validate";
import { aiChatSchema, generateQuestionsSchema } from "../validators";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: AI Tutor
 *   description: FlexBot AI tutor endpoints (streaming + analysis)
 */

/**
 * @swagger
 * /ai-tutor/chat:
 *   post:
 *     tags: [AI Tutor]
 *     summary: Chat with FlexBot (Server-Sent Events stream)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               sessionId: { type: string, format: uuid }
 *               message: { type: string }
 *               subject: { type: string }
 *               topic: { type: string }
 *     responses:
 *       200:
 *         description: SSE stream of AI response chunks
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 */
router.post("/chat", aiTutorRateLimiter, validate(aiChatSchema), chat);

/**
 * @swagger
 * /ai-tutor/generate-questions:
 *   post:
 *     tags: [AI Tutor]
 *     summary: Generate AI practice questions for a topic
 */
router.post(
  "/generate-questions",
  aiTutorRateLimiter,
  validate(generateQuestionsSchema),
  generatePracticeQuestions
);

/**
 * @swagger
 * /ai-tutor/analyze:
 *   get:
 *     tags: [AI Tutor]
 *     summary: Get AI-powered performance analysis based on quiz history
 */
router.get("/analyze", analyzePerformance);

/**
 * @swagger
 * /ai-tutor/sessions:
 *   get:
 *     tags: [AI Tutor]
 *     summary: List all AI tutor sessions for the current user
 */
router.get("/sessions", getSessions);

export default router;

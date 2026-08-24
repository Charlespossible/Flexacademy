import { Router } from "express";
import {
  chat,
  generatePracticeQuestions,
  analyzePerformance,
  getSessions,
  getSession,
  deleteSession,
} from "../controllers/aiTutor.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { aiTutorRateLimiter } from "../middlewares/rateLimiter";
import { validate } from "../middlewares/validate";
import { aiChatSchema, generateQuestionsSchema } from "../validators";

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: AI Tutor (FlexBot)
 *   description: AI-powered tutoring endpoints with SSE streaming and question generation
 */

/**
 * @swagger
 * /ai-tutor/chat:
 *   post:
 *     tags: [AI Tutor (FlexBot)]
 *     summary: Chat with FlexBot (Server-Sent Events stream)
 *     description: Stream AI responses in real-time for exam prep, tech concepts, and tutoring
 *     security: [{bearerAuth: []}]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               sessionId: { type: string, description: "Optional session ID to continue conversation" }
 *               message: { type: string, description: "Question or prompt for FlexBot" }
 *               subject: { type: string, example: "Mathematics" }
 *               topic: { type: string, example: "Trigonometry" }
 *     responses:
 *       200:
 *         description: SSE stream of AI response chunks and completion
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: AI Tutor not available in subscription tier
 */
router.post("/chat", aiTutorRateLimiter, validate(aiChatSchema), chat);

/**
 * @swagger
 * /ai-tutor/generate-questions:
 *   post:
 *     tags: [AI Tutor (FlexBot)]
 *     summary: Generate custom practice questions
 *     description: AI generates exam-style practice questions for any topic
 *     security: [{bearerAuth: []}]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject, topic]
 *             properties:
 *               subject: { type: string, example: "Physics" }
 *               topic: { type: string, example: "Newton's Laws" }
 *               examCategory: { type: string, example: "WAEC" }
 *               difficulty: { type: string, enum: [BEGINNER, INTERMEDIATE, ADVANCED, EXAM_READY], default: "INTERMEDIATE" }
 *               count: { type: number, default: 5, maximum: 20 }
 *     responses:
 *       201:
 *         description: Generated questions
 */
router.post("/generate-questions", aiTutorRateLimiter, validate(generateQuestionsSchema), generatePracticeQuestions);

/**
 * @swagger
 * /ai-tutor/analyze:
 *   get:
 *     tags: [AI Tutor (FlexBot)]
 *     summary: Analyze student performance
 *     description: AI analysis of weak areas, strong topics, and personalized study recommendations
 *     security: [{bearerAuth: []}]
 *     responses:
 *       200:
 *         description: Performance analysis with insights
 */
router.get("/analyze", analyzePerformance);

/**
 * @swagger
 * /ai-tutor/sessions:
 *   get:
 *     tags: [AI Tutor (FlexBot)]
 *     summary: List AI tutor session history
 *     description: Paginated list of all chat sessions with FlexBot
 *     security: [{bearerAuth: []}]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: string, default: "1" }
 *       - in: query
 *         name: limit
 *         schema: { type: string, default: "20" }
 *     responses:
 *       200:
 *         description: List of AI tutor sessions
 */
router.get("/sessions", getSessions);

/**
 * @swagger
 * /ai-tutor/sessions/{id}:
 *   get:
 *     tags: [AI Tutor (FlexBot)]
 *     summary: Get one session's full transcript
 *     description: Returns every stored message for a session so the chat can be reopened
 *     security: [{bearerAuth: []}]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Session with full message history
 *       404:
 *         description: Session not found
 *   delete:
 *     tags: [AI Tutor (FlexBot)]
 *     summary: Delete a conversation
 *     security: [{bearerAuth: []}]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Session deleted
 *       404:
 *         description: Session not found
 */
router.get("/sessions/:id", getSession);
router.delete("/sessions/:id", deleteSession);

export default router;

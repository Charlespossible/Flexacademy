import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import {
  startExamSimulation,
  getMySimulations,
  getSimulation,
  submitSimulation,
  getSimulationResults,
} from "../controllers/examSimulation.controller";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Exam Simulation
 *   description: Timed full-length exam simulation — server-enforced timer, auto-submit on timeout
 */

/**
 * @swagger
 * /exams/simulate:
 *   post:
 *     tags: [Exam Simulation]
 *     summary: Start a new timed exam simulation
 *     description: Creates a new timed exam session with randomized questions from the specified exam category. Server enforces the timer and will auto-submit if time expires.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [examCategory]
 *             properties:
 *               examCategory: { type: string, enum: [WAEC, JAMB, NECO, GCE, IGCSE, SAT, IELTS, GMAT, GRE] }
 *               subjectId: { type: string, format: uuid, description: Optional filter by subject }
 *               year: { type: integer, description: Optional past year to simulate }
 *               timeLimitMins: { type: integer, default: 180, minimum: 10, maximum: 240 }
 *     responses:
 *       201:
 *         description: Simulation started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     simulationId: { type: string, format: uuid }
 *                     questions: { type: array }
 *                     timeLimitSeconds: { type: integer }
 *                     expiresAt: { type: string, format: date-time }
 *       400: { description: Invalid exam category }
 *       401: { description: Not authenticated }
 */
router.post("/", startExamSimulation);

/**
 * @swagger
 * /exams/simulate/me:
 *   get:
 *     tags: [Exam Simulation]
 *     summary: List all exam simulations by current user (paginated)
 *     description: Returns user's simulation history sorted by most recent first.
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
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, SUBMITTED, TIMED_OUT] }
 *     responses:
 *       200:
 *         description: Simulation history
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
 *       401: { description: Not authenticated }
 */
router.get("/me", getMySimulations);

/**
 * @swagger
 * /exams/simulate/{id}:
 *   get:
 *     tags: [Exam Simulation]
 *     summary: Get a running simulation with remaining time
 *     description: Returns the current simulation state including all questions and server-calculated remaining time. Returns 410 if time has expired.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Simulation state with remaining time
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     simulationId: { type: string }
 *                     title: { type: string }
 *                     questions: { type: array }
 *                     secondsRemaining: { type: integer }
 *                     totalSeconds: { type: integer }
 *                     status: { type: string, enum: [ACTIVE, SUBMITTED, TIMED_OUT] }
 *       401: { description: Not authenticated }
 *       403: { description: Not your simulation }
 *       404: { description: Simulation not found }
 *       410: { description: Time expired — exam auto-submitted }
 */
router.get("/:id", getSimulation);

/**
 * @swagger
 * /exams/simulate/{id}/submit:
 *   post:
 *     tags: [Exam Simulation]
 *     summary: Submit a simulation and get automatic grading
 *     description: Grades all answers against correct options, calculates score, marks, and percentage. Stores results with timestamp.
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
 *             required: [answers]
 *             properties:
 *               answers:
 *                 type: array
 *                 description: User's answers to all questions
 *                 items:
 *                   type: object
 *                   required: [questionId, selectedOption]
 *                   properties:
 *                     questionId: { type: string, format: uuid }
 *                     selectedOption: { type: string, enum: [A, B, C, D, E] }
 *     responses:
 *       200:
 *         description: Submitted and graded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     simulationId: { type: string }
 *                     score: { type: integer }
 *                     percentage: { type: integer }
 *                     correct: { type: integer }
 *                     total: { type: integer }
 *                     submittedAt: { type: string, format: date-time }
 *       401: { description: Not authenticated }
 *       403: { description: Not your simulation }
 *       404: { description: Simulation not found }
 *       409: { description: Already submitted or time expired }
 */
router.post("/:id/submit", submitSimulation);

/**
 * @swagger
 * /exams/simulate/{id}/results:
 *   get:
 *     tags: [Exam Simulation]
 *     summary: Get detailed results with explanations
 *     description: Returns per-question breakdown with correct answers, explanations, topic mastery updates, and AI insights.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Detailed results analysis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     simulationId: { type: string }
 *                     title: { type: string }
 *                     score: { type: integer }
 *                     percentage: { type: integer }
 *                     correct: { type: integer }
 *                     total: { type: integer }
 *                     durationMins: { type: integer }
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           questionId: { type: string }
 *                           isCorrect: { type: boolean }
 *                           selectedOption: { type: string }
 *                           correctOption: { type: string }
 *                           explanation: { type: string }
 *                     weakTopics: { type: array, description: Topics with <70% accuracy }
 *       401: { description: Not authenticated }
 *       403: { description: Not your simulation }
 *       404: { description: Simulation not found }
 */
router.get("/:id/results", getSimulationResults);

export default router;

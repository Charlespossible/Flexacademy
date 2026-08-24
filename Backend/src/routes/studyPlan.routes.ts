import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import {
  getUserStudyPlans,
  createStudyPlan,
  generateStudyPlan,
  getStudyPlanItems,
  completeStudyPlanItem,
  updateStudyPlan,
  deleteStudyPlan,
} from "../controllers/studyPlan.controller";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Study Plans
 *   description: Personalised daily study schedules — manual or AI-generated based on weak areas
 */

/**
 * @swagger
 * /study-plans/me:
 *   get:
 *     tags: [Study Plans]
 *     summary: Get user's study plans (paginated)
 *     description: Returns list of active, completed, or abandoned study plans with progress summary.
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
 *         schema: { type: string, enum: [ACTIVE, COMPLETED, ABANDONED], default: ACTIVE }
 *     responses:
 *       200:
 *         description: Study plans list
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
router.get("/me", getUserStudyPlans);

/**
 * @swagger
 * /study-plans:
 *   post:
 *     tags: [Study Plans]
 *     summary: Create a manual study plan
 *     description: Create a custom study plan with manually specified items and topics.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, targetDate, items]
 *             properties:
 *               title: { type: string, minLength: 3 }
 *               description: { type: string }
 *               targetDate: { type: string, format: date-time, description: Exam or test date }
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [topicId, title, estimatedMins, dueDate]
 *                   properties:
 *                     topicId: { type: string, format: uuid }
 *                     title: { type: string }
 *                     estimatedMins: { type: integer, minimum: 30, maximum: 240 }
 *                     dueDate: { type: string, format: date-time }
 *                     priority: { type: string, enum: [HIGH, MEDIUM, LOW] }
 *     responses:
 *       201:
 *         description: Study plan created
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
router.post("/", createStudyPlan);

/**
 * @swagger
 * /study-plans/generate:
 *   post:
 *     tags: [Study Plans]
 *     summary: Generate AI study plan from weak areas
 *     description: AI analyzes your weak topics and available time to create an optimized daily schedule. Requires prior quiz attempts.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetDate]
 *             properties:
 *               targetDate: { type: string, format: date-time, description: Target exam date }
 *               title: { type: string, description: Optional custom title }
 *     responses:
 *       201:
 *         description: AI study plan generated
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
 *                     isAiGenerated: { type: boolean }
 *                     itemsCount: { type: integer }
 *       400: { description: No learning data or invalid date }
 *       401: { description: Not authenticated }
 */
router.post("/generate", generateStudyPlan);

/**
 * @swagger
 * /study-plans/{id}:
 *   patch:
 *     tags: [Study Plans]
 *     summary: Update study plan metadata
 *     description: Modify title, description, target date, or status of an existing plan.
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
 *               targetDate: { type: string, format: date-time }
 *               status: { type: string, enum: [ACTIVE, COMPLETED, ABANDONED] }
 *     responses:
 *       200: { description: Plan updated }
 *       404: { description: Plan not found or unauthorized }
 *       401: { description: Not authenticated }
 *   delete:
 *     tags: [Study Plans]
 *     summary: Delete a study plan
 *     description: Soft-delete (marks as abandoned). Cannot undo.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Plan deleted }
 *       404: { description: Plan not found or unauthorized }
 *       401: { description: Not authenticated }
 */
router.patch("/:id", updateStudyPlan);
router.delete("/:id", deleteStudyPlan);

/**
 * @swagger
 * /study-plans/{id}/items:
 *   get:
 *     tags: [Study Plans]
 *     summary: Get all items in study plan
 *     description: Returns all items ordered by due date with completion status and overdue flag.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Study plan items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array }
 *       404: { description: Plan not found or unauthorized }
 *       401: { description: Not authenticated }
 */
router.get("/:id/items", getStudyPlanItems);

/**
 * @swagger
 * /study-plans/items/{itemId}/complete:
 *   patch:
 *     tags: [Study Plans]
 *     summary: Mark item complete and earn XP
 *     description: Mark a study plan item as completed, create study session, and increment topic mastery.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Item marked complete — XP earned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     itemId: { type: string }
 *                     completedAt: { type: string, format: date-time }
 *       400: { description: Already completed }
 *       404: { description: Item not found or unauthorized }
 *       401: { description: Not authenticated }
 */
router.patch("/items/:itemId/complete", completeStudyPlanItem);

export default router;

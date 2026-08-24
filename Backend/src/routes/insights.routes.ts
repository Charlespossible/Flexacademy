import { Router } from "express";
import { authenticate, requireRoles } from "../middlewares/auth.middleware";
import {
  getTutorInsights,
  getInsightDetail,
  markInsightRead,
  logIntervention,
  getInterventionHistory,
} from "../controllers/tutorInsight.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Tutor Insights
 *   description: AI-generated briefs delivered to human tutors, plus intervention logging
 */

/**
 * @swagger
 * /insights/me:
 *   get:
 *     tags: [Tutor Insights]
 *     summary: Tutor — list all AI briefs, unread first
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isRead
 *         schema: { type: boolean }
 *         description: Filter by read status
 *       - in: query
 *         name: isActedOn
 *         schema: { type: boolean }
 *         description: Filter by acted-on status
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: Paginated insights with gap info and student details }
 *       404: { description: Tutor profile not found }
 */
router.get(
  "/me",
  authenticate,
  requireRoles("TUTOR"),
  getTutorInsights
);

/**
 * @swagger
 * /insights/interventions:
 *   get:
 *     tags: [Tutor Insights]
 *     summary: Tutor — paginated history of all logged interventions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: Interventions with student, gap topic, and booking info }
 */
router.get(
  "/interventions",
  authenticate,
  requireRoles("TUTOR"),
  getInterventionHistory
);

/**
 * @swagger
 * /insights/{id}:
 *   get:
 *     tags: [Tutor Insights]
 *     summary: Tutor — full detail of a single AI insight
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Full insight with gap evidence, student profile, intervention history }
 *       403: { description: Not your insight }
 *       404: { description: Insight not found }
 */
router.get(
  "/:id",
  authenticate,
  requireRoles("TUTOR"),
  getInsightDetail
);

/**
 * @swagger
 * /insights/{id}/read:
 *   patch:
 *     tags: [Tutor Insights]
 *     summary: Mark an insight as read (advances gap to ACKNOWLEDGED)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Insight marked as read }
 *       403: { description: Not your insight }
 *       404: { description: Insight not found }
 */
router.patch(
  "/:id/read",
  authenticate,
  requireRoles("TUTOR"),
  markInsightRead
);

/**
 * @swagger
 * /insights/{id}/intervene:
 *   post:
 *     tags: [Tutor Insights]
 *     summary: Log an intervention against an insight (advances gap to IN_PROGRESS)
 *     description: Tutor describes what they did after reviewing the AI brief.
 *                  Optionally links to a scheduled booking session.
 *                  Notifies the student and marks the insight as acted on.
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
 *             required: [action]
 *             properties:
 *               action: { type: string, description: Description of what the tutor did }
 *               notes: { type: string, description: Additional session notes }
 *               bookingId: { type: string, format: uuid, description: Optional linked session booking }
 *     responses:
 *       201: { description: Intervention logged }
 *       400: { description: Missing action or invalid bookingId }
 *       403: { description: Not your insight }
 *       404: { description: Insight not found }
 */
router.post(
  "/:id/intervene",
  authenticate,
  requireRoles("TUTOR"),
  logIntervention
);

export default router;

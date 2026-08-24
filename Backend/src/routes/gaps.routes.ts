import { Router } from "express";
import { authenticate, requireRoles } from "../middlewares/auth.middleware";
import {
  detectGaps,
  getMyGaps,
  getStudentGaps,
  updateGapStatus,
  triggerReEvaluation,
} from "../controllers/gapDetection.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Learning Gaps
 *   description: AI-detected knowledge gaps — the engine that drives tutor-student collaboration
 */

/**
 * @swagger
 * /gaps/detect/{studentId}:
 *   post:
 *     tags: [Learning Gaps]
 *     summary: Run AI gap detection for a student (Tutor or Admin)
 *     description: Analyses TopicMastery data, creates LearningGap records for new weak areas,
 *                  generates Claude-powered TutorInsight briefs, and notifies the assigned tutor.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Detection results — new gaps, existing gaps, insights generated }
 *       404: { description: Student not found }
 */
router.post(
  "/detect/:studentId",
  authenticate,
  requireRoles("TUTOR", "ADMIN", "SUPER_ADMIN"),
  detectGaps
);

/**
 * @swagger
 * /gaps/me:
 *   get:
 *     tags: [Learning Gaps]
 *     summary: Student — view own learning gaps
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [OPEN, ACKNOWLEDGED, IN_PROGRESS, RESOLVED, REGRESSED] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: Paginated list of gaps }
 */
router.get(
  "/me",
  authenticate,
  requireRoles("STUDENT"),
  getMyGaps
);

/**
 * @swagger
 * /gaps/students/{studentId}:
 *   get:
 *     tags: [Learning Gaps]
 *     summary: Tutor — view all gaps for an assigned student
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: All gaps with linked insight summaries }
 *       403: { description: No active assignment with this student }
 */
router.get(
  "/students/:studentId",
  authenticate,
  requireRoles("TUTOR"),
  getStudentGaps
);

/**
 * @swagger
 * /gaps/{id}/status:
 *   patch:
 *     tags: [Learning Gaps]
 *     summary: Tutor — update gap status to ACKNOWLEDGED or IN_PROGRESS
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
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [ACKNOWLEDGED, IN_PROGRESS] }
 *     responses:
 *       200: { description: Gap status updated }
 *       403: { description: Not assigned to this student }
 *       404: { description: Gap not found }
 */
router.patch(
  "/:id/status",
  authenticate,
  requireRoles("TUTOR"),
  updateGapStatus
);

/**
 * @swagger
 * /gaps/{id}/re-evaluate:
 *   post:
 *     tags: [Learning Gaps]
 *     summary: Trigger AI re-evaluation after a tutor intervention
 *     description: Re-checks the student's current mastery. Resolves the gap if threshold reached,
 *                  or marks REGRESSED if mastery has dropped. Updates linked interventions.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Re-evaluation result — improved, regressed, or still in progress }
 *       403: { description: Not assigned to this student }
 *       404: { description: Gap not found }
 */
router.post(
  "/:id/re-evaluate",
  authenticate,
  requireRoles("TUTOR", "ADMIN", "SUPER_ADMIN"),
  triggerReEvaluation
);

export default router;

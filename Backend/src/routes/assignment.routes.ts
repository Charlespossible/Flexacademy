import { Router } from "express";
import { authenticate, requireRoles } from "../middlewares/auth.middleware";
import {
  createAssignment,
  getMyAssignment,
  getTutorStudents,
  getStudentPerformanceProfile,
  updateAssignmentStatus,
} from "../controllers/assignment.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Assignments
 *   description: Student-tutor assignment management — the core persistent relationship in the AI-Tutor pipeline
 */

/**
 * @swagger
 * /assignments:
 *   post:
 *     tags: [Assignments]
 *     summary: Create a student-tutor assignment (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, tutorProfileId, subjectId]
 *             properties:
 *               studentId: { type: string, format: uuid }
 *               tutorProfileId: { type: string, format: uuid }
 *               subjectId: { type: string, format: uuid }
 *     responses:
 *       201: { description: Assignment created }
 *       400: { description: Missing required fields }
 *       403: { description: Tutor not verified/approved }
 *       404: { description: Student, tutor, or subject not found }
 *       409: { description: Tutor at capacity or duplicate assignment }
 */
router.post(
  "/",
  authenticate,
  requireRoles("ADMIN", "SUPER_ADMIN"),
  createAssignment
);

/**
 * @swagger
 * /assignments/me:
 *   get:
 *     tags: [Assignments]
 *     summary: Student — get own active assignments with gap summary
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Active assignments with tutor info and open gaps }
 */
router.get(
  "/me",
  authenticate,
  requireRoles("STUDENT"),
  getMyAssignment
);

/**
 * @swagger
 * /assignments/me/students:
 *   get:
 *     tags: [Assignments]
 *     summary: Tutor — list all assigned students with mastery stats
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Students with performance summaries }
 *       404: { description: Tutor profile not found }
 */
router.get(
  "/me/students",
  authenticate,
  requireRoles("TUTOR"),
  getTutorStudents
);

/**
 * @swagger
 * /assignments/students/{studentId}:
 *   get:
 *     tags: [Assignments]
 *     summary: Tutor — full AI performance profile for an assigned student
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Full profile — topic mastery, quizzes, exams, active gaps }
 *       403: { description: No active assignment with this student }
 *       404: { description: Student or tutor profile not found }
 */
router.get(
  "/students/:studentId",
  authenticate,
  requireRoles("TUTOR"),
  getStudentPerformanceProfile
);

/**
 * @swagger
 * /assignments/{id}/status:
 *   patch:
 *     tags: [Assignments]
 *     summary: Update assignment status (tutor, student, or admin)
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
 *               status: { type: string, enum: [PAUSED, COMPLETED, TERMINATED] }
 *               notes: { type: string }
 *     responses:
 *       200: { description: Assignment updated }
 *       403: { description: Not the assigned tutor/student or admin }
 *       404: { description: Assignment not found }
 *       409: { description: Assignment already finalised }
 */
router.patch(
  "/:id/status",
  authenticate,
  updateAssignmentStatus
);

export default router;

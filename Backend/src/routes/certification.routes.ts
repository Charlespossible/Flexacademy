import { Router } from "express";
import { authenticate, requireRoles } from "../middlewares/auth.middleware";
import {
  getMyCertifications,
  getReadinessStatus,
  requestCertification,
  tutorCoSign,
  tutorDefer,
  verifyCertification,
} from "../controllers/certification.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Certifications
 *   description: Exam readiness certification — AI scores + tutor co-sign before a student sits an exam
 */

/**
 * @swagger
 * /certifications/verify/{certificationId}:
 *   get:
 *     tags: [Certifications]
 *     summary: Public — verify a certification credential
 *     description: Anyone can verify a student's exam readiness certification using the credential ID.
 *     parameters:
 *       - in: path
 *         name: certificationId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Certification is valid }
 *       404: { description: Certification not found or not yet issued }
 */
router.get("/verify/:certificationId", verifyCertification);

/**
 * @swagger
 * /certifications/me:
 *   get:
 *     tags: [Certifications]
 *     summary: Student — list all personal certifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: All certifications across exam categories }
 */
router.get(
  "/me",
  authenticate,
  requireRoles("STUDENT"),
  getMyCertifications
);

/**
 * @swagger
 * /certifications/me/readiness:
 *   get:
 *     tags: [Certifications]
 *     summary: Student — get live AI readiness score and eligibility status
 *     description: Computes readiness from TopicMastery, counts open gaps, returns
 *                  subject breakdown and eligibility flag for certification request.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: examCategory
 *         schema: { type: string, enum: [WAEC, JAMB, NECO, GCE, IGCSE, SAT, IELTS, GMAT, GRE] }
 *         description: Optional — filter to a specific exam category
 *     responses:
 *       200: { description: Readiness score, level, subject breakdown, eligibility flag }
 */
router.get(
  "/me/readiness",
  authenticate,
  requireRoles("STUDENT"),
  getReadinessStatus
);

/**
 * @swagger
 * /certifications/request:
 *   post:
 *     tags: [Certifications]
 *     summary: Student — request exam readiness certification
 *     description: AI validates score (≥75%) and confirms all gaps are resolved before
 *                  creating a PENDING_REVIEW record. The assigned tutor is notified.
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
 *     responses:
 *       201: { description: Certification request submitted, tutor notified }
 *       400: { description: No study data or missing examCategory }
 *       403: { description: Score below threshold or open gaps remain }
 *       409: { description: Certification already pending or certified }
 */
router.post(
  "/request",
  authenticate,
  requireRoles("STUDENT"),
  requestCertification
);

/**
 * @swagger
 * /certifications/{id}/co-sign:
 *   patch:
 *     tags: [Certifications]
 *     summary: Tutor — co-sign and certify a student as exam-ready
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes: { type: string, description: Optional tutor review notes }
 *     responses:
 *       200: { description: Student certified as exam-ready }
 *       403: { description: Not assigned to this student }
 *       404: { description: Certification not found }
 *       409: { description: Certification not in PENDING_REVIEW state }
 */
router.patch(
  "/:id/co-sign",
  authenticate,
  requireRoles("TUTOR"),
  tutorCoSign
);

/**
 * @swagger
 * /certifications/{id}/defer:
 *   patch:
 *     tags: [Certifications]
 *     summary: Tutor — defer a certification with a reason
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
 *             required: [reason]
 *             properties:
 *               reason: { type: string, description: Why the tutor is deferring certification }
 *     responses:
 *       200: { description: Certification deferred, student notified }
 *       400: { description: Reason is required }
 *       403: { description: Not assigned to this student }
 *       404: { description: Certification not found }
 *       409: { description: Certification not in PENDING_REVIEW state }
 */
router.patch(
  "/:id/defer",
  authenticate,
  requireRoles("TUTOR"),
  tutorDefer
);

export default router;

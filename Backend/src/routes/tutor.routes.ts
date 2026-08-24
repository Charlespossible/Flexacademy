import { Router } from "express";
import { authenticate, requireRoles } from "../middlewares/auth.middleware";
import { getTutorDashboard, updateTutorProfile, applyAsTutor } from "../controllers/tutor.controller";

const router = Router();

// ── Tutor self-serve (authenticated, TUTOR role) ──────────────────────────────
// These MUST be defined before /:id to avoid being swallowed by the wildcard.
router.get("/me/dashboard", authenticate, requireRoles("TUTOR"), getTutorDashboard);
router.patch("/me", authenticate, requireRoles("TUTOR"), updateTutorProfile);

/**
 * @swagger
 * tags:
 *   name: Tutor Marketplace
 *   description: Browse tutors, apply to become a tutor, manage tutor profiles
 */

/**
 * @swagger
 * /tutors:
 *   get:
 *     tags: [Tutor Marketplace]
 *     summary: Browse verified tutors — filter by subject, rating, price, availability
 *     security: []
 *     parameters:
 *       - in: query
 *         name: subject
 *         schema: { type: string }
 *       - in: query
 *         name: minRating
 *         schema: { type: number, minimum: 0, maximum: 5 }
 *       - in: query
 *         name: maxRate
 *         schema: { type: number }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200: { description: Paginated tutor list }
 */
router.get("/", (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

/**
 * @swagger
 * /tutors/{id}:
 *   get:
 *     tags: [Tutor Marketplace]
 *     summary: Get a tutor's public profile
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Tutor profile }
 */
router.get("/:id", (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

/**
 * @swagger
 * /tutors/{id}/availability:
 *   get:
 *     tags: [Tutor Marketplace]
 *     summary: Get a tutor's available slots
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Availability slots }
 */
router.get("/:id/availability", (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

/**
 * @swagger
 * /tutors/{id}/reviews:
 *   get:
 *     tags: [Tutor Marketplace]
 *     summary: Get all public reviews for a tutor
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Review list }
 */
router.get("/:id/reviews", (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

/**
 * @swagger
 * /tutors/apply:
 *   post:
 *     tags: [Tutor Marketplace]
 *     summary: Submit a tutor application
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bio, qualifications, specializations, subjectIds, yearsOfExperience, hourlyRate]
 *             properties:
 *               bio: { type: string, minLength: 50 }
 *               qualifications: { type: array, items: { type: string } }
 *               specializations: { type: array, items: { type: string } }
 *               subjectIds: { type: array, items: { type: string, format: uuid } }
 *               yearsOfExperience: { type: integer }
 *               hourlyRate: { type: number }
 *               coverLetter: { type: string }
 *     responses:
 *       201: { description: Application submitted }
 */
router.post("/apply", authenticate, requireRoles("TUTOR"), applyAsTutor);

/**
 * @swagger
 * /tutors/me:
 *   patch:
 *     tags: [Tutor Marketplace]
 *     summary: Update own tutor profile (tutors only)
 *     responses:
 *       200: { description: Profile updated }
 */

/**
 * @swagger
 * /tutors/me/availability:
 *   patch:
 *     tags: [Tutor Marketplace]
 *     summary: Update availability slots (tutors only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [slots]
 *             properties:
 *               slots:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     dayOfWeek: { type: integer, minimum: 0, maximum: 6 }
 *                     startTime: { type: string, example: "09:00" }
 *                     endTime: { type: string, example: "11:00" }
 *     responses:
 *       200: { description: Availability updated }
 */
router.patch("/me/availability", authenticate, requireRoles("TUTOR"), (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

/**
 * @swagger
 * /tutors/me/sessions:
 *   get:
 *     tags: [Tutor Marketplace]
 *     summary: Get tutor's booking history (tutors only)
 *     responses:
 *       200: { description: Session history }
 */
router.get("/me/sessions", authenticate, requireRoles("TUTOR"), (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

/**
 * @swagger
 * /tutors/me/earnings:
 *   get:
 *     tags: [Tutor Marketplace]
 *     summary: Get tutor earnings breakdown (tutors only)
 *     responses:
 *       200: { description: Earnings records }
 */
router.get("/me/earnings", authenticate, requireRoles("TUTOR"), (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

export default router;

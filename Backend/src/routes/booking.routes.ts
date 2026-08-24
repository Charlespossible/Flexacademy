import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: 1-to-1 tutor session booking management
 */

/**
 * @swagger
 * /bookings:
 *   post:
 *     tags: [Bookings]
 *     summary: Create a new booking with a tutor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tutorProfileId, subject, scheduledAt]
 *             properties:
 *               tutorProfileId: { type: string, format: uuid }
 *               subject: { type: string }
 *               topic: { type: string }
 *               scheduledAt: { type: string, format: date-time }
 *               durationMins: { type: integer, minimum: 30, maximum: 180, default: 60 }
 *               studentNotes: { type: string }
 *     responses:
 *       201: { description: Booking created — payment initiated }
 */
router.post("/", (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

/**
 * @swagger
 * /bookings/me:
 *   get:
 *     tags: [Bookings]
 *     summary: Get all bookings for the current student
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, CONFIRMED, COMPLETED, CANCELLED] }
 *     responses:
 *       200: { description: Booking list }
 */
router.get("/me", (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     tags: [Bookings]
 *     summary: Get a single booking by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Booking detail }
 */
router.get("/:id", (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

/**
 * @swagger
 * /bookings/{id}/cancel:
 *   patch:
 *     tags: [Bookings]
 *     summary: Cancel a booking
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
 *               reason: { type: string }
 *     responses:
 *       200: { description: Booking cancelled }
 */
router.patch("/:id/cancel", (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

/**
 * @swagger
 * /bookings/{id}/reschedule:
 *   patch:
 *     tags: [Bookings]
 *     summary: Reschedule a booking to a new time
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
 *             required: [scheduledAt]
 *             properties:
 *               scheduledAt: { type: string, format: date-time }
 *     responses:
 *       200: { description: Booking rescheduled }
 */
router.patch("/:id/reschedule", (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

/**
 * @swagger
 * /bookings/{id}/review:
 *   post:
 *     tags: [Bookings]
 *     summary: Submit a review for a completed session
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
 *             required: [rating]
 *             properties:
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               comment: { type: string }
 *     responses:
 *       201: { description: Review submitted }
 */
router.post("/:id/review", (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

export default router;

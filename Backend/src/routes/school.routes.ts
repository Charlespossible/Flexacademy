import { Router } from "express";
import { authenticate, requireRoles } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Schools
 *   description: School / institution B2B licensing layer
 */

/**
 * @swagger
 * /schools/register:
 *   post:
 *     tags: [Schools]
 *     summary: Register a new school or institution
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               address: { type: string }
 *               state: { type: string }
 *               country: { type: string, default: Nigeria }
 *               contactEmail: { type: string, format: email }
 *               contactPhone: { type: string }
 *     responses:
 *       201: { description: School registered }
 */
router.post("/register", authenticate, (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

/**
 * @swagger
 * /schools/{id}:
 *   get:
 *     tags: [Schools]
 *     summary: Get school details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: School data }
 */
router.get("/:id", authenticate, (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

/**
 * @swagger
 * /schools/{id}/students:
 *   get:
 *     tags: [Schools]
 *     summary: Get all students enrolled under a school license
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Student list }
 */
router.get("/:id/students", authenticate, requireRoles("SCHOOL_ADMIN", "ADMIN", "SUPER_ADMIN"), (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

/**
 * @swagger
 * /schools/{id}/bulk-enroll:
 *   post:
 *     tags: [Schools]
 *     summary: Bulk enroll students by email list
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
 *             required: [emails]
 *             properties:
 *               emails: { type: array, items: { type: string, format: email }, maxItems: 500 }
 *               tier: { type: string, enum: [FREE, BASIC, PRO, ELITE] }
 *     responses:
 *       200: { description: Students enrolled }
 */
router.post("/:id/bulk-enroll", authenticate, requireRoles("SCHOOL_ADMIN", "ADMIN", "SUPER_ADMIN"), (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

/**
 * @swagger
 * /schools/{id}/analytics:
 *   get:
 *     tags: [Schools]
 *     summary: Aggregate analytics for the school (average scores, top subjects)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: School analytics }
 */
router.get("/:id/analytics", authenticate, requireRoles("SCHOOL_ADMIN", "ADMIN", "SUPER_ADMIN"), (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

/**
 * @swagger
 * /schools/{id}/leaderboard:
 *   get:
 *     tags: [Schools]
 *     summary: School-scoped leaderboard (internal ranking among enrolled students)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: School leaderboard }
 */
router.get("/:id/leaderboard", authenticate, (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

/**
 * @swagger
 * /schools/licenses/purchase:
 *   post:
 *     tags: [Schools]
 *     summary: Purchase or renew a school license
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [schoolId, tier, maxStudents]
 *             properties:
 *               schoolId: { type: string, format: uuid }
 *               tier: { type: string, enum: [BASIC, PRO, ELITE] }
 *               maxStudents: { type: integer, minimum: 10 }
 *     responses:
 *       200: { description: License purchased — payment initiated }
 */
router.post("/licenses/purchase", authenticate, (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

export default router;

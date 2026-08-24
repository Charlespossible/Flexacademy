import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Certificates
 *   description: Course completion certificates with public verification
 */

/**
 * @swagger
 * /certificates/me:
 *   get:
 *     tags: [Certificates]
 *     summary: Get all certificates earned by current user
 *     responses:
 *       200: { description: Certificate list }
 */
router.get("/me", authenticate, (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

/**
 * @swagger
 * /certificates/verify/{credentialId}:
 *   get:
 *     tags: [Certificates]
 *     summary: Publicly verify a certificate by credential ID (for employers / institutions)
 *     security: []
 *     parameters:
 *       - in: path
 *         name: credentialId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Certificate valid }
 *       404: { description: Certificate not found }
 */
router.get("/verify/:credentialId", (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

export default router;

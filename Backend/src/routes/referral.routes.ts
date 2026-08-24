import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Referrals
 *   description: Referral program — share code, track conversions and rewards
 */

/**
 * @swagger
 * /referrals/me/code:
 *   get:
 *     tags: [Referrals]
 *     summary: Get current user's unique referral code
 *     responses:
 *       200: { description: Referral code and shareable URL }
 */
router.get("/me/code", (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

/**
 * @swagger
 * /referrals/me/stats:
 *   get:
 *     tags: [Referrals]
 *     summary: Get referral stats — total referred, conversions, rewards earned
 *     responses:
 *       200: { description: Referral stats }
 */
router.get("/me/stats", (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

export default router;

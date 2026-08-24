import { Router } from "express";
import { getPlans } from "../controllers/subscription.controller";

const router = Router();

/**
 * @swagger
 * /subscriptions/plans:
 *   get:
 *     tags: [Subscriptions]
 *     summary: The plan ladder
 *     description: >
 *       Canonical prices, read from pricing.config.json. Every surface that
 *       shows or charges a price reads this, so the storefront can never quote
 *       a figure the checkout does not honour. Amounts are integer kobo.
 *     responses:
 *       200: { description: Plans currently on sale }
 */
router.get("/plans", getPlans);

// The rest of the subscription surface is still to be built (§16 items 3+).
router.all("*", (_req, res) =>
  res.status(501).json({ success: false, message: "Not implemented yet." })
);

export default router;

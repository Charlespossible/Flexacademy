import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import {
  initiateCheckout,
  verifyPayment,
  renewSubscription,
} from "../controllers/payment.controller";

const router = Router();

// POST /api/v1/payments/checkout — start a FlexPass checkout session
router.post("/checkout", authenticate, initiateCheckout);

// GET /api/v1/payments/verify/:reference — confirm a payment on return redirect
router.get("/verify/:reference", authenticate, verifyPayment);

// POST /api/v1/payments/renew — internal cron / admin trigger for monthly renewal
router.post("/renew", renewSubscription);

export default router;

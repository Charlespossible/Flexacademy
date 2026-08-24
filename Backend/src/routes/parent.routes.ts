import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import {
  getChildren,
  linkChild,
  getChildProgress,
  getAlerts,
  markAlertRead,
} from "../controllers/parent.controller";

const router = Router();
router.use(authenticate);

// ── Children ────────────────────────────────────────────────────────────────
router.get("/children", getChildren);
router.post("/link-child", linkChild);
router.get("/children/:id/progress", getChildProgress);

// ── Alerts ──────────────────────────────────────────────────────────────────
router.get("/alerts", getAlerts);
router.patch("/alerts/:id/read", markAlertRead);

export default router;

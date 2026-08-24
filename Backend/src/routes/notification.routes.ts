import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import {
  getNotifications,
  markAsRead,
  markAllRead,
  deleteNotification,
} from "../controllers/notification.controller";

const router = Router();
router.use(authenticate);

router.get("/me", getNotifications);
router.patch("/:id/read", markAsRead);
router.post("/read-all", markAllRead);
router.delete("/:id", deleteNotification);

// Placeholder stubs for preferences + push (not yet implemented)
router.get("/preferences", (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));
router.patch("/preferences", (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));
router.post("/push/subscribe", (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));
router.delete("/push/subscribe", (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

export default router;

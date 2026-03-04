// ─────────────────────────────────────────────
// routes/auth.routes.js
// ─────────────────────────────────────────────
import { Router } from "express";
import passport from "passport";
import {
  register,
  login,
  refreshToken,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  googleCallback,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/index.js";
import { authRateLimiter } from "../middlewares/index.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

router.post("/register", authRateLimiter, register);
router.post("/login", authRateLimiter, login);
router.post("/refresh", refreshToken);
router.post("/logout", authenticate, logout);
router.get("/verify-email/:token", verifyEmail);
router.post("/forgot-password", authRateLimiter, forgotPassword);
router.post("/reset-password", authRateLimiter, resetPassword);

// Google OAuth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/auth/error", session: false }),
  googleCallback
);

export default router;

// ─────────────────────────────────────────────
// routes/aiTutor.routes.js
// ─────────────────────────────────────────────
import { Router as AiRouter } from "express";
import {
  chat,
  generatePracticeQuestions,
  analyzePerformance,
  getSessions,
} from "../controllers/aiTutor.controller.js";
import { authenticate as auth, aiTutorRateLimiter } from "../middlewares/index.js";

const aiRouter = AiRouter();

aiRouter.use(auth);
aiRouter.post("/chat", aiTutorRateLimiter, chat);
aiRouter.post("/generate-questions", aiTutorRateLimiter, generatePracticeQuestions);
aiRouter.get("/analyze", analyzePerformance);
aiRouter.get("/sessions", getSessions);

export { aiRouter as default };

// ─────────────────────────────────────────────
// NOTE: Remaining route files follow the same pattern.
// Each is a thin router that imports its controller.
// Stubs below to complete the structure:
// ─────────────────────────────────────────────

// routes/user.routes.js
import { Router as UserRouter } from "express";
const userRouter = UserRouter();
userRouter.get("/me", authenticate, (req, res) => res.json({ data: req.user }));
export { userRouter };

// routes/subject.routes.js → CRUD for subjects (admin + public read)
// routes/course.routes.js  → CRUD, enrollment, search
// routes/lesson.routes.js  → CRUD, mark complete
// routes/quiz.routes.js    → CRUD, start attempt, submit
// routes/question.routes.js → CRUD, bulk import
// routes/progress.routes.js → get user progress, streaks
// routes/subscription.routes.js → plans, checkout, portal
// routes/leaderboard.routes.js → daily/weekly/all-time rankings
// routes/liveClass.routes.js → schedule, book, join
// routes/notification.routes.js → list, mark read
// routes/admin.routes.js → analytics dashboard, user management
// routes/webhook.routes.js → Stripe, Paystack webhooks

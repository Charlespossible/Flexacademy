// Stub route files — each follows the same pattern as auth.routes.ts
// Wire up your controller → validator → middleware → route

import { Router } from "express";

// ─── user.routes.ts ───────────────────────────
export const userRouter = Router();
// GET  /users/me
// PATCH /users/me
// GET  /users/me/badges
// GET  /users/me/streak
// GET  /users/:id (admin)
// PATCH /users/:id/status (admin)

// ─── subject.routes.ts ────────────────────────
export const subjectRouter = Router();
// GET  /subjects           (public)
// GET  /subjects/:slug     (public)
// POST /subjects           (admin)
// PATCH /subjects/:id      (admin)
// DELETE /subjects/:id     (admin)

// ─── course.routes.ts ─────────────────────────
export const courseRouter = Router();
// GET  /courses            (public, filterable: subject, grade, difficulty)
// GET  /courses/:slug      (public)
// POST /courses/:id/enroll (auth)
// POST /courses            (admin)
// PATCH /courses/:id       (admin)
// DELETE /courses/:id      (admin)

// ─── lesson.routes.ts ─────────────────────────
export const lessonRouter = Router();
// GET  /lessons/:id        (auth + subscription check)
// POST /lessons/:id/complete (auth)
// POST /lessons            (admin)
// PATCH /lessons/:id       (admin)

// ─── quiz.routes.ts ───────────────────────────
export const quizRouter = Router();
// GET  /quizzes            (public, filterable: subject, exam, year)
// GET  /quizzes/:id        (public)
// POST /quizzes/:id/start  (auth)
// POST /quizzes/attempts/:attemptId/submit (auth)
// GET  /quizzes/attempts/:attemptId/results (auth)
// GET  /quizzes/attempts/me (auth — list user attempts)
// POST /quizzes            (admin)

// ─── question.routes.ts ───────────────────────
export const questionRouter = Router();
// GET  /questions          (auth, filterable: topic, exam, year, difficulty)
// POST /questions          (admin)
// POST /questions/bulk     (admin — import from JSON/CSV)
// PATCH /questions/:id     (admin)
// DELETE /questions/:id    (admin)

// ─── progress.routes.ts ───────────────────────
export const progressRouter = Router();
// GET  /progress/me        (auth — all courses + streaks)
// GET  /progress/courses/:courseId (auth)

// ─── subscription.routes.ts ───────────────────
export const subscriptionRouter = Router();
// GET  /subscriptions/plans        (public)
// GET  /subscriptions/me           (auth)
// POST /subscriptions/checkout     (auth — Stripe/Paystack)
// POST /subscriptions/cancel       (auth)
// GET  /subscriptions/portal       (auth — Stripe billing portal)

// ─── leaderboard.routes.ts ───────────────────
export const leaderboardRouter = Router();
// GET  /leaderboard?period=weekly&subject=mathematics
// GET  /leaderboard/me             (auth — user's own rank)

// ─── liveClass.routes.ts ─────────────────────
export const liveClassRouter = Router();
// GET  /live-classes               (auth)
// GET  /live-classes/:id           (auth)
// POST /live-classes/:id/book      (auth)
// POST /live-classes               (tutor)
// PATCH /live-classes/:id          (tutor/admin)

// ─── notification.routes.ts ──────────────────
export const notificationRouter = Router();
// GET  /notifications/me           (auth)
// PATCH /notifications/:id/read    (auth)
// POST /notifications/read-all     (auth)

// ─── admin.routes.ts ─────────────────────────
export const adminRouter = Router();
// GET  /admin/stats                (admin — dashboard metrics)
// GET  /admin/users                (admin)
// PATCH /admin/users/:id/role      (super_admin)
// GET  /admin/revenue              (admin)

// ─── webhook.routes.ts ───────────────────────
export const webhookRouter = Router();
// POST /webhooks/stripe
// POST /webhooks/paystack

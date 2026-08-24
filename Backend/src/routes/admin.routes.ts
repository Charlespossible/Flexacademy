import { Router } from "express";
import { authenticate, requireRoles } from "../middlewares/auth.middleware";
import {
  getAdminStats,
  getTutorApplications,
  reviewTutorApplication,
  getUsers,
  toggleUserSuspension,
  getCourseSubmissions,
  reviewCourse,
} from "../controllers/admin.controller";

const router = Router();
router.use(authenticate, requireRoles("ADMIN", "SUPER_ADMIN"));

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only platform management endpoints
 */

// ── Dashboard ─────────────────────────────────────
/**
 * @swagger
 * /admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Platform overview stats (users, revenue, active sessions)
 *     responses:
 *       200: { description: Stats object }
 */
router.get("/stats", getAdminStats);

/**
 * @swagger
 * /admin/analytics/dau:
 *   get:
 *     tags: [Admin]
 *     summary: Daily Active Users chart data
 *     responses:
 *       200: { description: DAU series }
 */
router.get("/analytics/dau", (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

/**
 * @swagger
 * /admin/analytics/retention:
 *   get:
 *     tags: [Admin]
 *     summary: User retention cohort data
 *     responses:
 *       200: { description: Retention data }
 */
router.get("/analytics/retention", (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

/**
 * @swagger
 * /admin/analytics/top-subjects:
 *   get:
 *     tags: [Admin]
 *     summary: Most studied subjects ranked by session count
 *     responses:
 *       200: { description: Ranked subjects }
 */
router.get("/analytics/top-subjects", (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

/**
 * @swagger
 * /admin/analytics/ai-usage:
 *   get:
 *     tags: [Admin]
 *     summary: AI token consumption and cost by date/model
 *     responses:
 *       200: { description: AI usage metrics }
 */
router.get("/analytics/ai-usage", (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

/**
 * @swagger
 * /admin/analytics/revenue:
 *   get:
 *     tags: [Admin]
 *     summary: Revenue breakdown by period, tier, and provider
 *     responses:
 *       200: { description: Revenue data }
 */
router.get("/analytics/revenue", (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

// ── Users ─────────────────────────────────────────
/**
 * @swagger
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all users — filterable by role, tier, status
 *     parameters:
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [STUDENT, TUTOR, PARENT, ADMIN] }
 *       - in: query
 *         name: tier
 *         schema: { type: string, enum: [FREE, BASIC, PRO, ELITE] }
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Search by name or email
 *     responses:
 *       200: { description: Paginated user list }
 */
router.get("/users", getUsers);

/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get full user profile by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Full user record }
 */
router.get("/users/:id", (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

/**
 * @swagger
 * /admin/users/{id}/role:
 *   patch:
 *     tags: [Admin]
 *     summary: Change a user's role (super_admin only)
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
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [STUDENT, TUTOR, PARENT, SCHOOL_ADMIN, ADMIN, SUPER_ADMIN] }
 *     responses:
 *       200: { description: Role updated }
 */
router.patch("/users/:id/role", requireRoles("SUPER_ADMIN"), (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

/**
 * @swagger
 * /admin/users/{id}/suspend:
 *   post:
 *     tags: [Admin]
 *     summary: Suspend or unsuspend a user account
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Account status toggled }
 */
router.post("/users/:id/suspend", toggleUserSuspension);

/**
 * @swagger
 * /admin/users/{id}/impersonate:
 *   post:
 *     tags: [Admin]
 *     summary: Generate a temporary access token to impersonate a user (support tool)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Temporary token issued }
 */
router.post("/users/:id/impersonate", requireRoles("SUPER_ADMIN"), (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

// ── Content ───────────────────────────────────────
/**
 * @swagger
 * /admin/courses:
 *   get:
 *     tags: [Admin]
 *     summary: Content review queue
 *     description: >
 *       Tutor-submitted courses awaiting review, oldest submission first.
 *       Defaults to PENDING_REVIEW; pass ?status= to inspect other states.
 *       Includes the authoring tutor and the full lesson list for review.
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [DRAFT, PENDING_REVIEW, APPROVED, REJECTED, ARCHIVED] }
 *       - in: query
 *         name: page
 *         schema: { type: string, default: "1" }
 *       - in: query
 *         name: limit
 *         schema: { type: string, default: "20" }
 *     responses:
 *       200: { description: Paginated submissions }
 */
router.get("/courses", getCourseSubmissions);

/**
 * @swagger
 * /admin/courses/{id}/review:
 *   patch:
 *     tags: [Admin]
 *     summary: Approve or reject a submitted course
 *     description: >
 *       Approving sets status=APPROVED and publishes the course to students.
 *       Rejecting requires a reviewNote, which is shown to the tutor.
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
 *             required: [action]
 *             properties:
 *               action:     { type: string, enum: [approve, reject] }
 *               reviewNote: { type: string, description: "Required when rejecting" }
 *     responses:
 *       200: { description: Reviewed }
 *       400: { description: Missing action or reviewNote }
 *       409: { description: Course is not awaiting review }
 */
router.patch("/courses/:id/review", reviewCourse);

/**
 * @swagger
 * /admin/questions/flagged:
 *   get:
 *     tags: [Admin]
 *     summary: Get questions reported by users that need review
 *     responses:
 *       200: { description: Flagged question list }
 */
router.get("/questions/flagged", (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

/**
 * @swagger
 * /admin/questions/{id}/verify:
 *   patch:
 *     tags: [Admin]
 *     summary: Mark a question as verified by an admin
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Question verified }
 */
router.patch("/questions/:id/verify", (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

/**
 * @swagger
 * /admin/questions/bulk-import:
 *   post:
 *     tags: [Admin]
 *     summary: Bulk import past questions from JSON or CSV payload
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [questions]
 *             properties:
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     body: { type: string }
 *                     examCategory: { type: string }
 *                     year: { type: integer }
 *                     subjectId: { type: string }
 *                     options: { type: array }
 *                     explanation: { type: string }
 *     responses:
 *       201: { description: Questions imported }
 */
router.post("/questions/bulk-import", (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

// ── Tutor Management ──────────────────────────────
/**
 * @swagger
 * /admin/tutors/applications:
 *   get:
 *     tags: [Admin]
 *     summary: List all pending tutor applications
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, UNDER_REVIEW, APPROVED, REJECTED] }
 *     responses:
 *       200: { description: Application list }
 */
router.get("/tutors/applications", getTutorApplications);

/**
 * @swagger
 * /admin/tutors/{id}/approve:
 *   patch:
 *     tags: [Admin]
 *     summary: Approve a tutor application
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Tutor approved }
 */
router.patch("/tutors/:id/approve", reviewTutorApplication);

/**
 * @swagger
 * /admin/tutors/{id}/suspend:
 *   post:
 *     tags: [Admin]
 *     summary: Suspend a tutor from the marketplace
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Tutor suspended }
 */
router.post("/tutors/:id/suspend", (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

// ── Announcements ─────────────────────────────────
/**
 * @swagger
 * /admin/announcements:
 *   get:
 *     tags: [Admin]
 *     summary: List all announcements
 *     responses:
 *       200: { description: Announcement list }
 *   post:
 *     tags: [Admin]
 *     summary: Create a new platform announcement
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, body]
 *             properties:
 *               title: { type: string }
 *               body: { type: string }
 *               targetRole: { type: string, enum: [STUDENT, TUTOR, PARENT] }
 *               expiresAt: { type: string, format: date-time }
 *     responses:
 *       201: { description: Announcement created }
 */
router.get("/announcements", (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));
router.post("/announcements", (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

/**
 * @swagger
 * /admin/announcements/{id}/publish:
 *   patch:
 *     tags: [Admin]
 *     summary: Publish an announcement
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Published }
 */
router.patch("/announcements/:id/publish", (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));

export default router;

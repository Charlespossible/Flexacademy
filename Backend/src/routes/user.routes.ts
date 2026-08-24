import { Router } from "express";
import {
  getMe,
  updateMe,
  updateAvatar,
  getDashboard,
  getBadges,
  getStreak,
  getActivity,
  getCertificates,
  getBookmarks,
  deleteBookmark,
  changePassword,
} from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Users & Profile
 *   description: User profile and personal data endpoints
 */

/**
 * @swagger
 * /users/me:
 *   get:
 *     tags: [Users & Profile]
 *     summary: Get current user profile
 *     security: [{bearerAuth: []}]
 *     responses:
 *       200:
 *         description: User profile retrieved
 *       401:
 *         description: Unauthorized
 */
router.get("/me", getMe);

/**
 * @swagger
 * /users/me:
 *   patch:
 *     tags: [Users & Profile]
 *     summary: Update current user profile
 *     security: [{bearerAuth: []}]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               phone: { type: string }
 *               gradeLevel: { type: string, example: "SS3" }
 *               curriculum: { type: string, example: "WAEC" }
 *               school: { type: string }
 *               state: { type: string }
 *               weeklyGoalMins: { type: number }
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.patch("/me", updateMe);

/**
 * @swagger
 * /users/me/avatar:
 *   post:
 *     tags: [Users & Profile]
 *     summary: Upload/update user avatar
 *     security: [{bearerAuth: []}]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar updated successfully
 */
router.post("/me/avatar", updateAvatar);

/**
 * @swagger
 * /users/me/dashboard:
 *   get:
 *     tags: [Users & Profile]
 *     summary: Get user dashboard summary
 *     security: [{bearerAuth: []}]
 *     responses:
 *       200:
 *         description: Dashboard data retrieved
 */
router.get("/me/dashboard", getDashboard);

/**
 * @swagger
 * /users/me/badges:
 *   get:
 *     tags: [Users & Profile]
 *     summary: Get all user badges
 *     security: [{bearerAuth: []}]
 *     responses:
 *       200:
 *         description: Badges retrieved successfully
 */
router.get("/me/badges", getBadges);

/**
 * @swagger
 * /users/me/streak:
 *   get:
 *     tags: [Users & Profile]
 *     summary: Get current study streak
 *     security: [{bearerAuth: []}]
 *     responses:
 *       200:
 *         description: Streak data retrieved
 */
router.get("/me/streak", getStreak);

/**
 * @swagger
 * /users/me/activity:
 *   get:
 *     tags: [Users & Profile]
 *     summary: Get user activity and study sessions
 *     security: [{bearerAuth: []}]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema: { type: string, default: "30" }
 *       - in: query
 *         name: limit
 *         schema: { type: string, default: "50" }
 *     responses:
 *       200:
 *         description: Activity data retrieved
 */
router.get("/me/activity", getActivity);

/**
 * @swagger
 * /users/me/certificates:
 *   get:
 *     tags: [Users & Profile]
 *     summary: Get user certificates
 *     security: [{bearerAuth: []}]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: string, default: "1" }
 *       - in: query
 *         name: limit
 *         schema: { type: string, default: "20" }
 *     responses:
 *       200:
 *         description: Certificates retrieved successfully
 */
router.get("/me/certificates", getCertificates);

/**
 * @swagger
 * /users/me/bookmarks:
 *   get:
 *     tags: [Users & Profile]
 *     summary: Get user bookmarks
 *     security: [{bearerAuth: []}]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: string, default: "1" }
 *       - in: query
 *         name: limit
 *         schema: { type: string, default: "20" }
 *     responses:
 *       200:
 *         description: Bookmarks retrieved successfully
 */
router.get("/me/bookmarks", getBookmarks);

/**
 * @swagger
 * /users/me/bookmarks/{lessonId}:
 *   delete:
 *     tags: [Users & Profile]
 *     summary: Delete a specific bookmark
 *     security: [{bearerAuth: []}]
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Bookmark deleted successfully
 */
router.delete("/me/bookmarks/:lessonId", deleteBookmark);

/**
 * @swagger
 * /users/me/password:
 *   patch:
 *     tags: [Users & Profile]
 *     summary: Change account password
 *     security: [{bearerAuth: []}]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Current password incorrect
 */
router.patch("/me/password", changePassword);

export default router;

import { Router } from "express";
import {
  getLesson,
  completeLesson,
  saveLessonProgress,
  toggleBookmark,
} from "../controllers/content.controller";
import { authenticate, optionalAuth } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Content - Lessons
 *   description: Lesson viewing, completion, and bookmarks
 */

/**
 * @swagger
 * /lessons/{id}:
 *   get:
 *     tags: [Content - Lessons]
 *     summary: Get lesson details
 *     description: Retrieve full lesson content, metadata, and user progress if authenticated
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Lesson details with user progress
 */
// optionalAuth, not authenticate: signed-out visitors must still be able to
// open a free preview lesson, but a signed-in student needs `req.user` set or
// their own progress can never be attached — without it `watchedSeconds` is
// always 0 and resume silently does nothing.
router.get("/:id", optionalAuth, getLesson);

/**
 * @swagger
 * /lessons/{id}/complete:
 *   post:
 *     tags: [Content - Lessons]
 *     summary: Mark lesson as completed
 *     description: Track lesson completion and award XP
 *     security: [{bearerAuth: []}]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               watchedSecs: { type: number, description: "Seconds watched for video lessons" }
 *     responses:
 *       200:
 *         description: Lesson marked as completed
 */
router.post("/:id/complete", authenticate, completeLesson);

/**
 * @swagger
 * /lessons/{id}/progress:
 *   post:
 *     tags: [Content - Lessons]
 *     summary: Save watch position
 *     description: >
 *       Heartbeat called while a lesson plays, and flushed on pause or unload.
 *       Records position only — never marks the lesson complete.
 *     security: [{bearerAuth: []}]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               watchedSecs: { type: number, description: "Current position in seconds" }
 *     responses:
 *       200: { description: Position saved }
 */
router.post("/:id/progress", authenticate, saveLessonProgress);

/**
 * @swagger
 * /lessons/{id}/bookmark:
 *   post:
 *     tags: [Content - Lessons]
 *     summary: Toggle lesson bookmark
 *     description: Bookmark or remove bookmark from a lesson
 *     security: [{bearerAuth: []}]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Bookmark toggled successfully
 *       201:
 *         description: Lesson bookmarked
 */
router.post("/:id/bookmark", authenticate, toggleBookmark);

export default router;

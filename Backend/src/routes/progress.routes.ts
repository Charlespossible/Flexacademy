import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import {
  getUserProgress,
  getUserSubjectProgress,
  getUserTopicProgress,
  getWeakAreas,
  getExamReadiness,
  getActivityTimeline,
  getHeatmapData,
} from "../controllers/progress.controller";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Progress & Analytics
 *   description: Comprehensive learning analytics - mastery tracking, weak area detection, exam readiness
 */

/**
 * @swagger
 * /progress/me:
 *   get:
 *     tags: [Progress & Analytics]
 *     summary: Overall learning progress dashboard
 *     description: Returns comprehensive dashboard with all stats (courses, XP, streak, mastery, badges).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Progress overview
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       properties:
 *                         avgMastery: { type: integer, description: Average topic mastery 0-100 }
 *                         topicsLearned: { type: integer }
 *                         coursesEnrolled: { type: integer }
 *                         coursesCompleted: { type: integer }
 *                         totalStudyMins: { type: integer }
 *                         totalXp: { type: integer }
 *                         badgesEarned: { type: integer }
 *                         currentStreak: { type: integer, description: Days }
 *                         longestStreak: { type: integer }
 *       401: { description: Not authenticated }
 */
router.get("/me", getUserProgress);

/**
 * @swagger
 * /progress/me/subjects:
 *   get:
 *     tags: [Progress & Analytics]
 *     summary: Per-subject mastery breakdown
 *     description: Returns mastery level for each subject with topic count and completion percentage.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subject mastery data (sorted high to low)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       subjectId: { type: string }
 *                       name: { type: string }
 *                       totalTopics: { type: integer }
 *                       learnedTopics: { type: integer }
 *                       avgMastery: { type: integer }
 *                       completionPercent: { type: integer }
 *       401: { description: Not authenticated }
 */
router.get("/me/subjects", getUserSubjectProgress);

/**
 * @swagger
 * /progress/me/topics:
 *   get:
 *     tags: [Progress & Analytics]
 *     summary: Per-topic progress with accuracy
 *     description: Returns all topics with mastery level, accuracy, correct/total attempts, and difficulty classification (paginated).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subjectId
 *         schema: { type: string, format: uuid, description: Filter by subject }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50, minimum: 1, maximum: 200 }
 *     responses:
 *       200:
 *         description: Topic progress records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       topicId: { type: string }
 *                       topicName: { type: string }
 *                       masteryLevel: { type: integer }
 *                       accuracy: { type: integer, description: Percent 0-100 }
 *                       totalAttempts: { type: integer }
 *                       difficulty: { type: string, enum: [EASY, MEDIUM, HARD] }
 *                       lastReviewedAt: { type: string, format: date-time }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     total: { type: integer }
 *       401: { description: Not authenticated }
 */
router.get("/me/topics", getUserTopicProgress);

/**
 * @swagger
 * /progress/me/weak-areas:
 *   get:
 *     tags: [Progress & Analytics]
 *     summary: Weak areas (mastery < 70%) needing focus
 *     description: Returns bottom N topics sorted by mastery with priority level and recommended study time.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, minimum: 1, maximum: 20 }
 *     responses:
 *       200:
 *         description: Weak topics list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       topicId: { type: string }
 *                       topicName: { type: string }
 *                       masteryLevel: { type: integer }
 *                       accuracy: { type: integer }
 *                       totalAttempts: { type: integer }
 *                       recommendedStudyTime: { type: integer, description: Minutes }
 *                       priority: { type: string, enum: [URGENT, HIGH, MEDIUM] }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     count: { type: integer }
 *                     allTopicsStrength: { type: string }
 *       401: { description: Not authenticated }
 */
router.get("/me/weak-areas", getWeakAreas);

/**
 * @swagger
 * /progress/me/exam-readiness:
 *   get:
 *     tags: [Progress & Analytics]
 *     summary: Estimated exam readiness score
 *     description: AI calculates estimated score based on topic mastery levels with per-subject breakdown and recommendations.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Exam readiness assessment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     estimatedScore: { type: integer, description: 0-100 }
 *                     readinessLevel: { type: string, enum: [NOT_STARTED, NOT_READY, NEEDS_WORK, NEARLY_READY, EXAM_READY] }
 *                     subjects:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           subjectId: { type: string }
 *                           name: { type: string }
 *                           avgScore: { type: integer }
 *                           topicsCount: { type: integer }
 *                     recommendations: { type: array, items: { type: string } }
 *                     estimatedReadyDate: { type: string, format: date-time }
 *       401: { description: Not authenticated }
 */
router.get("/me/exam-readiness", getExamReadiness);

/**
 * @swagger
 * /progress/me/timeline:
 *   get:
 *     tags: [Progress & Analytics]
 *     summary: Study activity timeline (date → minutes)
 *     description: Returns daily study activity for chart visualization. Useful for activity streak and commitment tracking.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema: { type: integer, default: 30, minimum: 1, maximum: 365 }
 *     responses:
 *       200:
 *         description: Timeline with daily study minutes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date: { type: string, format: date }
 *                       minutes: { type: integer }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     daysIncluded: { type: integer }
 *                     totalDaysActive: { type: integer }
 *                     totalMinutes: { type: integer }
 *                     avgMinutesPerDay: { type: integer }
 *       401: { description: Not authenticated }
 */
router.get("/me/timeline", getActivityTimeline);

/**
 * @swagger
 * /progress/me/heatmap:
 *   get:
 *     tags: [Progress & Analytics]
 *     summary: GitHub-style yearly activity heatmap
 *     description: Returns week/day grid with study intensity (0-3) for visualization.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer, description: Defaults to current year }
 *     responses:
 *       200:
 *         description: Heatmap grid data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       week: { type: integer }
 *                       day: { type: integer }
 *                       minutes: { type: integer }
 *                       intensity: { type: integer, enum: [0, 1, 2, 3] }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     year: { type: integer }
 *                     totalActiveDays: { type: integer }
 *                     totalMinutes: { type: integer }
 *                     avgMinutesPerDay: { type: integer }
 *       401: { description: Not authenticated }
 */
router.get("/me/heatmap", getHeatmapData);

export default router;
 /*       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string, format: uuid }
 *         responses:
 *       200: { description: Course progress }
 * router.get("/courses/:courseId", (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));
 */




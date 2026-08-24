import { Router } from "express";
import {
  getSubjects,
  getCourses,
  getCourse,
  getMyEnrolledCourses,
  enrollCourse,
  getCourseReviews,
  reviewCourse,
} from "../controllers/content.controller";
import { authenticate, optionalAuth } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Content - Courses
 *   description: Course discovery, enrollment, and reviews
 */

/**
 * @swagger
 * /subjects:
 *   get:
 *     tags: [Content - Courses]
 *     summary: List all available subjects
 *     description: Get all active subjects with course and topic counts
 *     responses:
 *       200:
 *         description: List of subjects
 */
router.get("/subjects", getSubjects);

/**
 * @swagger
 * /courses:
 *   get:
 *     tags: [Content - Courses]
 *     summary: List all courses with filtering
 *     description: Paginated course listing with filters by subject, difficulty, grade level
 *     parameters:
 *       - in: query
 *         name: subject
 *         schema: { type: string, example: "Mathematics" }
 *       - in: query
 *         name: difficulty
 *         schema: { type: string, enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"] }
 *       - in: query
 *         name: grade
 *         schema: { type: string, example: "SS3" }
 *       - in: query
 *         name: page
 *         schema: { type: string, default: "1" }
 *       - in: query
 *         name: limit
 *         schema: { type: string, default: "20" }
 *     responses:
 *       200:
 *         description: Paginated courses list
 */
router.get("/courses", getCourses);

/**
 * @swagger
 * /courses/{id}:
 *   get:
 *     tags: [Content - Courses]
 *     summary: Get single course with enrollment status
 *     description: Retrieve full course details, lessons, and user enrollment status if authenticated
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Course details with lessons and reviews
 */
/**
 * @swagger
 * /courses/courses/me/enrolled:
 *   get:
 *     tags: [Courses]
 *     summary: Courses the signed-in student is enrolled in, with progress
 *     security: [{bearerAuth: []}]
 *     responses:
 *       200: { description: Enrolled courses }
 */
// Registered before /courses/:id — otherwise "me" is captured as an id.
router.get("/courses/me/enrolled", authenticate, getMyEnrolledCourses);

// optionalAuth, not authenticate: the catalogue must stay browsable when signed
// out, but without req.user the handler cannot look up the caller's enrolment —
// isEnrolled/progress/enrolledAt would be false/0/null for everyone, always.
router.get("/courses/:id", optionalAuth, getCourse);

/**
 * @swagger
 * /courses/{id}/enroll:
 *   post:
 *     tags: [Content - Courses]
 *     summary: Enroll in a course
 *     security: [{bearerAuth: []}]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Enrollment created successfully
 */
router.post("/courses/:id/enroll", authenticate, enrollCourse);

/**
 * @swagger
 * /courses/{id}/reviews:
 *   get:
 *     tags: [Content - Courses]
 *     summary: Get course reviews
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: string, default: "1" }
 *       - in: query
 *         name: limit
 *         schema: { type: string, default: "20" }
 *     responses:
 *       200:
 *         description: Course reviews with average rating
 */
router.get("/courses/:id/reviews", getCourseReviews);

/**
 * @swagger
 * /courses/{id}/reviews:
 *   post:
 *     tags: [Content - Courses]
 *     summary: Submit course review
 *     security: [{bearerAuth: []}]
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
 *             required: [rating]
 *             properties:
 *               rating: { type: number, minimum: 1, maximum: 5 }
 *               comment: { type: string, maxLength: 1000 }
 *     responses:
 *       201:
 *         description: Review submitted
 */
router.post("/courses/:id/reviews", authenticate, reviewCourse);

export default router;

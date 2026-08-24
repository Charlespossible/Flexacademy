import { Router } from "express";
import {
  signUpload,
  listMyCourses,
  getMyCourse,
  createCourse,
  updateCourse,
  submitCourse,
  withdrawCourse,
  deleteCourse,
  createLesson,
  updateLesson,
  reorderLessons,
  deleteLesson,
  getLessonFlashcards,
  generateLessonFlashcards,
  addLessonFlashcard,
  updateLessonFlashcard,
  deleteLessonFlashcard,
  verifyAllLessonFlashcards,
} from "../controllers/authoring.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireRoles } from "../middlewares/auth.middleware";

const router = Router();

// Every authoring route is tutor-only. Admins review through /admin.
router.use(authenticate, requireRoles("TUTOR"));

/**
 * @swagger
 * tags:
 *   name: Authoring
 *   description: Tutor-authored course and lesson content
 */

/**
 * @swagger
 * /authoring/uploads/sign:
 *   post:
 *     tags: [Authoring]
 *     summary: Get a signed Cloudinary upload payload
 *     description: >
 *       Returns short-lived signed params. The browser uploads the file directly
 *       to Cloudinary — video never passes through this API.
 *     security: [{bearerAuth: []}]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resourceType: { type: string, enum: [video, image], default: video }
 *     responses:
 *       200: { description: Signature issued }
 *       503: { description: Cloudinary not configured }
 */
router.post("/uploads/sign", signUpload);

// ── Courses ────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /authoring/courses:
 *   get:
 *     tags: [Authoring]
 *     summary: List my courses (any status)
 *     security: [{bearerAuth: []}]
 *     responses:
 *       200: { description: Courses }
 *   post:
 *     tags: [Authoring]
 *     summary: Create a draft course
 *     security: [{bearerAuth: []}]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subjectId, title]
 *             properties:
 *               subjectId:   { type: string }
 *               title:       { type: string }
 *               description: { type: string }
 *               difficulty:  { type: string, enum: [BEGINNER, INTERMEDIATE, ADVANCED, EXAM_READY] }
 *               gradeLevel:  { type: string }
 *               curriculum:  { type: string }
 *     responses:
 *       201: { description: Draft created }
 */
router.get("/courses", listMyCourses);
router.post("/courses", createCourse);

/**
 * @swagger
 * /authoring/courses/{id}:
 *   get:
 *     tags: [Authoring]
 *     summary: Get one of my courses with its lessons
 *     security: [{bearerAuth: []}]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Course with lessons }
 *       404: { description: Not found }
 *   patch:
 *     tags: [Authoring]
 *     summary: Edit a draft or rejected course
 *     security: [{bearerAuth: []}]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Updated }
 *       409: { description: Locked — under review or published }
 *   delete:
 *     tags: [Authoring]
 *     summary: Delete a draft or rejected course
 *     security: [{bearerAuth: []}]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Deleted }
 *       409: { description: Only drafts or rejected courses can be deleted }
 */
router.get("/courses/:id", getMyCourse);
router.patch("/courses/:id", updateCourse);
router.delete("/courses/:id", deleteCourse);

/**
 * @swagger
 * /authoring/courses/{id}/submit:
 *   post:
 *     tags: [Authoring]
 *     summary: Submit a course for admin review
 *     description: Requires at least one published lesson.
 *     security: [{bearerAuth: []}]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Submitted }
 *       400: { description: No completed lessons }
 */
router.post("/courses/:id/submit", submitCourse);

/**
 * @swagger
 * /authoring/courses/{id}/withdraw:
 *   post:
 *     tags: [Authoring]
 *     summary: Withdraw a course from review so it can be edited
 *     security: [{bearerAuth: []}]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Withdrawn }
 *       409: { description: Not awaiting review }
 */
router.post("/courses/:id/withdraw", withdrawCourse);

// ── Lessons ────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /authoring/courses/{id}/lessons:
 *   post:
 *     tags: [Authoring]
 *     summary: Add a lesson to a course
 *     description: >
 *       For VIDEO lessons, videoPublicId must reference a verified Cloudinary
 *       asset — the duration and URL are read from Cloudinary, not the client.
 *     security: [{bearerAuth: []}]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:         { type: string }
 *               contentType:   { type: string, enum: [VIDEO, TEXT, QUIZ, FLASHCARD, PAST_QUESTION, LIVE_CLASS, DOCUMENT] }
 *               content:       { type: string }
 *               videoPublicId: { type: string }
 *               topicId:       { type: string }
 *               isFree:        { type: boolean }
 *               isPublished:   { type: boolean, default: true }
 *     responses:
 *       201: { description: Lesson added }
 */
router.post("/courses/:id/lessons", createLesson);

/**
 * @swagger
 * /authoring/courses/{id}/lessons/reorder:
 *   patch:
 *     tags: [Authoring]
 *     summary: Persist a new lesson order
 *     security: [{bearerAuth: []}]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lessonIds]
 *             properties:
 *               lessonIds: { type: array, items: { type: string } }
 *     responses:
 *       200: { description: Reordered }
 */
router.patch("/courses/:id/lessons/reorder", reorderLessons);

/**
 * @swagger
 * /authoring/lessons/{lessonId}:
 *   patch:
 *     tags: [Authoring]
 *     summary: Edit a lesson
 *     security: [{bearerAuth: []}]
 *     parameters: [{ in: path, name: lessonId, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     tags: [Authoring]
 *     summary: Delete a lesson
 *     security: [{bearerAuth: []}]
 *     parameters: [{ in: path, name: lessonId, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Deleted }
 */
router.patch("/lessons/:lessonId", updateLesson);
router.delete("/lessons/:lessonId", deleteLesson);

/**
 * @swagger
 * /authoring/lessons/{lessonId}/flashcards:
 *   get:
 *     tags: [Authoring]
 *     summary: Revision cards for a lesson, including unverified drafts
 *     description: >
 *       The tutor view. Students read /flashcards, which hides anything not yet
 *       approved.
 *     security: [{bearerAuth: []}]
 *     responses:
 *       200: { description: Deck and cards }
 *   post:
 *     tags: [Authoring]
 *     summary: Add a card by hand (verified immediately)
 *     security: [{bearerAuth: []}]
 *     responses:
 *       201: { description: Card added }
 */
router.get("/lessons/:lessonId/flashcards", getLessonFlashcards);
router.post("/lessons/:lessonId/flashcards", addLessonFlashcard);

/**
 * @swagger
 * /authoring/lessons/{lessonId}/flashcards/generate:
 *   post:
 *     tags: [Authoring]
 *     summary: Draft cards from the lesson with Claude
 *     description: >
 *       Reads the lesson body and returns drafts saved with isVerified=false.
 *       Nothing generated is ever shown to a student until the tutor approves it.
 *     security: [{bearerAuth: []}]
 *     responses:
 *       201: { description: Drafts created }
 *       422: { description: Lesson has too little text to generate from }
 */
router.post("/lessons/:lessonId/flashcards/generate", generateLessonFlashcards);

/**
 * @swagger
 * /authoring/lessons/{lessonId}/flashcards/verify-all:
 *   post:
 *     tags: [Authoring]
 *     summary: Approve every remaining draft on this lesson
 *     security: [{bearerAuth: []}]
 *     responses:
 *       200: { description: Drafts approved }
 */
router.post("/lessons/:lessonId/flashcards/verify-all", verifyAllLessonFlashcards);

/**
 * @swagger
 * /authoring/flashcards/{cardId}:
 *   patch:
 *     tags: [Authoring]
 *     summary: Edit a card, or approve it by setting isVerified
 *     security: [{bearerAuth: []}]
 *     responses:
 *       200: { description: Card updated }
 *   delete:
 *     tags: [Authoring]
 *     summary: Delete a card and any student progress on it
 *     security: [{bearerAuth: []}]
 *     responses:
 *       200: { description: Card deleted }
 */
router.patch("/flashcards/:cardId", updateLessonFlashcard);
router.delete("/flashcards/:cardId", deleteLessonFlashcard);

export default router;

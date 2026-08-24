import { Router } from "express";
import {
  getQuizzes,
  getQuiz,
  startQuizAttempt,
  submitQuizAttempt,
  getQuizResults,
  getUserQuizAttempts,
} from "../controllers/question.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Quizzes & Practice
 *   description: Quiz management, attempts, and results
 */

router.get("/", getQuizzes);
router.get("/:id", getQuiz);
router.post("/:id/start", authenticate, startQuizAttempt);
router.post("/attempts/:id/submit", authenticate, submitQuizAttempt);
router.get("/attempts/:id/results", authenticate, getQuizResults);
router.get("/me/attempts", authenticate, getUserQuizAttempts);

export default router;

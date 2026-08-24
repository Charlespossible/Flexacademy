import { Router } from "express";
import {
  getQuestions,
  getPastQuestions,
  getQuestionYears,
  reportQuestion,
} from "../controllers/question.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", getQuestions);

/**
 * @swagger
 * /questions/past:
 *   get:
 *     tags: [Questions & Past Papers]
 *     summary: Get past examination questions by exam type and year
 */
router.get("/past", getPastQuestions);

/**
 * @swagger
 * /questions/years:
 *   get:
 *     tags: [Questions & Past Papers]
 *     summary: Get available years for past questions
 */
router.get("/years", getQuestionYears);

/**
 * @swagger
 * /questions/{id}/report:
 *   post:
 *     tags: [Questions & Past Papers]
 *     summary: Report a question as incorrect or problematic
 */
router.post("/:id/report", authenticate, reportQuestion);

export default router;

import { Router } from "express";
import { getSubjects, getSubjectBySlug } from "../controllers/subject.controller";
import { optionalAuth } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Subjects
 *   description: Subject catalogue
 */

/**
 * @swagger
 * /subjects:
 *   get:
 *     tags: [Subjects]
 *     summary: List all active subjects
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: string, default: "100" }
 *     responses:
 *       200:
 *         description: Subjects retrieved successfully
 */
router.get("/", optionalAuth, getSubjects);

/**
 * @swagger
 * /subjects/{slug}:
 *   get:
 *     tags: [Subjects]
 *     summary: Get a subject with its topics and courses
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Subject retrieved successfully
 *       404:
 *         description: Subject not found
 */
router.get("/:slug", optionalAuth, getSubjectBySlug);

export default router;

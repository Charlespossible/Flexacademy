import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../config/database";
import { ApiResponse, ApiError } from "../utils/ApiResponse";
import { logger } from "../utils/logger";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/subjects — List all active subjects
// Optional query: ?search=&limit=
// ─────────────────────────────────────────────────────────────────────────────
export const getSubjects = async (
  req: Request<object, object, object, { search?: string; limit?: string }>,
  res: Response
): Promise<void> => {
  const search = req.query.search?.trim();
  const limit = Math.min(Number(req.query.limit) || 100, 100);

  const subjects = await prisma.subject.findMany({
    where: {
      isActive: true,
      ...(search && {
        name: { contains: search, mode: "insensitive" },
      }),
    },
    include: {
      _count: { select: { topics: true, courses: true } },
    },
    orderBy: { name: "asc" },
    take: limit,
  });

  logger.debug({ count: subjects.length }, "Subjects fetched");

  res.status(StatusCodes.OK).json(
    ApiResponse.success(subjects, "Subjects retrieved successfully")
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/subjects/:slug — Get one subject with its topics
// ─────────────────────────────────────────────────────────────────────────────
export const getSubjectBySlug = async (
  req: Request<{ slug: string }>,
  res: Response
): Promise<void> => {
  const { slug } = req.params;

  const subject = await prisma.subject.findUnique({
    where: { slug },
    include: {
      topics: {
        where: { isActive: true },
        orderBy: { order: "asc" },
      },
      courses: {
        where: { isPublished: true },
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          difficulty: true,
          isFree: true,
          requiredTier: true,
          totalDuration: true,
          totalLessons: true,
        },
        orderBy: { publishedAt: "desc" },
        take: 20,
      },
      _count: { select: { topics: true, courses: true } },
    },
  });

  if (!subject) throw ApiError(StatusCodes.NOT_FOUND, "Subject not found.");

  logger.debug({ slug }, "Subject fetched");

  res.status(StatusCodes.OK).json(
    ApiResponse.success(subject, "Subject retrieved successfully")
  );
};

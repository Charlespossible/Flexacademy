import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ExamCategory, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiResponse";
import { logger } from "../utils/logger";

/**
 * GET /api/v1/progress/me
 * Overall learning progress summary
 */
export const getUserProgress = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

    const [topicMastery, enrollments, studySessions, badges, studentProfile] =
      await Promise.all([
        prisma.topicMastery.findMany({ where: { userId } }),
        prisma.enrollment.findMany({ where: { userId } }),
        prisma.studySession.findMany({ where: { userId } }),
        prisma.userBadge.findMany({ where: { userId } }),
        prisma.studentProfile.findUnique({
          where: { userId },
          select: { studyStreakDays: true, longestStreak: true },
        }),
      ]);

    // Calculate aggregate stats
    const avgMastery =
      topicMastery.length > 0
        ? Math.round(
            topicMastery.reduce((sum, t) => sum + t.masteryLevel, 0) /
              topicMastery.length
          )
        : 0;

    const totalStudyMins = studySessions.reduce(
      (sum, s) => sum + (s.durationMins || 0),
      0
    );
    const totalXp = studySessions.reduce((sum, s) => sum + (s.xpEarned || 0), 0);

    const currentStreak = studentProfile?.studyStreakDays || 0;
    const longestStreak = studentProfile?.longestStreak || 0;

    return res.status(StatusCodes.OK).json({
      success: true,
      data: {
        overview: {
          avgMastery,
          topicsLearned: topicMastery.length,
          coursesEnrolled: enrollments.length,
          coursesCompleted: enrollments.filter((e) => e.completedAt).length,
          totalStudyMins,
          totalXp,
          badgesEarned: badges.length,
          currentStreak,
          longestStreak,
        },
        lastUpdated: new Date(),
      },
    });
  } catch (error) {
    logger.error({ message: "getUserProgress error:", error });
    if (error instanceof Error && "statusCode" in error) {
      return res
        .status((error as any).statusCode)
        .json({ success: false, message: (error as any).message });
    }
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Failed to fetch progress" });
  }
};

/**
 * GET /api/v1/progress/me/subjects
 * Per-subject progress with mastery levels
 */
export const getUserSubjectProgress = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

    const subjects = await prisma.subject.findMany({
      include: {
        topics: {
          include: {
            topicMasteries: {
              where: { userId },
              select: { masteryLevel: true },
            },
          },
        },
      },
    });

    const subjectProgress = subjects.map((subject) => {
      const allTopics = subject.topics;
      const learnedTopics = subject.topics.filter(
        (t: any) => t.topicMasteries.length > 0 && t.topicMasteries[0].masteryLevel > 0
      );

      const avgMastery =
        learnedTopics.length > 0
          ? Math.round(
              learnedTopics.reduce(
                (sum: number, t: any) => sum + (t.topicMasteries[0]?.masteryLevel || 0),
                0
              ) / learnedTopics.length
            )
          : 0;

      return {
        subjectId: subject.id,
        name: subject.name,
        totalTopics: allTopics.length,
        learnedTopics: learnedTopics.length,
        avgMastery,
        completionPercent: Math.round(
          (learnedTopics.length / allTopics.length) * 100 || 0
        ),
      };
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: subjectProgress.sort((a, b) => b.avgMastery - a.avgMastery),
    });
  } catch (error) {
    logger.error({ message: "getUserSubjectProgress error:", error });
    if (error instanceof Error && "statusCode" in error) {
      return res
        .status((error as any).statusCode)
        .json({ success: false, message: (error as any).message });
    }
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Failed to fetch subject progress" });
  }
};

/**
 * GET /api/v1/progress/me/topics?subjectId=<id>
 * Per-topic progress with accuracy and difficulty
 */
export const getUserTopicProgress = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { subjectId } = req.query;
    if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const skip = (page - 1) * limit;

    // Filter by subjectId at the parent level — Prisma does not support `where`
    // inside `include` for singular (many-to-one) relations.
    const where = subjectId
      ? { userId, topic: { subjectId: subjectId as string } }
      : { userId };

    const [topicMastery, total] = await Promise.all([
      prisma.topicMastery.findMany({
        where,
        include: {
          topic: {
            select: {
              id: true,
              name: true,
              subject: { select: { id: true } },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { masteryLevel: "desc" },
      }),
      prisma.topicMastery.count({ where }),
    ]);

    const enriched = topicMastery.map((tm) => ({
      id: tm.id,
      topicId: tm.topicId,
      topicName: tm.topic.name,
      masteryLevel: tm.masteryLevel,
      correctAnswers: tm.correctAnswers,
      totalAttempts: tm.totalAttempts,
      accuracy:
        tm.totalAttempts > 0
          ? Math.round((tm.correctAnswers / tm.totalAttempts) * 100)
          : 0,
      difficulty: tm.masteryLevel < 50 ? "HARD" : tm.masteryLevel < 80 ? "MEDIUM" : "EASY",
      lastAttemptAt: tm.lastAttemptAt,
    }));

    return res.status(StatusCodes.OK).json({
      success: true,
      data: enriched,
      meta: { page, limit, total },
    });
  } catch (error) {
    logger.error({ message: "getUserTopicProgress error:", error });
    if (error instanceof Error && "statusCode" in error) {
      return res
        .status((error as any).statusCode)
        .json({ success: false, message: (error as any).message });
    }
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Failed to fetch topic progress" });
  }
};

/**
 * GET /api/v1/progress/me/weak-areas
 * Bottom 5-10 topics needing improvement
 */
export const getWeakAreas = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

    const limit = Math.min(Number(req.query.limit) || 10, 20);

    const weakTopics = await prisma.topicMastery.findMany({
      where: {
        userId,
        masteryLevel: { lt: 70 }, // Below 70% is weak
      },
      include: {
        topic: { select: { id: true, name: true } },
      },
      orderBy: { masteryLevel: "asc" },
      take: limit,
    });

    const enriched = weakTopics.map((wt) => ({
      topicId: wt.topicId,
      topicName: wt.topic.name,
      masteryLevel: wt.masteryLevel,
      accuracy:
        wt.totalAttempts > 0
          ? Math.round((wt.correctAnswers / wt.totalAttempts) * 100)
          : 0,
      totalAttempts: wt.totalAttempts,
      recommendedStudyTime: Math.ceil(
        ((100 - wt.masteryLevel) / 100) * 60
      ), // minutes
      priority: wt.masteryLevel < 40 ? "URGENT" : wt.masteryLevel < 60 ? "HIGH" : "MEDIUM",
    }));

    return res.status(StatusCodes.OK).json({
      success: true,
      data: enriched,
      meta: {
        count: enriched.length,
        allTopicsStrength:
          enriched.length === 0
            ? "Excellent!"
            : `${enriched.length} areas to focus on`,
      },
    });
  } catch (error) {
    logger.error({ message: "getWeakAreas error:", error });
    if (error instanceof Error && "statusCode" in error) {
      return res
        .status((error as any).statusCode)
        .json({ success: false, message: (error as any).message });
    }
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Failed to fetch weak areas" });
  }
};

/**
 * GET /api/v1/progress/me/exam-readiness?examCategory=WAEC
 * Estimated exam readiness based on topic mastery.
 * When examCategory is provided and the student is eligible (score >= 75 and
 * 0 open gaps), automatically creates a PENDING_REVIEW certification request.
 */
export const getExamReadiness = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

    const examCategory = req.query.examCategory as ExamCategory | undefined;

    const [topicMastery, openGapsCount] = await Promise.all([
      prisma.topicMastery.findMany({
        where: { userId },
        include: {
          topic: {
            include: {
              subject: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.learningGap.count({
        where: { studentId: userId, status: { in: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS"] } },
      }),
    ]);

    if (topicMastery.length === 0) {
      return res.status(StatusCodes.OK).json({
        success: true,
        data: {
          estimatedScore: 0,
          readinessLevel: "NOT_STARTED",
          openGapsCount,
          eligibleForCertification: false,
          timeToReady: "Complete some quizzes first",
          recommendations: ["Start with easy topics", "Build consistency"],
        },
      });
    }

    // Calculate weighted estimated score
    const totalMastery = topicMastery.reduce((sum, t) => sum + t.masteryLevel, 0);
    const estimatedScore = Math.round(totalMastery / topicMastery.length);

    // Determine readiness level
    let readinessLevel: string;
    if (estimatedScore < 40) readinessLevel = "NOT_READY";
    else if (estimatedScore < 60) readinessLevel = "NEEDS_WORK";
    else if (estimatedScore < 80) readinessLevel = "NEARLY_READY";
    else readinessLevel = "EXAM_READY";

    // Per-subject breakdown
    const subjectReadiness: Record<string, { name: string; topicScores: number[] }> = {};
    topicMastery.forEach((tm) => {
      const subj = tm.topic.subject;
      if (!subjectReadiness[subj.id]) {
        subjectReadiness[subj.id] = { name: subj.name, topicScores: [] };
      }
      subjectReadiness[subj.id].topicScores.push(tm.masteryLevel);
    });

    const subjects = Object.entries(subjectReadiness).map(([id, data]) => ({
      subjectId: id,
      name: data.name,
      avgScore: Math.round(
        data.topicScores.reduce((a, b) => a + b, 0) / data.topicScores.length
      ),
      topicsCount: data.topicScores.length,
    }));

    // Recommendations based on performance
    const recommendations: string[] = [];
    const weakCount = topicMastery.filter((t) => t.masteryLevel < 60).length;
    if (weakCount > 0) recommendations.push(`Focus on ${weakCount} weak areas`);
    if (openGapsCount > 0) recommendations.push(`Resolve ${openGapsCount} open learning gap${openGapsCount > 1 ? "s" : ""} flagged by AI`);
    if (estimatedScore >= 80 && openGapsCount === 0) {
      recommendations.push("Ready for exam — maintain momentum");
    } else if (estimatedScore >= 60) {
      recommendations.push("Consolidate weak topics before exam");
    } else {
      recommendations.push("Increase daily study time");
    }

    const CERT_THRESHOLD = 75;
    const eligibleForCertification = estimatedScore >= CERT_THRESHOLD && openGapsCount === 0;

    // Auto-create certification request when eligible and examCategory is known
    let certificationInfo: { id: string; status: string } | null = null;
    if (eligibleForCertification && examCategory) {
      const existing = await prisma.examReadinessCertification.findFirst({
        where: {
          studentId: userId,
          examCategory,
          status: { in: ["PENDING_REVIEW", "CERTIFIED"] },
        },
        select: { id: true, status: true },
      });

      if (existing) {
        certificationInfo = existing;
      } else {
        const cert = await prisma.examReadinessCertification.create({
          data: {
            studentId: userId,
            examCategory,
            aiReadinessScore: estimatedScore,
            subjectBreakdown: subjects as unknown as Prisma.InputJsonValue,
            openGapsCount: 0,
            status: "PENDING_REVIEW",
          },
        });
        certificationInfo = { id: cert.id, status: cert.status };

        await prisma.notification.create({
          data: {
            userId,
            type: "EXAM_READINESS_UPDATED",
            title: "You're Exam-Ready! Certification Pending",
            body: `Your AI readiness score is ${estimatedScore}% with no open learning gaps. A ${examCategory} certification request has been submitted for tutor review.`,
            metadata: { certId: cert.id, examCategory, score: estimatedScore } as unknown as Prisma.InputJsonValue,
          },
        });

        logger.info({ userId, examCategory, certId: cert.id, estimatedScore }, "Auto-created exam readiness certification");
      }
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      data: {
        estimatedScore,
        readinessLevel,
        openGapsCount,
        eligibleForCertification,
        certificationInfo,
        subjects,
        recommendations,
        estimatedReadyDate: new Date(
          Date.now() + (100 - estimatedScore) * 2 * 24 * 60 * 60 * 1000
        ),
      },
    });
  } catch (error) {
    logger.error({ message: "getExamReadiness error:", error });
    if (error instanceof Error && "statusCode" in error) {
      return res
        .status((error as any).statusCode)
        .json({ success: false, message: (error as any).message });
    }
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Failed to calculate exam readiness" });
  }
};

/**
 * GET /api/v1/progress/me/timeline?days=30
 * Activity timeline for heatmap visualization (date → minutes studied)
 */
export const getActivityTimeline = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

    const days = Math.min(Number(req.query.days) || 30, 365);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const studySessions = await prisma.studySession.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      select: { createdAt: true, durationMins: true },
    });

    // Group by date
    const timelineMap = new Map<string, number>();

    studySessions.forEach((session) => {
      const dateKey = session.createdAt.toISOString().split("T")[0];
      const current = timelineMap.get(dateKey) || 0;
      timelineMap.set(dateKey, current + (session.durationMins || 0));
    });

    // Fill in all dates in range
    const timeline: any[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= new Date()) {
      const dateKey = currentDate.toISOString().split("T")[0];
      timeline.push({
        date: dateKey,
        minutes: timelineMap.get(dateKey) || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate stats
    const totalDaysActive = Array.from(timelineMap.values()).filter((m) => m > 0)
      .length;
    const totalMinutes = Array.from(timelineMap.values()).reduce(
      (a, b) => a + b,
      0
    );
    const avgMinutesPerDay = totalDaysActive > 0 ? Math.round(totalMinutes / totalDaysActive) : 0;

    return res.status(StatusCodes.OK).json({
      success: true,
      data: timeline,
      meta: {
        daysIncluded: days,
        totalDaysActive,
        totalMinutes,
        avgMinutesPerDay,
      },
    });
  } catch (error) {
    logger.error({ message: "getActivityTimeline error:", error });
    if (error instanceof Error && "statusCode" in error) {
      return res
        .status((error as any).statusCode)
        .json({ success: false, message: (error as any).message });
    }
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Failed to fetch activity timeline" });
  }
};

/**
 * GET /api/v1/progress/me/heatmap?year=2024
 * Yearly activity heatmap data (ISO weeks format)
 */
export const getHeatmapData = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

    const year = Number(req.query.year) || new Date().getFullYear();
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);

    const studySessions = await prisma.studySession.findMany({
      where: {
        userId,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { createdAt: true, durationMins: true },
    });

    // Group by ISO week and day
    const heatmapData = new Map<string, number>();

    studySessions.forEach((session) => {
      const date = new Date(session.createdAt);
      const weekNumber = Math.ceil(
        (date.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      const dayOfWeek = date.getDay();
      const key = `${weekNumber}-${dayOfWeek}`;
      const current = heatmapData.get(key) || 0;
      heatmapData.set(key, current + (session.durationMins || 0));
    });

    // Build result array
    const heatmap: any[] = [];
    for (let week = 0; week < 53; week++) {
      for (let day = 0; day < 7; day++) {
        const key = `${week}-${day}`;
        const minutes = heatmapData.get(key) || 0;
        heatmap.push({
          week,
          day,
          minutes,
          intensity: minutes === 0 ? 0 : minutes < 30 ? 1 : minutes < 60 ? 2 : 3,
        });
      }
    }

    const totalActiveDays = Array.from(heatmapData.values()).filter(
      (m) => m > 0
    ).length;
    const totalMinutes = Array.from(heatmapData.values()).reduce(
      (a, b) => a + b,
      0
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      data: heatmap,
      meta: {
        year,
        totalActiveDays,
        totalMinutes,
        avgMinutesPerDay: totalActiveDays > 0 ? Math.round(totalMinutes / totalActiveDays) : 0,
      },
    });
  } catch (error) {
    logger.error({ message: "getHeatmapData error:", error });
    if (error instanceof Error && "statusCode" in error) {
      return res
        .status((error as any).statusCode)
        .json({ success: false, message: (error as any).message });
    }
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Failed to fetch heatmap data" });
  }
};

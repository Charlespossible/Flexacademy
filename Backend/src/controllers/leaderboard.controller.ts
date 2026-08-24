import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiResponse";
import { logger } from "../utils/logger";

/**
 * GET /api/v1/leaderboard
 * Returns ranked users for a given period. Falls back to ranking by
 * student profile totalXp when no LeaderboardEntry rows exist yet.
 */
export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

    const period = (req.query.period as string) || "all-time";
    const limit = Math.min(Number(req.query.limit) || 20, 100);

    // Try LeaderboardEntry rows first
    const entries = await prisma.leaderboardEntry.findMany({
      where: { period },
      orderBy: { score: "desc" },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    if (entries.length > 0) {
      const ranked = entries.map((e, i) => ({
        rank: e.rank ?? i + 1,
        userId: e.userId,
        firstName: e.user.firstName,
        lastName: e.user.lastName,
        avatar: e.user.avatar,
        score: e.score,
        isCurrentUser: e.userId === userId,
      }));

      const currentUserEntry = ranked.find((r) => r.isCurrentUser);

      return res.status(StatusCodes.OK).json({
        success: true,
        data: ranked,
        meta: { period, currentUserRank: currentUserEntry?.rank ?? null },
      });
    }

    // Fallback: rank by totalXp from student profiles
    const profiles = await prisma.studentProfile.findMany({
      where: { totalXp: { gt: 0 } },
      orderBy: { totalXp: "desc" },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    const ranked = profiles.map((p, i) => ({
      rank: i + 1,
      userId: p.userId,
      firstName: p.user.firstName,
      lastName: p.user.lastName,
      avatar: p.user.avatar,
      score: p.totalXp,
      isCurrentUser: p.userId === userId,
    }));

    const currentUserRank = ranked.find((r) => r.isCurrentUser)?.rank ?? null;

    // If current user isn't in the top N, append their entry
    if (!currentUserRank) {
      const myProfile = await prisma.studentProfile.findUnique({
        where: { userId },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        },
      });
      if (myProfile) {
        const myRankCount = await prisma.studentProfile.count({
          where: { totalXp: { gt: myProfile.totalXp } },
        });
        ranked.push({
          rank: myRankCount + 1,
          userId: myProfile.userId,
          firstName: myProfile.user.firstName,
          lastName: myProfile.user.lastName,
          avatar: myProfile.user.avatar,
          score: myProfile.totalXp,
          isCurrentUser: true,
        });
      }
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      data: ranked,
      meta: { period, currentUserRank: ranked.find((r) => r.isCurrentUser)?.rank ?? null },
    });
  } catch (error) {
    logger.error({ message: "getLeaderboard error:", error });
    if (error instanceof Error && "statusCode" in error) {
      return res.status((error as any).statusCode).json({ success: false, message: (error as any).message });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to fetch leaderboard" });
  }
};

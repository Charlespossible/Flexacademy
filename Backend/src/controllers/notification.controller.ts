import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiResponse";
import { logger } from "../utils/logger";

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const unreadOnly = req.query.unreadOnly === "true";

    const where = unreadOnly ? { userId, isRead: false } : { userId };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return res.status(StatusCodes.OK).json({
      success: true,
      data: notifications,
      meta: { page, limit, total, unreadCount },
    });
  } catch (error) {
    logger.error({ message: "getNotifications error:", error });
    if (error instanceof Error && "statusCode" in error) {
      return res.status((error as any).statusCode).json({ success: false, message: (error as any).message });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to fetch notifications" });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

    const notification = await prisma.notification.findFirst({ where: { id, userId } });
    if (!notification) throw ApiError(StatusCodes.NOT_FOUND, "Notification not found.");

    await prisma.notification.update({ where: { id }, data: { isRead: true } });

    return res.status(StatusCodes.OK).json({ success: true, message: "Marked as read." });
  } catch (error) {
    logger.error({ message: "markAsRead error:", error });
    if (error instanceof Error && "statusCode" in error) {
      return res.status((error as any).statusCode).json({ success: false, message: (error as any).message });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to mark as read" });
  }
};

export const markAllRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

    await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });

    return res.status(StatusCodes.OK).json({ success: true, message: "All notifications marked as read." });
  } catch (error) {
    logger.error({ message: "markAllRead error:", error });
    if (error instanceof Error && "statusCode" in error) {
      return res.status((error as any).statusCode).json({ success: false, message: (error as any).message });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to mark all as read" });
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

    const notification = await prisma.notification.findFirst({ where: { id, userId } });
    if (!notification) throw ApiError(StatusCodes.NOT_FOUND, "Notification not found.");

    await prisma.notification.delete({ where: { id } });

    return res.status(StatusCodes.OK).json({ success: true, message: "Notification deleted." });
  } catch (error) {
    logger.error({ message: "deleteNotification error:", error });
    if (error instanceof Error && "statusCode" in error) {
      return res.status((error as any).statusCode).json({ success: false, message: (error as any).message });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to delete notification" });
  }
};

import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiResponse";
import { logger } from "../utils/logger";
import { anthropic, FAST_PARAMS, extractText } from "../config/anthropic";

// Valid study plan statuses
type StudyPlanStatusFilter = "ACTIVE" | "COMPLETED" | "ABANDONED";

interface StudyPlanItem {
    topicId: string;
    title: string;
    durationMins: number;
    dueDate: Date;
    priority: "HIGH" | "MEDIUM" | "LOW";
}

interface StudyPlanInput {
    title: string;
    description?: string;
    targetDate: string;
    items: StudyPlanItem[];
}

// Explicit type for TopicMastery with Topic relation included
interface WeakTopic {
    id: string;
    userId: string;
    topicId: string;
    masteryLevel: number;
    topic: {
        id: string;
        name: string;
    };
}

/**
 * Helper: Generate AI study plan from weak areas and target date
 * Uses Claude to create a prioritized schedule
 */
const generateAiStudyPlan = async (
    userId: string,
    targetDate: Date,
    topicLimit: number = 10
): Promise<StudyPlanItem[]> => {
    // Get weak topics (lowest mastery first)
    const weakTopics: WeakTopic[] = await prisma.topicMastery.findMany({
      where: { userId },
      include: { topic: { select: { id: true, name: true } } },
      orderBy: { masteryLevel: "asc" },
      take: topicLimit,
    }) as WeakTopic[];

    if (!weakTopics.length) {
        throw ApiError(
            StatusCodes.BAD_REQUEST,
            "No learning data available. Complete some quizzes first."
        );
    }

    const daysRemaining = Math.max(
        1,
        Math.floor(
            (targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
    );

    // Build Claude prompt
    const prompt = `You are an expert study planner. Generate a personalized study schedule for these weak topics:

${weakTopics.map((t) => `- "${t.topic.name}" (Current mastery: ${t.masteryLevel}%)`).join("\n")}

Requirements:
- Target exam date: ${targetDate.toLocaleDateString()} (${daysRemaining} days from now)
- Allocate study time based on difficulty (lowest mastery gets more time)
- Suggest daily study blocks of 30-90 minutes max
- Prioritize highest learning gap first

Return a JSON array with this exact format (no other text):
[
  {"topicId": "uuid", "topic": "Topic Name", "estimatedMins": number, "daysFromNow": number, "priority": "HIGH|MEDIUM|LOW"}
]

Where:
- daysFromNow: 1 to ${daysRemaining}
- estimatedMins: 30-120
- priority: HIGH for lowest mastery, LOW for highest mastery in the list`;

    const response = await anthropic.messages.create({
        ...FAST_PARAMS,
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
    });

    const responseText = extractText(response) ?? "[]";

    // Parse JSON response
    let parsedSchedule: any[] = [];
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
        parsedSchedule = JSON.parse(jsonMatch[0]);
    }

    // Map Claude response to StudyPlanItem format
    return parsedSchedule.map((item: any, index: number) => {
        const weakTopic = weakTopics.find((t) => t.topic.name === item.topic);
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (item.daysFromNow || index + 1));

        return {
            topicId: weakTopic?.topicId || "",
            title: item.topic,
            durationMins: item.estimatedMins || 60,
            dueDate,
            priority: item.priority || "MEDIUM",
        };
    });
};

/**
 * GET /api/v1/study-plans/me
 * Fetch user's active study plans (paginated)
 */
export const getUserStudyPlans = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Number(req.query.limit) || 20, 100);
        const skip = (page - 1) * limit;
        
        // Validate status query parameter
        const validStatuses: StudyPlanStatusFilter[] = ["ACTIVE", "COMPLETED", "ABANDONED"];
        const statusParam = (req.query.status as string)?.toUpperCase() || "ACTIVE";
        const status = validStatuses.includes(statusParam as StudyPlanStatusFilter)
            ? (statusParam as StudyPlanStatusFilter)
            : "ACTIVE";

        const [plans, total] = await Promise.all([
            prisma.studyPlan.findMany({
                where: { userId, status },
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    items: {
                        select: { id: true, completedAt: true },
                        orderBy: { scheduledFor: "asc" },
                    },
                },
            }),
            prisma.studyPlan.count({ where: { userId, status } }),
        ]);

        const result = plans.map((plan) => ({
            ...plan,
            totalItems: plan.items.length,
            completedItems: plan.items.filter((i) => i.completedAt).length,
            items: undefined,
        }));

        return res.status(StatusCodes.OK).json({
            success: true,
            data: result,
            meta: { page, limit, total },
        });
    } catch (error) {
        logger.error({ error }, "getUserStudyPlans error");
        if (error instanceof Error && "statusCode" in error) {
            return res
                .status((error as any).statusCode)
                .json({ success: false, message: (error as any).message });
        }
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ success: false, message: "Failed to fetch study plans" });
    }
};

/**
 * POST /api/v1/study-plans
 * Create a manual study plan with custom items
 */
export const createStudyPlan = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

        const { title, description, targetDate, items } = req.body as StudyPlanInput;

        if (!title || !targetDate || !items?.length) {
            throw ApiError(
                StatusCodes.BAD_REQUEST,
                "Missing required fields: title, targetDate, items"
            );
        }

        const parsedTargetDate = new Date(targetDate);
        if (parsedTargetDate < new Date()) {
            throw ApiError(StatusCodes.BAD_REQUEST, "Target date must be in future");
        }

        // Validate all topics exist
        const topicIds = items.map((i) => i.topicId);
        const existingTopics = await prisma.topic.findMany({
            where: { id: { in: topicIds } },
        });

        if (existingTopics.length !== topicIds.length) {
            throw ApiError(StatusCodes.BAD_REQUEST, "Invalid topic IDs provided");
        }

        // Create plan with items in transaction
        const plan = await prisma.$transaction(async (tx) => {
            const newPlan = await tx.studyPlan.create({
                data: {
                    userId,
                    title,
                    description,
                    targetDate: parsedTargetDate,
                    status: "ACTIVE",
                },
            });

            // Create plan items
            await tx.studyPlanItem.createMany({
                data: items.map((item) => ({
                    studyPlanId: newPlan.id,
                    topicId: item.topicId,
                    title: item.title,
                    durationMins: item.durationMins,
                    scheduledFor: new Date(item.dueDate),
                    order: items.indexOf(item),
                })),
            });

            return newPlan;
        });

        return res.status(StatusCodes.CREATED).json({
            success: true,
            data: { ...plan, message: "Study plan created" },
        });
    } catch (error) {
        logger.error({ error }, "createStudyPlan error");
        if (error instanceof Error && "statusCode" in error) {
            return res
                .status((error as any).statusCode)
                .json({ success: false, message: (error as any).message });
        }
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ success: false, message: "Failed to create study plan" });
    }
};

/**
 * POST /api/v1/study-plans/generate
 * AI-generate a study plan based on weak areas
 */
export const generateStudyPlan = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

        const { targetDate, title } = req.body;

        if (!targetDate) {
            throw ApiError(StatusCodes.BAD_REQUEST, "targetDate is required");
        }

        const parsedTargetDate = new Date(targetDate);
        if (parsedTargetDate < new Date()) {
            throw ApiError(StatusCodes.BAD_REQUEST, "Target date must be in future");
        }

        // Generate AI schedule
        const aiItems = await generateAiStudyPlan(userId, parsedTargetDate);

        if (!aiItems.length) {
            throw ApiError(
                StatusCodes.BAD_REQUEST,
                "Could not generate study plan"
            );
        }

        // Create plan with AI-generated items
        const plan = await prisma.$transaction(async (tx) => {
            const newPlan = await tx.studyPlan.create({
                data: {
                    userId,
                    title: title || `Study Plan - ${new Date().toLocaleDateString()}`,
                    description: "AI-generated study plan based on your weak areas",
                    targetDate: parsedTargetDate,
                    status: "ACTIVE",
                    isAiGenerated: true,
                },
            });

            // Create items
            await tx.studyPlanItem.createMany({
                data: aiItems.map((item, idx) => ({
                    studyPlanId: newPlan.id,
                    topicId: item.topicId,
                    title: item.title,
                    durationMins: item.durationMins,
                    scheduledFor: item.dueDate,
                    order: idx,
                })),
            });

            return newPlan;
        });

        // Link to active assignment so the tutor can see the plan
        const activeAssignment = await prisma.studentTutorAssignment.findFirst({
            where: { studentId: userId, status: "ACTIVE" },
            select: { id: true },
        });

        if (activeAssignment) {
            await prisma.studyPlan.update({
                where: { id: plan.id },
                data: { assignmentId: activeAssignment.id, isSharedWithTutor: true },
            });
        }

        return res.status(StatusCodes.CREATED).json({
            success: true,
            data: {
                ...plan,
                assignmentId: activeAssignment?.id ?? null,
                isSharedWithTutor: !!activeAssignment,
                itemsCount: aiItems.length,
                message: "AI study plan generated",
            },
        });
    } catch (error) {
        logger.error({ error }, "generateStudyPlan error");
        if (error instanceof Error && "statusCode" in error) {
            return res
                .status((error as any).statusCode)
                .json({ success: false, message: (error as any).message });
        }
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ success: false, message: "Failed to generate study plan" });
    }
};

/**
 * GET /api/v1/study-plans/:id/items
 * Fetch all items for a study plan with progress
 */
export const getStudyPlanItems = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id: planId } = req.params;

        if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

        // Verify ownership
        const plan = await prisma.studyPlan.findFirst({
            where: { id: planId, userId },
        });

        if (!plan) {
            throw ApiError(
                StatusCodes.NOT_FOUND,
                "Study plan not found or unauthorized"
            );
        }

        const items = await prisma.studyPlanItem.findMany({
            where: { studyPlanId: planId },
            include: {
                topic: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    },
                },
            },
            orderBy: { order: "asc" },
        });

        const enriched = items.map((item) => ({
            id: item.id,
            title: item.title,
            topic: item.topic,
            estimatedMins: item.durationMins,
            dueDate: item.scheduledFor,
            completedAt: item.completedAt,
            isCompleted: item.isCompleted,
            isOverdue: !item.completedAt && item.scheduledFor < new Date(),
        }));

        return res.status(StatusCodes.OK).json({
            success: true,
            data: enriched,
        });
    } catch (error) {
        logger.error({ error }, "getStudyPlanItems error");
        if (error instanceof Error && "statusCode" in error) {
            return res
                .status((error as any).statusCode)
                .json({ success: false, message: (error as any).message });
        }
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ success: false, message: "Failed to fetch items" });
    }
};

/**
 * PATCH /api/v1/study-plans/items/:id/complete
 * Mark a study plan item as completed
 */
export const completeStudyPlanItem = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id: itemId } = req.params;

        if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

        // Verify ownership via study plan
        const item = await prisma.studyPlanItem.findUnique({
            where: { id: itemId },
            include: { studyPlan: { select: { userId: true } } },
        });

        if (!item || item.studyPlan.userId !== userId) {
            throw ApiError(StatusCodes.NOT_FOUND, "Item not found or unauthorized");
        }

        if (item.completedAt) {
            throw ApiError(StatusCodes.BAD_REQUEST, "Item already completed");
        }

        // Mark as complete and create study session for XP
        const updated = await prisma.$transaction(async (tx) => {
            // Mark item complete
            const completedItem = await tx.studyPlanItem.update({
                where: { id: itemId },
                data: { completedAt: new Date() },
            });

            // Create study session for XP (30-120 mins → 300-1200 XP)
            await tx.studySession.create({
                data: {
                    userId,
                    topicId: item.topicId,
                    durationMins: Math.min(item.durationMins, 120),
                    xpEarned: Math.min(item.durationMins * 10, 1200),
                    type: "STUDY_PLAN",
                },
            });

            // Update topic mastery (small increase)
            await tx.topicMastery.updateMany({
                where: { userId, topicId: item.topicId ?? undefined },
                data: {
                    masteryLevel: { increment: 2 },
                },
            });

            return completedItem;
        });

        return res.status(StatusCodes.OK).json({
            success: true,
            data: {
                itemId: updated.id,
                completedAt: updated.completedAt,
                message: "Item marked as complete - XP earned",
            },
        });
    } catch (error) {
        logger.error({ error }, "completeStudyPlanItem error");
        if (error instanceof Error && "statusCode" in error) {
            return res
                .status((error as any).statusCode)
                .json({ success: false, message: (error as any).message });
        }

        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ success: false, message: "Failed to complete item" });
    }
};

/**
 * PATCH /api/v1/study-plans/:id
 * Update study plan metadata (title, description, targetDate)
 */
export const updateStudyPlan = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id: planId } = req.params;
        const { title, description, targetDate, status } = req.body;

        if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

        // Verify ownership
        const plan = await prisma.studyPlan.findFirst({
            where: { id: planId, userId },
        });

        if (!plan) {
            throw ApiError(
                StatusCodes.NOT_FOUND,
                "Study plan not found or unauthorized"
            );
        }

        const updateData: any = {};
        if (title) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (targetDate) {
            const parsed = new Date(targetDate);
            if (parsed < new Date()) {
                throw ApiError(StatusCodes.BAD_REQUEST, "Target date must be future");
            }
            updateData.targetDate = parsed;
        }
        if (status && ["ACTIVE", "COMPLETED", "ABANDONED"].includes(status)) {
            updateData.status = status;
        }

        const updated = await prisma.studyPlan.update({
            where: { id: planId },
            data: updateData,
        });

        return res.status(StatusCodes.OK).json({
            success: true,
            data: updated,
        });
    } catch (error) {
        logger.error({ error }, "updateStudyPlan error");
        if (error instanceof Error && "statusCode" in error) {
            return res
                .status((error as any).statusCode)
                .json({ success: false, message: (error as any).message });
        }
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ success: false, message: "Failed to update study plan" });
    }
};

/**
 * DELETE /api/v1/study-plans/:id
 * Delete a study plan (soft delete via status)
 */
export const deleteStudyPlan = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id: planId } = req.params;

        if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

        // Verify ownership
        const plan = await prisma.studyPlan.findFirst({
            where: { id: planId, userId },
        });

        if (!plan) {
            throw ApiError(
                StatusCodes.NOT_FOUND,
                "Study plan not found or unauthorized"
            );
        }

        await prisma.studyPlan.update({
            where: { id: planId },
            data: { status: "ABANDONED" },
        });

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Study plan deleted",
        });
    } catch (error) {
        logger.error({ error }, "deleteStudyPlan error");
        if (error instanceof Error && "statusCode" in error) {
            return res
                .status((error as any).statusCode)
                .json({ success: false, message: (error as any).message });
        }
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ success: false, message: "Failed to delete study plan" });
    }
};

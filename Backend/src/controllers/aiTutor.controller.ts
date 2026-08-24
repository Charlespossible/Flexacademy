import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import Anthropic from "@anthropic-ai/sdk";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { ApiResponse, ApiError } from "../utils/ApiResponse";
import { logger } from "../utils/logger";
import { AiChatBody, ChatMessage, GenerateQuestionsBody } from "../types";
import { runGapDetection, checkAiTutorGapSignal } from "../services/gapDetection.service";
import { anthropic, FAST_PARAMS, extractText } from "../config/anthropic";

const FLEXBOT_SYSTEM_PROMPT = `You are FlexBot, an expert AI tutor for African students preparing for WAEC, JAMB, NECO, IGCSE, and other major exams.

Your personality:
- Encouraging, patient, and supportive — like a brilliant older sibling
- Use relatable Nigerian/African examples when explaining concepts
- Be concise but thorough
- Use Markdown for formatting. Use LaTeX ($$...$$ or $...$) for math equations
- When a student gets something wrong, gently correct and explain step-by-step
- End explanations by asking if they'd like practice questions

Your capabilities:
- Explain any secondary/tertiary school subject
- Generate practice questions on demand
- Walk through exam-style solutions step by step
- Analyze a student's weak areas from their quiz history
- Provide exam tips and study strategies

Always identify the exam type when relevant (WAEC, JAMB, etc.) and tailor advice accordingly.`;

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/ai-tutor/chat — Stream AI tutor chat with SSE
// ─────────────────────────────────────────────────────────────────────────────
export const chat = async (
  req: Request<object, object, AiChatBody>,
  res: Response
): Promise<void> => {
  const { sessionId, message, subject, topic } = req.body;
  const userId = req.user?.id;

  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");
  if (!message?.trim()) {
    throw ApiError(StatusCodes.BAD_REQUEST, "Message cannot be empty.");
  }

  try {
    // Check subscription tier
    const subscription = await prisma.subscription.findUnique({ where: { userId } });
    const aiEnabled =
      ["PRO", "ELITE", "BASIC"].includes(subscription?.tier ?? "") ||
      process.env.ENABLE_AI_TUTOR === "true";

    if (!aiEnabled) {
      throw ApiError(
        StatusCodes.FORBIDDEN,
        "AI Tutor requires a Basic plan or higher."
      );
    }

    // Fetch or create session
    let session = sessionId
      ? await prisma.aiTutorSession.findFirst({ where: { id: sessionId, userId } })
      : null;

    if (sessionId && !session) {
      throw ApiError(StatusCodes.NOT_FOUND, "AI session not found.");
    }

    if (!session) {
      session = await prisma.aiTutorSession.create({
        data: {
          userId,
          subject: subject ?? null,
          topic: topic ?? null,
          messages: [],
          tokensUsed: 0,
        },
      });
    }

  const history = (session.messages as unknown as ChatMessage[]) ?? [];

    const messages = [
      ...history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ];

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.flushHeaders();

    let fullResponse = "";
    let totalTokens = 0;

    const stream = anthropic.messages.stream({
      ...FAST_PARAMS,
      max_tokens: 1500,
      system: FLEXBOT_SYSTEM_PROMPT,
      messages: messages as Anthropic.MessageParam[],
    });

    for await (const chunk of stream) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta.type === "text_delta"
      ) {
        fullResponse += chunk.delta.text;
        res.write(
          `data: ${JSON.stringify({ type: "text", content: chunk.delta.text })}\n\n`
        );
      }
    }

    const finalMessage = await stream.finalMessage();
    totalTokens =
      finalMessage.usage.input_tokens + finalMessage.usage.output_tokens;

    const updatedHistory: ChatMessage[] = [
      ...history,
      { role: "user" as const, content: message, timestamp: new Date().toISOString() },
      {
        role: "assistant" as const,
        content: fullResponse,
        timestamp: new Date().toISOString(),
      },
    ].slice(-20); // Keep last 20 messages

    // Convert typed array to plain objects for Prisma Json field
    const plainMessages = updatedHistory.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
    }));

    await prisma.aiTutorSession.update({
      where: { id: session.id },
      data: {
        messages: plainMessages as unknown as Prisma.InputJsonValue,
        tokensUsed: { increment: totalTokens },
      },
    });

    // Fire-and-forget: if a student keeps asking FlexBot about the same topic,
    // that repetition is itself a gap signal — check and trigger detection if needed.
    const topicToCheck = topic ?? session.topic;
    if (topicToCheck && !session.insightTriggered) {
      checkAiTutorGapSignal(userId, topicToCheck, session.id).catch((err) =>
        logger.warn({ err, userId }, "AI Tutor gap signal check failed")
      );
    }

    res.write(
      `data: ${JSON.stringify({ type: "done", sessionId: session.id, tokensUsed: totalTokens })}\n\n`
    );
    res.end();
  } catch (error) {
    logger.error({ error }, "AI Tutor stream error");
    res.write(
      `data: ${JSON.stringify({ type: "error", message: "AI service error" })}\n\n`
    );
    res.end();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/ai-tutor/generate-questions — Generate AI practice questions
// ─────────────────────────────────────────────────────────────────────────────
export const generatePracticeQuestions = async (
  req: Request<object, object, GenerateQuestionsBody>,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const { subject, topic, examCategory, difficulty, count = 5 } = req.body;

  if (!subject || !topic) {
    throw ApiError(StatusCodes.BAD_REQUEST, "Subject and topic are required.");
  }

  const questionCount = Math.min(count, 20);

  try {
    const prompt = `Generate ${questionCount} ${difficulty ?? "INTERMEDIATE"} level ${examCategory ?? "exam"} practice questions for "${topic}" in ${subject}.

Return ONLY valid JSON array (no markdown):
[
  {
    "body": "Question text",
    "options": [
      {"id": "A", "text": "Option A", "isCorrect": false},
      {"id": "B", "text": "Option B", "isCorrect": true},
      {"id": "C", "text": "Option C", "isCorrect": false},
      {"id": "D", "text": "Option D", "isCorrect": false}
    ],
    "explanation": "Explanation",
    "difficulty": "${difficulty ?? "INTERMEDIATE"}"
  }
]`;

    const response = await anthropic.messages.create({
      ...FAST_PARAMS,
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = extractText(response);
    if (text === null) {
      throw ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Invalid AI response.");
    }

    const raw = text.replace(/```json|```/g, "").trim();
    const jsonMatch = raw.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      throw ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to parse generated questions."
      );
    }

    const questions = JSON.parse(jsonMatch[0]);

    res.status(StatusCodes.CREATED).json(
      ApiResponse.success(
        { questions },
        `${questions.length} practice questions generated`
      )
    );
  } catch (error) {
    logger.error({ error, subject, topic }, "Question generation error");
    throw ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to generate questions.");
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/ai-tutor/analyze — Analyze student performance
// ─────────────────────────────────────────────────────────────────────────────
export const analyzePerformance = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  try {
    // Fetch user's recent quiz/exam attempts
    const [quizAttempts, examSimulations, topicMastery] = await Promise.all([
      prisma.quizAttempt.findMany({
        where: { userId },
        orderBy: { completedAt: "desc" },
        take: 10,
        include: { quiz: { select: { title: true, examCategory: true } } },
      }),
      prisma.examSimulation.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.topicMastery.findMany({
        where: { userId },
        orderBy: { masteryLevel: "asc" },
        take: 10,
      }),
    ]);

    // Prepare analysis data
    const analysisData: { 
      quizStats: { totalAttempts: number; averageScore: number }; 
      examStats: { totalSimulations: number; averageScore: number }; 
      weakAreas: unknown[]; 
      strongAreas: unknown[];
      insight?: string;
    } = {
      quizStats: {
        totalAttempts: quizAttempts.length,
        averageScore:
          quizAttempts.length > 0
            ? Math.round(
                quizAttempts.reduce((sum, q) => sum + Number(q.percentage), 0) /
                  quizAttempts.length
              )
            : 0,
      },
      examStats: {
        totalSimulations: examSimulations.length,
        averageScore:
          examSimulations.length > 0
            ? Math.round(
                examSimulations.reduce(
                  (sum, e) => sum + (e.percentage ? Number(e.percentage) : 0),
                  0
                ) / examSimulations.length
              )
            : 0,
      },
      weakAreas: topicMastery.slice(0, 5),
      strongAreas: topicMastery.slice(-5),
    };

    // Generate AI insight
    if (analysisData.weakAreas.length > 0) {
      const weakAreaNames = analysisData.weakAreas
        .map((t: unknown) => {
          const topic = t as { topicId: string; masteryLevel: number };
          return `Topic ${topic.topicId}: ${topic.masteryLevel}%`;
        })
        .join(", ");

      const insightPrompt = `Based on this student's performance data, provide one brief actionable insight:
- Average quiz score: ${analysisData.quizStats.averageScore}%
- Average exam simulation score: ${analysisData.examStats.averageScore}%
- Weakest topics: ${weakAreaNames}

Give 1-2 sentences of advice for improvement.`;

      const insight = await anthropic.messages.create({
        ...FAST_PARAMS,
        max_tokens: 200,
        messages: [{ role: "user", content: insightPrompt }],
      });

      const insightText = extractText(insight);
      if (insightText !== null) {
        analysisData.insight = insightText;
      }

      // Persist gaps and generate tutor briefs in the background
      runGapDetection(userId).catch((err) =>
        logger.warn({ err, userId }, "analyzePerformance: background gap detection failed")
      );
    }

    logger.debug({ userId }, "Performance analysis completed");

    res.status(StatusCodes.OK).json(
      ApiResponse.success(analysisData, "Performance analysis retrieved successfully")
    );
  } catch (error) {
    logger.error({ userId: req.user?.id, error }, "Performance analysis error");
    throw ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to analyze performance.");
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/ai-tutor/sessions — Fetch AI tutor session history
// ─────────────────────────────────────────────────────────────────────────────
export const getSessions = async (
  req: Request<object, object, object, { page?: string; limit?: string }>,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const [rows, total] = await Promise.all([
    prisma.aiTutorSession.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        subject: true,
        topic: true,
        createdAt: true,
        updatedAt: true,
        tokensUsed: true,
        messages: true,
      },
    }),
    prisma.aiTutorSession.count({ where: { userId } }),
  ]);

  // Derive a title from the first user message so the sidebar has something
  // readable. The raw messages are stripped here — fetch one session by id to
  // get the full transcript.
  const sessions = rows.map(({ messages, ...rest }) => {
    const history = (messages as unknown as ChatMessage[]) ?? [];
    const firstUser = history.find((m) => m.role === "user");
    const preview = firstUser?.content.replace(/\s+/g, " ").trim() ?? "";
    return {
      ...rest,
      messageCount: history.length,
      preview: preview.length > 80 ? `${preview.slice(0, 80)}…` : preview,
    };
  });

  logger.debug({ userId, count: sessions.length }, "AI sessions fetched");

  res
    .status(StatusCodes.OK)
    .json(ApiResponse.paginated(sessions, { total, page, limit }));
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/ai-tutor/sessions/:id — full transcript for one session
// ─────────────────────────────────────────────────────────────────────────────
export const getSession = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  // Scoped by userId as well as id — a valid session id belonging to another
  // student must not be readable.
  const session = await prisma.aiTutorSession.findFirst({
    where: { id: req.params.id, userId },
    select: {
      id: true,
      subject: true,
      topic: true,
      createdAt: true,
      updatedAt: true,
      tokensUsed: true,
      messages: true,
    },
  });

  if (!session) throw ApiError(StatusCodes.NOT_FOUND, "AI session not found.");

  const messages = (session.messages as unknown as ChatMessage[]) ?? [];

  res.status(StatusCodes.OK).json(
    ApiResponse.success({ ...session, messages }, "Session retrieved")
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/v1/ai-tutor/sessions/:id — remove a conversation
// ─────────────────────────────────────────────────────────────────────────────
export const deleteSession = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated.");

  const { count } = await prisma.aiTutorSession.deleteMany({
    where: { id: req.params.id, userId },
  });

  if (count === 0) throw ApiError(StatusCodes.NOT_FOUND, "AI session not found.");

  logger.debug({ userId, sessionId: req.params.id }, "AI session deleted");

  res.status(StatusCodes.OK).json(ApiResponse.success(null, "Session deleted"));
};

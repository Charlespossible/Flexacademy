import Anthropic from "@anthropic-ai/sdk";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../config/database";
import { ApiResponse, ApiError } from "../utils/ApiResponse";
import { logger } from "../utils/logger";
import {
  AiChatBody,
  ChatMessage,
  GenerateQuestionsBody,
  GeneratedQuestion,
  PaginationQuery,
} from "../types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

// ─── Chat (Streaming SSE) ─────────────────────
export const chat = async (
  req: Request<object, object, AiChatBody>,
  res: Response
): Promise<void> => {
  const { sessionId, message, subject, topic } = req.body;
  const userId = req.user!.id;

  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  const aiEnabled =
    ["PRO", "ELITE", "BASIC"].includes(subscription?.tier ?? "") ||
    process.env.ENABLE_AI_TUTOR === "true";

  if (!aiEnabled) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "AI Tutor requires a Basic plan or higher. Upgrade to unlock FlexBot!"
    );
  }

  let session = sessionId
    ? await prisma.aiTutorSession.findFirst({ where: { id: sessionId, userId } })
    : null;

  if (sessionId && !session) {
    throw new ApiError(StatusCodes.NOT_FOUND, "AI session not found.");
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

  const history = (session.messages as ChatMessage[]) ?? [];

  const messages: Anthropic.MessageParam[] = [
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
  res.flushHeaders();

  let fullResponse = "";
  let totalTokens = 0;

  try {
    const stream = anthropic.messages.stream({
      model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      system: FLEXBOT_SYSTEM_PROMPT,
      messages,
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
      { role: "user", content: message, timestamp: new Date().toISOString() },
      {
        role: "assistant",
        content: fullResponse,
        timestamp: new Date().toISOString(),
      },
    ].slice(-20); // Keep last 20 messages

    await prisma.aiTutorSession.update({
      where: { id: session.id },
      data: {
        messages: updatedHistory,
        tokensUsed: { increment: totalTokens },
      },
    });

    res.write(
      `data: ${JSON.stringify({ type: "done", sessionId: session.id, tokensUsed: totalTokens })}\n\n`
    );
    res.end();
  } catch (error) {
    logger.error({ error }, "AI Tutor stream error");
    res.write(
      `data: ${JSON.stringify({ type: "error", message: "AI service unavailable" })}\n\n`
    );
    res.end();
  }
};

// ─── Generate Practice Questions ──────────────
export const generatePracticeQuestions = async (
  req: Request<object, object, GenerateQuestionsBody>,
  res: Response
): Promise<void> => {
  const { subject, topic, examCategory, difficulty, count = 5 } = req.body;

  const prompt = `Generate ${count} ${difficulty ?? "INTERMEDIATE"} level ${examCategory ?? "exam"} practice questions for the topic: "${topic}" in ${subject}.

Return ONLY a valid JSON array with this exact structure:
[
  {
    "body": "Question text here",
    "options": [
      {"id": "A", "text": "Option text", "isCorrect": false},
      {"id": "B", "text": "Option text", "isCorrect": true},
      {"id": "C", "text": "Option text", "isCorrect": false},
      {"id": "D", "text": "Option text", "isCorrect": false}
    ],
    "explanation": "Detailed explanation of the correct answer",
    "difficulty": "${difficulty ?? "INTERMEDIATE"}"
  }
]

Ensure questions are exam-style, accurate, and well-explained. Return JSON only — no markdown fences.`;

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-20241022",
    max_tokens: 3000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Unexpected AI response format.");
  }

  const raw = content.text.replace(/```json|```/g, "").trim();
  const jsonMatch = raw.match(/\[[\s\S]*\]/);

  if (!jsonMatch) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to parse AI-generated questions."
    );
  }

  const questions = JSON.parse(jsonMatch[0]) as GeneratedQuestion[];

  res
    .status(StatusCodes.OK)
    .json(
      ApiResponse.success(
        { questions },
        `${questions.length} practice questions generated`
      )
    );
};

// ─── AI Performance Analysis ──────────────────
export const analyzePerformance = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user!.id;

  const attempts = await prisma.quizAttempt.findMany({
    where: { userId },
    include: {
      quiz: { select: { title: true, examCategory: true } },
      answers: {
        include: {
          question: { select: { topicId: true, difficulty: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (attempts.length === 0) {
    res
      .status(StatusCodes.OK)
      .json(
        ApiResponse.success(
          { analysis: null },
          "No attempts found. Take some quizzes first!"
        )
      );
    return;
  }

  const summary = attempts.map((a) => ({
    quiz: a.quiz.title,
    score: `${a.percentage}%`,
    passed: a.isPassed,
    date: a.createdAt,
    wrongAnswers: a.answers.filter((ans) => !ans.isCorrect).length,
    totalQuestions: a.answers.length,
  }));

  const prompt = `You are an academic performance analyst. Analyze this student's quiz performance data and provide a structured, encouraging analysis.

Performance Data:
${JSON.stringify(summary, null, 2)}

Provide:
1. Overall performance summary (2-3 sentences)
2. Key strengths identified
3. Top 3 areas needing improvement
4. Specific study recommendations
5. A motivational closing message

Use Markdown formatting. Be specific and actionable.`;

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-20241022",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  const analysis =
    response.content[0].type === "text" ? response.content[0].text : "";

  await prisma.quizAttempt.update({
    where: { id: attempts[0].id },
    data: { aiAnalysis: analysis },
  });

  res
    .status(StatusCodes.OK)
    .json(
      ApiResponse.success(
        { analysis, attemptsAnalyzed: attempts.length },
        "Analysis complete"
      )
    );
};

// ─── List AI Sessions ─────────────────────────
export const getSessions = async (
  req: Request<object, object, object, PaginationQuery>,
  res: Response
): Promise<void> => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 10);
  const skip = (page - 1) * limit;

  const [sessions, total] = await Promise.all([
    prisma.aiTutorSession.findMany({
      where: { userId: req.user!.id },
      select: {
        id: true,
        subject: true,
        topic: true,
        tokensUsed: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.aiTutorSession.count({ where: { userId: req.user!.id } }),
  ]);

  res
    .status(StatusCodes.OK)
    .json(ApiResponse.paginated(sessions, { total, page, limit }));
};

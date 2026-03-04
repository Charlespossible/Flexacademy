import Anthropic from "@anthropic-ai/sdk";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../config/database.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are FlexBot, an expert AI tutor for African students preparing for WAEC, JAMB, NECO, IGCSE, and other major exams.

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
- Walk through exam-style solutions
- Analyze a student's weak areas from their quiz history
- Provide exam tips and study strategies

Always identify the exam type when relevant (WAEC, JAMB, etc.) and tailor advice accordingly.`;

// ─── Start or continue a tutor session ────────
export const chat = async (req, res) => {
  const { sessionId, message, subject, topic } = req.body;
  const userId = req.user.id;

  // Check AI access based on subscription
  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  const aiEnabled = ["PRO", "ELITE", "BASIC"].includes(subscription?.tier) ||
    process.env.ENABLE_AI_TUTOR === "true";

  if (!aiEnabled) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "AI Tutor requires a Basic plan or higher. Upgrade to unlock FlexBot!"
    );
  }

  // Load or create session
  let session;
  if (sessionId) {
    session = await prisma.aiTutorSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new ApiError(StatusCodes.NOT_FOUND, "Session not found.");
  } else {
    session = await prisma.aiTutorSession.create({
      data: {
        userId,
        subject: subject || null,
        topic: topic || null,
        messages: [],
        tokensUsed: 0,
      },
    });
  }

  const history = session.messages || [];

  // Build messages array for Claude
  const messages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ];

  // Stream response from Claude
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let fullResponse = "";
  let totalTokens = 0;

  try {
    const stream = await anthropic.messages.stream({
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages,
    });

    for await (const chunk of stream) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta.type === "text_delta"
      ) {
        const text = chunk.delta.text;
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ type: "text", content: text })}\n\n`);
      }
    }

    const finalMessage = await stream.finalMessage();
    totalTokens = finalMessage.usage.input_tokens + finalMessage.usage.output_tokens;

    // Persist updated conversation
    const updatedHistory = [
      ...history,
      { role: "user", content: message, timestamp: new Date().toISOString() },
      { role: "assistant", content: fullResponse, timestamp: new Date().toISOString() },
    ];

    // Keep last 20 messages to manage context window
    const trimmedHistory = updatedHistory.slice(-20);

    await prisma.aiTutorSession.update({
      where: { id: session.id },
      data: {
        messages: trimmedHistory,
        tokensUsed: { increment: totalTokens },
        updatedAt: new Date(),
      },
    });

    res.write(
      `data: ${JSON.stringify({ type: "done", sessionId: session.id, tokensUsed: totalTokens })}\n\n`
    );
    res.end();
  } catch (error) {
    logger.error({ error }, "AI Tutor stream error");
    res.write(`data: ${JSON.stringify({ type: "error", message: "AI service error" })}\n\n`);
    res.end();
  }
};

// ─── Generate practice questions via AI ───────
export const generatePracticeQuestions = async (req, res) => {
  const { subject, topic, examCategory, difficulty, count = 5 } = req.body;

  const prompt = `Generate ${count} ${difficulty || "INTERMEDIATE"} level ${examCategory || "exam"} practice questions for the topic: "${topic}" in ${subject}.

Return ONLY a JSON array with this exact structure:
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
    "difficulty": "${difficulty || "INTERMEDIATE"}"
  }
]

Ensure questions are exam-style, accurate, and well-explained.`;

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
    max_tokens: 3000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0].text;

  // Parse JSON from response
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to parse AI response.");

  const questions = JSON.parse(jsonMatch[0]);

  return res.status(StatusCodes.OK).json(
    ApiResponse.success({ questions }, `${questions.length} practice questions generated`)
  );
};

// ─── AI Performance Analysis ──────────────────
export const analyzePerformance = async (req, res) => {
  const userId = req.user.id;

  // Fetch last 10 quiz attempts with full data
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId },
    include: {
      quiz: { select: { title: true, examCategory: true } },
      answers: {
        include: { question: { select: { topicId: true, difficulty: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (attempts.length === 0) {
    return res.status(StatusCodes.OK).json(
      ApiResponse.success({ analysis: null }, "No attempts found. Take some quizzes first!")
    );
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
5. A motivational message

Use Markdown formatting. Be specific and actionable.`;

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL,
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  const analysis = response.content[0].text;

  // Update last attempt's AI analysis
  await prisma.quizAttempt.update({
    where: { id: attempts[0].id },
    data: { aiAnalysis: analysis },
  });

  return res.status(StatusCodes.OK).json(
    ApiResponse.success({ analysis, attemptsAnalyzed: attempts.length }, "Analysis complete")
  );
};

// ─── Get AI session history ───────────────────
export const getSessions = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [sessions, total] = await Promise.all([
    prisma.aiTutorSession.findMany({
      where: { userId: req.user.id },
      select: {
        id: true,
        subject: true,
        topic: true,
        tokensUsed: true,
        createdAt: true,
        updatedAt: true,
        messages: false, // Don't return full message history in list
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: Number(limit),
    }),
    prisma.aiTutorSession.count({ where: { userId: req.user.id } }),
  ]);

  return res.status(StatusCodes.OK).json(
    ApiResponse.paginated(sessions, { total, page: Number(page), limit: Number(limit) })
  );
};

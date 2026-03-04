import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import passport from "passport";
import swaggerUi from "swagger-ui-express";

import { morganStream } from "./utils/logger.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFound } from "./middlewares/notFound.js";
import { globalRateLimiter } from "./middlewares/rateLimiter.js";
import { configurePassport } from "./config/passport.js";
import { swaggerSpec } from "./config/swagger.js";

// Route imports
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import subjectRoutes from "./routes/subject.routes.js";
import courseRoutes from "./routes/course.routes.js";
import lessonRoutes from "./routes/lesson.routes.js";
import quizRoutes from "./routes/quiz.routes.js";
import questionRoutes from "./routes/question.routes.js";
import progressRoutes from "./routes/progress.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import leaderboardRoutes from "./routes/leaderboard.routes.js";
import aiTutorRoutes from "./routes/aiTutor.routes.js";
import liveClassRoutes from "./routes/liveClass.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";

const app = express();

// ─── Security & Performance Middleware ────────
app.use(helmet());
app.use(compression());

// Webhooks need raw body — must be BEFORE express.json()
app.use("/api/v1/webhooks", express.raw({ type: "application/json" }), webhookRoutes);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── CORS ─────────────────────────────────────
app.use(
  cors({
    origin: [process.env.CLIENT_URL, "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Logging ──────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("combined", { stream: morganStream }));
}

// ─── Passport (Auth strategies) ───────────────
configurePassport(passport);
app.use(passport.initialize());

// ─── Rate Limiting ────────────────────────────
app.use("/api/", globalRateLimiter);

// ─── Health Check ─────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "FlexAcademy API",
    version: process.env.API_VERSION || "v1",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─── Swagger Docs ─────────────────────────────
app.use(
  "/api/v1/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "FlexAcademy API Docs",
    customCss: ".swagger-ui .topbar { background-color: #1a1a2e; }",
  })
);

// ─── API Routes ───────────────────────────────
const API = "/api/v1";
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/users`, userRoutes);
app.use(`${API}/subjects`, subjectRoutes);
app.use(`${API}/courses`, courseRoutes);
app.use(`${API}/lessons`, lessonRoutes);
app.use(`${API}/quizzes`, quizRoutes);
app.use(`${API}/questions`, questionRoutes);
app.use(`${API}/progress`, progressRoutes);
app.use(`${API}/subscriptions`, subscriptionRoutes);
app.use(`${API}/leaderboard`, leaderboardRoutes);
app.use(`${API}/ai-tutor`, aiTutorRoutes);
app.use(`${API}/live-classes`, liveClassRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/admin`, adminRoutes);

// ─── Error Handling ───────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;

import "express-async-errors";
import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import passport from "passport";
import swaggerUi from "swagger-ui-express";

import { morganStream } from "./utils/logger";
import { errorHandler } from "./middlewares/errorHandler";
//import { notFound } from "./middlewares/notFound";
import { globalRateLimiter } from "./middlewares/rateLimiter";
import { configurePassport } from "./config/passport";
import { swaggerSpec } from "./config/swagger";

// ─── Existing Routes ──────────────────────────────
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import subjectRoutes from "./routes/subject.routes";
import courseRoutes from "./routes/course.routes";
import lessonRoutes from "./routes/lesson.routes";
import quizRoutes from "./routes/quiz.routes";
import questionRoutes from "./routes/question.routes";
import progressRoutes from "./routes/progress.routes";
import subscriptionRoutes from "./routes/subscription.routes";
import leaderboardRoutes from "./routes/leaderboard.routes";
import aiTutorRoutes from "./routes/aiTutor.routes";
import authoringRoutes from "./routes/authoring.routes";
import liveClassRoutes from "./routes/liveClass.routes";
import notificationRoutes from "./routes/notification.routes";
import adminRoutes from "./routes/admin.routes";
import webhookRoutes from "./routes/webhook.routes";
import paymentRoutes from "./routes/payment.routes";
import { handleWebhook } from "./controllers/payment.controller";

// ─── New Routes ───────────────────────────────────
import examSimulationRoutes from "./routes/examSimulation.routes";
import studyPlanRoutes from "./routes/studyPlan.routes";
import flashcardRoutes from "./routes/flashcard.routes";
import tutorRoutes from "./routes/tutor.routes";
import bookingRoutes from "./routes/booking.routes";
import parentRoutes from "./routes/parent.routes";
import schoolRoutes from "./routes/school.routes";
import searchRoutes from "./routes/search.routes";
import certificateRoutes from "./routes/certificate.routes";
import referralRoutes from "./routes/referral.routes";

// ─── AI-Tutor Pipeline Routes ─────────────────────
import assignmentRoutes from "./routes/assignment.routes";
import gapsRoutes from "./routes/gaps.routes";
import insightsRoutes from "./routes/insights.routes";
import certificationRoutes from "./routes/certification.routes";

const app: Application = express();

// ─── Security & Performance ───────────────────────
app.use(helmet());
app.use(compression());

// Webhooks need raw body BEFORE express.json()
app.use(
  "/api/v1/webhooks",
  express.raw({ type: "application/json" }),
  webhookRoutes
);

// Nomba payment webhook — raw body (Nomba sends JSON but we need the raw buffer for HMAC)
app.post(
  "/api/v1/payments/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── CORS ─────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL ?? "http://localhost:3000",
  "http://localhost:3000",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Logging ──────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("combined", { stream: morganStream }));
}

// ─── Passport ─────────────────────────────────────
configurePassport(passport);
app.use(passport.initialize());

// ─── Rate Limiting ────────────────────────────────
app.use("/api/", globalRateLimiter);

// ─── Health Check ─────────────────────────────────
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "OK",
    service: "FlexAcademy API",
    version: process.env.API_VERSION ?? "v1",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    endpoints: {
      docs: "/api/v1/docs",
      auth: "/api/v1/auth",
      ai: "/api/v1/ai-tutor",
      search: "/api/v1/search",
    },
  });
});

// ─── Swagger Docs ─────────────────────────────────
app.use(
  "/api/v1/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "FlexAcademy API Docs",
    customCss: `
      .swagger-ui .topbar { background-color: #0c0e14; }
      .swagger-ui .topbar-wrapper img { display: none; }
      .swagger-ui .topbar-wrapper::before { content: "🎓 FlexAcademy API"; color: #6ee7b7; font-size: 20px; font-weight: 700; }
      .swagger-ui .info .title { color: #6ee7b7; }
    `,
    swaggerOptions: {
      docExpansion: "none",
      filter: true,
      tagsSorter: "alpha",
    },
  })
);

// ─── API Routes ───────────────────────────────────
const API = "/api/v1";

// Core
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/users`, userRoutes);
app.use(`${API}/search`, searchRoutes);

// Content
app.use(`${API}/subjects`, subjectRoutes);
app.use(`${API}/courses`, courseRoutes);
app.use(`${API}/lessons`, lessonRoutes);
app.use(`${API}/questions`, questionRoutes);

// Learning
app.use(`${API}/quizzes`, quizRoutes);
app.use(`${API}/exams/simulate`, examSimulationRoutes);
app.use(`${API}/study-plans`, studyPlanRoutes);
app.use(`${API}/flashcards`, flashcardRoutes);
app.use(`${API}/progress`, progressRoutes);
app.use(`${API}/ai-tutor`, aiTutorRoutes);
app.use(`${API}/authoring`, authoringRoutes);

// Marketplace
app.use(`${API}/tutors`, tutorRoutes);
app.use(`${API}/bookings`, bookingRoutes);
app.use(`${API}/live-classes`, liveClassRoutes);

// Platform
app.use(`${API}/subscriptions`, subscriptionRoutes);
app.use(`${API}/leaderboard`, leaderboardRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/parent`, parentRoutes);
app.use(`${API}/schools`, schoolRoutes);
app.use(`${API}/certificates`, certificateRoutes);
app.use(`${API}/referrals`, referralRoutes);

// AI-Tutor Pipeline
app.use(`${API}/assignments`, assignmentRoutes);
app.use(`${API}/gaps`, gapsRoutes);
app.use(`${API}/insights`, insightsRoutes);
app.use(`${API}/certifications`, certificationRoutes);

// Payments
app.use(`${API}/payments`, paymentRoutes);

// Admin
app.use(`${API}/admin`, adminRoutes);

// ─── Error Handling ───────────────────────────────
//app.use(notFound);
app.use(errorHandler);

export default app;

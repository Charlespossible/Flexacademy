import { Request } from "express";
import { Role, SubscriptionTier } from "@prisma/client";

// ─── Augment Express Request ──────────────────
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: Role;
      isActive: boolean;
      isEmailVerified: boolean;
      firstName: string;
      lastName: string;
    }

    interface Request {
      user?: Express.User;
    }
  }
}

// ─── JWT Payload ──────────────────────────────
export interface JwtPayload {
  userId: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

// ─── Auth ─────────────────────────────────────
export interface RegisterBody {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: Role;
  gradeLevel?: string;
  curriculum?: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface ResetPasswordBody {
  token: string;
  newPassword: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ─── API Responses ────────────────────────────
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
}

export interface ApiPaginatedResponse<T = unknown> {
  success: true;
  message: string;
  data: T[];
  pagination: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: ValidationError[];
  stack?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

// ─── Pagination Query ─────────────────────────
export interface PaginationQuery {
  page?: string;
  limit?: string;
}

// ─── AI Tutor ─────────────────────────────────
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface AiChatBody {
  sessionId?: string;
  message: string;
  subject?: string;
  topic?: string;
}

export interface GenerateQuestionsBody {
  subject: string;
  topic: string;
  examCategory?: string;
  difficulty?: string;
  count?: number;
}

export interface GeneratedQuestion {
  body: string;
  options: QuestionOption[];
  explanation: string;
  difficulty: string;
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

// ─── Quiz ─────────────────────────────────────
export interface SubmitAttemptBody {
  answers: SubmittedAnswer[];
  timeTaken?: number;
}

export interface SubmittedAnswer {
  questionId: string;
  selectedOption?: string;
  writtenAnswer?: string;
  timeTaken?: number;
}

// ─── Subscription ─────────────────────────────
export interface SubscriptionCheckResult {
  tier: SubscriptionTier;
  isActive: boolean;
  canAccessAi: boolean;
  canAccessLiveClasses: boolean;
  canAccessPastQuestions: boolean;
}

// ─── Env ──────────────────────────────────────
export interface Env {
  NODE_ENV: "development" | "production" | "test";
  PORT: string;
  DATABASE_URL: string;
  REDIS_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;
  ANTHROPIC_API_KEY: string;
  ANTHROPIC_MODEL: string;
  CLIENT_URL: string;
}

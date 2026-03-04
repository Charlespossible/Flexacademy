import { z } from "zod";

// ─── Auth Validators ──────────────────────────
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and a number"
    ),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  role: z.enum(["STUDENT", "TUTOR"]).optional(),
  gradeLevel: z.string().optional(),
  curriculum: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and a number"
    ),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// ─── AI Tutor Validators ──────────────────────
export const aiChatSchema = z.object({
  sessionId: z.string().uuid().optional(),
  message: z.string().min(1, "Message is required").max(2000),
  subject: z.string().optional(),
  topic: z.string().optional(),
});

export const generateQuestionsSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  topic: z.string().min(1, "Topic is required"),
  examCategory: z
    .enum(["WAEC", "JAMB", "NECO", "GCE", "COMMON_ENTRANCE", "IGCSE", "SAT", "IELTS", "GMAT", "GRE", "CUSTOM"])
    .optional(),
  difficulty: z
    .enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXAM_READY"])
    .optional(),
  count: z.number().int().min(1).max(20).optional().default(5),
});

// ─── Quiz Validators ──────────────────────────
export const submitAttemptSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        selectedOption: z.string().optional(),
        writtenAnswer: z.string().optional(),
        timeTaken: z.number().int().optional(),
      })
    )
    .min(1, "At least one answer is required"),
  timeTaken: z.number().int().optional(),
});

// ─── Pagination Validator ─────────────────────
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 10))
    .pipe(z.number().int().min(1).max(100)),
});

// ─── Inferred Types ───────────────────────────
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AiChatInput = z.infer<typeof aiChatSchema>;
export type GenerateQuestionsInput = z.infer<typeof generateQuestionsSchema>;
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;

import { z } from "zod";

const examCategoryEnum = ["WAEC","JAMB","NECO","GCE","COMMON_ENTRANCE","IGCSE","SAT","IELTS","GMAT","GRE","CUSTOM"] as const;
const difficultyEnum = ["BEGINNER","INTERMEDIATE","ADVANCED","EXAM_READY"] as const;
const tierEnum = ["FREE","BASIC","PRO","ELITE"] as const;

// ─── Auth ──────────────────────────────────
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase, and a number"),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  role: z.enum(["STUDENT","TUTOR","PARENT"]).optional(),
  gradeLevel: z.string().optional(),
  curriculum: z.string().optional(),
});
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
export const forgotPasswordSchema = z.object({ email: z.string().email() });
export const resetPasswordSchema = z.object({ token: z.string().min(1), newPassword: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/) });
export const refreshTokenSchema = z.object({ refreshToken: z.string().min(1) });

// ─── AI Tutor ──────────────────────────────
export const aiChatSchema = z.object({ sessionId: z.string().uuid().optional(), message: z.string().min(1).max(2000), subject: z.string().optional(), topic: z.string().optional() });
export const generateQuestionsSchema = z.object({ subject: z.string().min(1), topic: z.string().min(1), examCategory: z.enum(examCategoryEnum).optional(), difficulty: z.enum(difficultyEnum).optional(), count: z.number().int().min(1).max(20).optional().default(5) });

// ─── Quiz ──────────────────────────────────
export const submitAttemptSchema = z.object({ answers: z.array(z.object({ questionId: z.string().uuid(), selectedOption: z.string().optional(), writtenAnswer: z.string().optional(), timeTaken: z.number().int().optional() })).min(1), timeTaken: z.number().int().optional() });

// ─── Exam Simulation ───────────────────────
export const startExamSchema = z.object({ examCategory: z.enum(examCategoryEnum), subjectId: z.string().uuid().optional(), year: z.number().int().min(1990).max(2030).optional(), timeLimitMins: z.number().int().min(10).max(240).optional() });
export const submitSimulationSchema = z.object({ answers: z.array(z.object({ questionId: z.string().uuid(), selectedOption: z.string().optional(), timeTaken: z.number().int().optional() })) });

// ─── Study Plan ────────────────────────────
export const createStudyPlanSchema = z.object({ title: z.string().min(1).max(200), targetExam: z.enum(examCategoryEnum).optional(), targetDate: z.string().datetime().optional(), dailyGoalMins: z.number().int().min(5).max(480).optional() });
export const generateStudyPlanSchema = z.object({ targetExam: z.enum(examCategoryEnum), targetDate: z.string().datetime(), dailyGoalMins: z.number().int().min(5).max(480).optional().default(60) });

// ─── Flashcard ─────────────────────────────
export const createDeckSchema = z.object({ title: z.string().min(1).max(200), topicId: z.string().uuid().optional(), description: z.string().max(500).optional(), isPublic: z.boolean().optional() });
export const createFlashcardSchema = z.object({ front: z.string().min(1), back: z.string().min(1), imageUrl: z.string().url().optional(), tags: z.array(z.string()).optional(), questionId: z.string().uuid().optional() });
export const reviewFlashcardSchema = z.object({ result: z.enum(["AGAIN","HARD","GOOD","EASY"]) });

// ─── Tutor ─────────────────────────────────
export const tutorApplicationSchema = z.object({ bio: z.string().min(50).max(2000), qualifications: z.array(z.string()).min(1), specializations: z.array(z.string()).min(1), subjectIds: z.array(z.string().uuid()).min(1), yearsOfExperience: z.number().int().min(0).max(50), hourlyRate: z.number().positive(), currency: z.string().length(3).optional(), cvUrl: z.string().url().optional(), coverLetter: z.string().max(2000).optional() });
export const updateAvailabilitySchema = z.object({ slots: z.array(z.object({ dayOfWeek: z.number().int().min(0).max(6), startTime: z.string().regex(/^\d{2}:\d{2}$/), endTime: z.string().regex(/^\d{2}:\d{2}$/) })) });

// ─── Booking ───────────────────────────────
export const createBookingSchema = z.object({ tutorProfileId: z.string().uuid(), subject: z.string().min(1), topic: z.string().optional(), scheduledAt: z.string().datetime(), durationMins: z.number().int().min(30).max(180).optional().default(60), studentNotes: z.string().max(500).optional() });
export const reviewBookingSchema = z.object({ rating: z.number().int().min(1).max(5), comment: z.string().max(1000).optional() });

// ─── Parent ────────────────────────────────
export const linkChildSchema = z.object({ studentEmail: z.string().email(), nickname: z.string().max(100).optional() });
export const alertSettingsSchema = z.object({ inactivityDays: z.number().int().min(1).max(30).optional(), minScorePercent: z.number().int().min(0).max(100).optional() });

// ─── School ────────────────────────────────
export const registerSchoolSchema = z.object({ name: z.string().min(2).max(200), address: z.string().optional(), state: z.string().optional(), country: z.string().optional(), contactEmail: z.string().email().optional(), contactPhone: z.string().optional() });
export const bulkEnrollSchema = z.object({ emails: z.array(z.string().email()).min(1).max(500), tier: z.enum(tierEnum).optional() });

// ─── Notification ──────────────────────────
export const updateNotiPrefSchema = z.object({ preferences: z.array(z.object({ type: z.string(), channel: z.string(), isEnabled: z.boolean() })) });
export const pushSubscribeSchema = z.object({ token: z.string().min(1), platform: z.enum(["web","android","ios"]) });

// ─── Content Report ────────────────────────
export const reportContentSchema = z.object({ reason: z.enum(["INCORRECT_ANSWER","OUTDATED_CONTENT","POOR_EXPLANATION","DUPLICATE","OFFENSIVE","OTHER"]), description: z.string().max(500).optional() });

// ─── Subscription / Promo ──────────────────
export const checkoutSchema = z.object({ tier: z.enum(tierEnum), promoCode: z.string().optional(), provider: z.enum(["paystack","stripe"]).optional().default("paystack") });
export const verifyPaymentSchema = z.object({ reference: z.string().min(1), provider: z.enum(["paystack","stripe"]) });
export const validatePromoSchema = z.object({ code: z.string().min(1), tier: z.enum(tierEnum) });

// ─── Course Review ─────────────────────────
export const courseReviewSchema = z.object({ rating: z.number().int().min(1).max(5), comment: z.string().max(1000).optional() });

// ─── Pagination ────────────────────────────
export const paginationSchema = z.object({ page: z.string().optional().transform(v => v ? parseInt(v,10) : 1).pipe(z.number().int().min(1)), limit: z.string().optional().transform(v => v ? parseInt(v,10) : 10).pipe(z.number().int().min(1).max(100)) });

// ─── Inferred types ────────────────────────
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AiChatInput = z.infer<typeof aiChatSchema>;
export type GenerateQuestionsInput = z.infer<typeof generateQuestionsSchema>;
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
export type StartExamInput = z.infer<typeof startExamSchema>;
export type CreateStudyPlanInput = z.infer<typeof createStudyPlanSchema>;
export type CreateDeckInput = z.infer<typeof createDeckSchema>;
export type CreateFlashcardInput = z.infer<typeof createFlashcardSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

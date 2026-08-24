import { Role, SubscriptionTier, ExamCategory } from "@prisma/client";

export enum ReportReason {
  INCORRECT_ANSWER = "INCORRECT_ANSWER",
  OUTDATED_CONTENT = "OUTDATED_CONTENT",
  POOR_EXPLANATION = "POOR_EXPLANATION",
  DUPLICATE = "DUPLICATE",
  OFFENSIVE = "OFFENSIVE",
  OTHER = "OTHER",
}

declare global {
  namespace Express {
    interface User { id: string; email: string; role: Role; isActive: boolean; isEmailVerified: boolean; firstName: string; lastName: string; }
    interface Request { user?: Express.User; }
  }
}

export interface JwtPayload { userId: string; role: Role; iat?: number; exp?: number; }
export interface RefreshTokenPayload { userId: string; iat?: number; exp?: number; }
export interface RegisterBody { email: string; password: string; firstName: string; lastName: string; role?: Role; gradeLevel?: string; curriculum?: string; }
export interface LoginBody { email: string; password: string; }
export interface ResetPasswordBody { token: string; newPassword: string; }
export interface TokenPair { accessToken: string; refreshToken: string; }
export interface ApiSuccessResponse<T = unknown> { success: true; message: string; data: T; }
export interface ApiPaginatedResponse<T = unknown> { success: true; message: string; data: T[]; pagination: PaginationMeta; }
export interface ApiErrorResponse { success: false; message: string; errors?: ValidationError[]; stack?: string; }
export interface PaginationMeta { total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrev: boolean; }
export interface ValidationError { field: string; message: string; }
export interface PaginationQuery { page?: string; limit?: string; }
export interface ChatMessage { role: "user" | "assistant"; content: string; timestamp: string; }
export interface AiChatBody { sessionId?: string; message: string; subject?: string; topic?: string; }
export interface GenerateQuestionsBody { subject: string; topic: string; examCategory?: string; difficulty?: string; count?: number; }
export interface GeneratedQuestion { body: string; options: QuestionOption[]; explanation: string; difficulty: string; }
export interface QuestionOption { id: string; text: string; isCorrect: boolean; }
export interface SubmitAttemptBody { answers: SubmittedAnswer[]; timeTaken?: number; }
export interface SubmittedAnswer { questionId: string; selectedOption?: string; writtenAnswer?: string; timeTaken?: number; }
export interface StartExamSimulationBody { examCategory: ExamCategory; subjectId?: string; year?: number; timeLimitMins?: number; }
export interface SubmitSimulationBody { answers: SubmittedAnswer[]; }
export interface CreateStudyPlanBody { title: string; targetExam?: ExamCategory; targetDate?: string; dailyGoalMins?: number; aiGenerated?: boolean; }
export interface GenerateStudyPlanBody { targetExam: ExamCategory; targetDate: string; dailyGoalMins?: number; }
export interface CreateDeckBody { title: string; topicId?: string; description?: string; isPublic?: boolean; }
export interface CreateFlashcardBody { front: string; back: string; imageUrl?: string; tags?: string[]; questionId?: string; }
export interface ReviewFlashcardBody { result: "AGAIN" | "HARD" | "GOOD" | "EASY"; }
export interface TutorApplicationBody { bio: string; qualifications: string[]; specializations: string[]; subjectIds: string[]; yearsOfExperience: number; hourlyRate: number; currency?: string; cvUrl?: string; coverLetter?: string; }
export interface CreateBookingBody { tutorProfileId: string; subject: string; topic?: string; scheduledAt: string; durationMins?: number; studentNotes?: string; }
export interface ReviewBookingBody { rating: number; comment?: string; }
export interface LinkChildBody { studentEmail: string; nickname?: string; }
export interface UpdateAlertSettingsBody { inactivityDays?: number; minScorePercent?: number; }
export interface RegisterSchoolBody { name: string; address?: string; state?: string; country?: string; contactEmail?: string; contactPhone?: string; }
export interface BulkEnrollBody { emails: string[]; tier?: SubscriptionTier; }
export interface UpdateNotificationPrefsBody { preferences: { type: string; channel: string; isEnabled: boolean }[]; }
export interface PushSubscribeBody { token: string; platform: "web" | "android" | "ios"; }
export interface ReportContentBody { reason: ReportReason; description?: string; entityType?: string; entityId?: string; }
export interface CheckoutBody { tier: SubscriptionTier; promoCode?: string; provider?: "paystack" | "stripe"; }
export interface VerifyPaymentBody { reference: string; provider: "paystack" | "stripe"; }
export interface ValidatePromoBody { code: string; tier: SubscriptionTier; }
export interface CreateCourseReviewBody { rating: number; comment?: string; }
export interface SubscriptionCheckResult { tier: SubscriptionTier; isActive: boolean; canAccessAi: boolean; canAccessLiveClasses: boolean; canAccessPastQuestions: boolean; }
export interface Env { NODE_ENV: "development" | "production" | "test"; PORT: string; DATABASE_URL: string; REDIS_URL: string; JWT_SECRET: string; JWT_EXPIRES_IN: string; JWT_REFRESH_SECRET: string; JWT_REFRESH_EXPIRES_IN: string; ANTHROPIC_API_KEY: string; ANTHROPIC_MODEL: string; CLIENT_URL: string; }

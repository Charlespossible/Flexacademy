// ─────────────────────────────────────────────────────────────────────────────
// ENUMS — mirror backend Prisma enums exactly
// ─────────────────────────────────────────────────────────────────────────────

export type Role = 'STUDENT' | 'TUTOR' | 'PARENT' | 'SCHOOL_ADMIN' | 'ADMIN' | 'SUPER_ADMIN';

export type SubscriptionTier = 'FREE' | 'BASIC' | 'PRO' | 'ELITE';

export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'TRIAL';

export type ContentType = 'VIDEO' | 'TEXT' | 'QUIZ' | 'FLASHCARD' | 'PAST_QUESTION' | 'LIVE_CLASS' | 'DOCUMENT';

export type DifficultyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXAM_READY';

export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY' | 'FILL_IN_BLANK' | 'DRAG_AND_DROP';

export type ExamCategory =
  | 'WAEC' | 'JAMB' | 'NECO' | 'GCE' | 'COMMON_ENTRANCE'
  | 'IGCSE' | 'SAT' | 'IELTS' | 'GMAT' | 'GRE' | 'CUSTOM';

export type SessionStatus = 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export type NotificationType =
  | 'STUDY_REMINDER' | 'BADGE_EARNED' | 'STREAK_MILESTONE'
  | 'EXAM_REMINDER' | 'NEW_CONTENT' | 'RESULT_READY'
  | 'LEADERBOARD_UPDATE' | 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED'
  | 'TUTOR_APPROVED' | 'PARENT_ALERT' | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED' | 'SYSTEM' | 'ANNOUNCEMENT'
  | 'GAP_DETECTED' | 'TUTOR_INSIGHT_READY' | 'STUDENT_IMPROVED'
  | 'EXAM_READINESS_UPDATED' | 'INTERVENTION_REQUIRED' | 'CERTIFICATION_READY';

export type AssignmentStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'TERMINATED';

export type GapSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type GapStatus = 'OPEN' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'MONITORING';

export type CertificationStatus = 'PENDING_REVIEW' | 'APPROVED' | 'ISSUED' | 'REVOKED' | 'EXPIRED';

export type SessionType = 'STUDY_PLAN' | 'LESSON' | 'AD_HOC';

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH' | 'WHATSAPP';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export type TutorApplicationStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export type ReportReason = 'INCORRECT_ANSWER' | 'OUTDATED_CONTENT' | 'POOR_EXPLANATION' | 'DUPLICATE' | 'OFFENSIVE' | 'OTHER';

export type ReportStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';

export type ExamSimulationStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'TIMED_OUT' | 'ABANDONED';

export type StudyPlanStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABANDONED';

export type FlashcardReviewResult = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';

export type LicenseType = 'SCHOOL' | 'INSTITUTION' | 'CORPORATE';

// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN MODELS
// ─────────────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: Role;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  /** Hard deactivation — such an account cannot sign in at all. */
  isActive: boolean;
  /** Soft suspension: set means suspended. The user can still sign in. */
  suspendedAt?: string | null;
  suspensionReason?: string | null;
  googleId?: string;
  lastLoginAt?: string;
  schoolId?: string;
  createdAt: string;
  updatedAt: string;
  studentProfile?: StudentProfile;
  tutorProfile?: TutorProfile;
  subscription?: Subscription;
}

export interface StudentProfile {
  id: string;
  userId: string;
  gradeLevel: string;
  curriculum: string;
  school?: string;
  state?: string;
  country: string;
  studyGoal?: string;
  targetExams: ExamCategory[];
  preferredSubjectIds: string[];
  targetYear?: number;
  studyStreakDays: number;
  longestStreak: number;
  totalXp: number;
  weeklyGoalMins: number;
  lastStudyDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TutorProfile {
  id: string;
  userId: string;
  bio?: string;
  qualifications: string[];
  specializations: string[];
  subjectIds: string[];
  yearsOfExperience: number;
  hourlyRate?: number;
  currency: string;
  rating: number;
  totalReviews: number;
  totalSessions: number;
  isVerified: boolean;
  applicationStatus: TutorApplicationStatus;
  availabilitySlots?: AvailabilitySlot[];
  totalEarnings: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
  reviews?: TutorReview[];
}

export interface AvailabilitySlot {
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  startTime: string; // "HH:MM"
  endTime: string;
}

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubId?: string;
  paystackCustomerId?: string;
  paystackSubCode?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  trialEndsAt?: string;
  promoCodeId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
  topics?: Topic[];
  courses?: Course[];
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  slug: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  subject?: Subject;
}

export interface Course {
  id: string;
  subjectId: string;
  title: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  difficulty: DifficultyLevel;
  gradeLevel?: string;
  curriculum?: string;
  isFree: boolean;
  requiredTier: SubscriptionTier;
  totalDuration: number;
  isPublished: boolean;
  publishedAt?: string;
  totalLessons: number;
  createdAt: string;
  updatedAt: string;
  subject?: Subject;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  courseId: string;
  topicId?: string;
  title: string;
  slug: string;
  contentType: ContentType;
  content?: string;
  videoUrl?: string;
  duration?: number;
  order: number;
  isFree: boolean;
  isPublished: boolean;
  aiSummary?: string;
  createdAt: string;
  updatedAt: string;
  course?: Course;
  topic?: Topic;
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  topicId?: string;
  subjectId?: string;
  examCategory?: ExamCategory;
  year?: number;
  questionType: QuestionType;
  body: string;
  imageUrl?: string;
  options?: QuestionOption[];
  correctAnswer?: string;
  explanation?: string;
  difficulty: DifficultyLevel;
  marks: number;
  aiGenerated: boolean;
  tags: string[];
  isVerified: boolean;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  topic?: Topic;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  examCategory?: ExamCategory;
  subjectId?: string;
  gradeLevel?: string;
  difficulty: DifficultyLevel;
  timeLimit?: number;
  passMark: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  isPublished: boolean;
  requiredTier: SubscriptionTier;
  createdAt: string;
  updatedAt: string;
  questions?: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  questionId: string;
  order: number;
  question: Question;
}

export interface AttemptAnswer {
  questionId: string;
  selectedOption?: string;
  writtenAnswer?: string;
  isCorrect: boolean;
  marksAwarded: number;
  timeTaken?: number;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  totalMarks: number;
  percentage: number;
  timeTaken?: number;
  isPassed: boolean;
  completedAt?: string;
  aiAnalysis?: string;
  startedAt: string;
  createdAt: string;
  answers?: AttemptAnswer[];
  quiz?: Quiz;
}

export interface ExamSimulation {
  id: string;
  userId: string;
  examCategory: ExamCategory;
  subjectId?: string;
  year?: number;
  title: string;
  totalQuestions: number;
  timeLimitMins: number;
  status: ExamSimulationStatus;
  startedAt: string;
  submittedAt?: string;
  autoSubmittedAt?: string;
  score?: number;
  totalMarks?: number;
  percentage?: number;
  isPassed?: boolean;
  aiAnalysis?: string;
  questionSnapshot: Question[];
  createdAt: string;
  answers?: ExamSimulationAnswer[];
}

export interface ExamSimulationAnswer {
  simulationId: string;
  questionId: string;
  selectedOption?: string;
  isCorrect: boolean;
  marksAwarded: number;
  timeTaken?: number;
}

export interface StudyPlan {
  id: string;
  userId: string;
  title: string;
  description?: string;
  targetExam?: ExamCategory;
  targetDate?: string;
  dailyGoalMins: number;
  status: StudyPlanStatus;
  isAiGenerated: boolean;
  assignmentId?: string;
  isSharedWithTutor?: boolean;
  createdAt: string;
  updatedAt: string;
  items?: StudyPlanItem[];
  totalItems?: number;
  completedItems?: number;
}

export interface StudyPlanItem {
  id: string;
  studyPlanId: string;
  topicId?: string;
  title: string;
  description?: string;
  scheduledFor: string;
  durationMins: number;
  isCompleted: boolean;
  completedAt?: string;
  order: number;
  createdAt: string;
  topic?: Topic;
  isOverdue?: boolean;
}

export interface FlashcardDeck {
  id: string;
  userId: string;
  topicId?: string;
  title: string;
  description?: string;
  isPublic: boolean;
  cardCount: number;
  createdAt: string;
  updatedAt: string;
  topic?: Topic;
  cards?: Flashcard[];
  dueCount?: number;
}

export interface Flashcard {
  id: string;
  deckId: string;
  questionId?: string;
  front: string;
  back: string;
  imageUrl?: string;
  tags: string[];
  easeFactor: number;
  repetitions: number;
  interval: number;
  nextReviewAt: string;
  lastReviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  deck?: FlashcardDeck;
}

export interface LearningProgress {
  id: string;
  userId: string;
  courseId: string;
  progressPercent: number;
  lastAccessedAt: string;
  updatedAt: string;
  course?: Course;
}

export interface TopicMastery {
  id: string;
  userId: string;
  topicId: string;
  subjectId?: string;
  totalAttempts: number;
  correctAnswers: number;
  accuracyPercent: number;
  masteryLevel: number;
  lastAttemptAt?: string;
  updatedAt: string;
  topic?: Topic;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: { type: string; value: number };
  xpReward: number;
  createdAt: string;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: string;
  badge: Badge;
}

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  title: string;
  issuedAt: string;
  expiresAt?: string;
  credentialId: string;
  pdfUrl?: string;
  course?: Course;
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  period: string;
  subject?: string;
  schoolId?: string;
  score: number;
  rank?: number;
  updatedAt: string;
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'>;
}

export interface AiTutorSession {
  id: string;
  userId: string;
  subject?: string;
  topic?: string;
  messages: ChatMessage[];
  tokensUsed: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface LiveClass {
  id: string;
  tutorProfileId: string;
  title: string;
  description?: string;
  subject: string;
  gradeLevel?: string;
  scheduledAt: string;
  durationMins: number;
  maxStudents: number;
  status: SessionStatus;
  meetingUrl?: string;
  recordingUrl?: string;
  aiNotes?: string;
  requiredTier: SubscriptionTier;
  createdAt: string;
  updatedAt: string;
  tutor?: TutorProfile;
}

export interface Booking {
  id: string;
  studentId: string;
  tutorProfileId: string;
  subject: string;
  topic?: string;
  scheduledAt: string;
  durationMins: number;
  status: BookingStatus;
  meetingUrl?: string;
  studentNotes?: string;
  tutorNotes?: string;
  cancelReason?: string;
  cancelledBy?: string;
  completedAt?: string;
  amount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  tutorProfile?: TutorProfile;
  review?: TutorReview;
}

export interface TutorReview {
  id: string;
  tutorProfileId: string;
  reviewerId: string;
  bookingId: string;
  rating: number;
  comment?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  reviewer?: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'>;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  isEnabled: boolean;
  updatedAt: string;
}

export interface ParentStudentLink {
  id: string;
  parentId: string;
  studentId: string;
  nickname?: string;
  isVerified: boolean;
  createdAt: string;
  child?: User;
}

export interface ParentAlert {
  id: string;
  linkId: string;
  parentId: string;
  alertType: string;
  message: string;
  inactivityDays?: number;
  minScorePercent?: number;
  isRead: boolean;
  createdAt: string;
}

export interface School {
  id: string;
  name: string;
  slug: string;
  address?: string;
  state?: string;
  country: string;
  contactEmail?: string;
  contactPhone?: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentTutorAssignment {
  id: string;
  studentId: string;
  tutorId: string;
  status: AssignmentStatus;
  assignedAt: string;
  endedAt?: string;
  tutor?: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'> & { tutorProfile?: TutorProfile };
  student?: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'>;
}

export interface LearningGap {
  id: string;
  studentId: string;
  topicId: string;
  subjectId?: string;
  severity: GapSeverity;
  status: GapStatus;
  gapScore: number;
  masteryAtDetection: number;
  tutorBriefId?: string;
  detectedAt: string;
  resolvedAt?: string;
  topic?: Topic;
  subject?: Subject;
  tutorInsight?: TutorInsight;
}

export interface TutorInsight {
  id: string;
  tutorId: string;
  studentId: string;
  gapId: string;
  brief: string;
  actionItems: string[];
  priority: GapSeverity;
  isResolved: boolean;
  resolvedAt?: string;
  createdAt: string;
  student?: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'>;
  gap?: LearningGap;
  interventions?: TutorIntervention[];
}

export interface TutorIntervention {
  id: string;
  insightId: string;
  tutorId: string;
  method: string;
  notes?: string;
  outcome?: string;
  createdAt: string;
}

export interface ExamReadinessCertification {
  id: string;
  userId: string;
  examCategory: ExamCategory;
  status: CertificationStatus;
  estimatedScore: number;
  readinessScore: number;
  certIssued: boolean;
  issuedAt?: string;
  certUrl?: string;
  comments?: string;
  createdAt: string;
}

export interface SchoolLicense {
  id: string;
  schoolId: string;
  licenseType: LicenseType;
  tier: SubscriptionTier;
  maxStudents: number;
  activeStudents: number;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  pricePerSeat?: number;
  totalPaid: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// API RESPONSE SHAPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiPaginated<T> {
  success: true;
  message: string;
  data: T[];
  pagination: PaginationMeta;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: ValidationError[];
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

// ─────────────────────────────────────────────────────────────────────────────
// AUTH TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  subscription: Subscription;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterBody {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'STUDENT' | 'TUTOR';
  gradeLevel?: string;
  curriculum?: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface ForgotPasswordBody {
  email: string;
}

export interface ResetPasswordBody {
  token: string;
  newPassword: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// QUERY BODY TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface PaginationQuery {
  page?: number;
  limit?: number;
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
  examCategory?: ExamCategory;
  difficulty?: DifficultyLevel;
  count?: number;
}

export interface SubmittedAnswer {
  questionId: string;
  selectedOption?: string;
  writtenAnswer?: string;
  timeTaken?: number;
}

export interface StartExamSimulationBody {
  examCategory: ExamCategory;
  subjectId?: string;
  year?: number;
  timeLimitMins?: number;
}

export interface CreateStudyPlanBody {
  title: string;
  targetExam?: ExamCategory;
  targetDate?: string;
  dailyGoalMins?: number;
  aiGenerated?: boolean;
}

export interface CreateDeckBody {
  title: string;
  topicId?: string;
  description?: string;
  isPublic?: boolean;
}

export interface CreateFlashcardBody {
  front: string;
  back: string;
  imageUrl?: string;
  tags?: string[];
  questionId?: string;
}

export interface CreateBookingBody {
  tutorProfileId: string;
  subject: string;
  topic?: string;
  scheduledAt: string;
  durationMins?: number;
  studentNotes?: string;
}

export interface CheckoutBody {
  tier: SubscriptionTier;
  promoCode?: string;
  provider?: 'paystack' | 'stripe';
}

export interface SubscriptionCheckResult {
  tier: SubscriptionTier;
  isActive: boolean;
  canAccessAi: boolean;
  canAccessLiveClasses: boolean;
  canAccessPastQuestions: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI PIPELINE RESPONSE TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ExamReadiness {
  examCategory: ExamCategory;
  totalTopics: number;
  masteredTopics: number;
  avgMastery: number;
  weakTopics: number;
  estimatedScore: number;
  readinessScore: number;
  topicBreakdown: TopicMastery[];
  openGapsCount: number;
  eligibleForCertification: boolean;
  certificationInfo?: ExamReadinessCertification;
}

export interface GapDetectionResult {
  newGapsDetected: number;
  insightsGenerated: number;
  existingOpenGaps: number;
  regressedGaps: number;
  totalWeakTopics: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDY DASHBOARD TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ProgressOverview {
  avgMastery: number;
  topicsLearned: number;
  coursesEnrolled: number;
  coursesCompleted: number;
  totalStudyMins: number;
  totalXp: number;
  badgesEarned: number;
  currentStreak: number;
  longestStreak: number;
  lastUpdated: string;
}

export interface WeakArea {
  topicId: string;
  name: string;
  subjectName: string;
  masteryLevel: number; // 0-100
  accuracy: number;
  attempts: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface SubjectProgress {
  subjectId: string;
  name: string;
  totalTopics: number;
  learnedTopics: number;
  avgMastery: number;
  completionPercent: number;
}

export interface DueFlashcard {
  id: string;
  front: string;
  back: string;
  easeFactor: number;
  repetitions: number;
  nextReviewAt: string;
  deck: {
    id: string;
    title: string;
  };
}

export interface DeckStats {
  id: string;
  title: string;
  description?: string;
  totalCards: number;
  dueCards: number;
  newCards: number;
  masteredCards: number;
  createdAt: string;
}

export interface DashboardStats {
  overview: ProgressOverview;
  weakAreas: WeakArea[];
  recentActivity: {
    dueFlashcards: number;
    activeStudyPlans: number;
    upcomingExams: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DISPLAY CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

export const EXAM_DISPLAY: Record<ExamCategory, string> = {
  WAEC: 'WAEC',
  JAMB: 'JAMB/UTME',
  NECO: 'NECO',
  GCE: 'GCE',
  COMMON_ENTRANCE: 'Common Entrance',
  IGCSE: 'IGCSE',
  SAT: 'SAT',
  IELTS: 'IELTS',
  GMAT: 'GMAT',
  GRE: 'GRE',
  CUSTOM: 'Custom',
};

export const GRADE_LEVELS = [
  'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6',
  'JSS 1', 'JSS 2', 'JSS 3',
  'SS 1', 'SS 2', 'SS 3',
  '100 Level', '200 Level', '300 Level', '400 Level', 'Postgraduate',
];

export const CURRICULA = ['WAEC', 'NECO', 'IGCSE', 'Cambridge', 'IB', 'American', 'Nigerian National'];

export const TIER_ORDER: Record<SubscriptionTier, number> = {
  FREE: 0,
  BASIC: 1,
  PRO: 2,
  ELITE: 3,
};

export type SSEMessage =
  | { type: 'text'; content: string }
  | { type: 'done'; sessionId: string; tokensUsed: number }
  | { type: 'error'; message: string };

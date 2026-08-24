# FlexAcademy Database Schema Analysis

## 1. MAIN DATA MODELS BY DOMAIN

### 1.1 USER MANAGEMENT & AUTHENTICATION
- **User** (Core) - Email, phone, OAuth (Google), subscription tracking, school affiliation
- **StudentProfile** - Grade level, curriculum, study goals, streak tracking, XP management
- **TutorProfile** - Qualifications, specializations, hourly rate, availability, earnings tracking
- **TutorApplication** - Application review workflow for tutor onboarding
- **ParentStudentLink** - Links parents to students for monitoring
- **ParentAlert** - Parent-configured alerts (inactivity, low scores, streak broken)
- **School** - B2B institutional accounts
- **SchoolLicense** - Licensing model (School/Institution/Corporate), seat management

### 1.2 SUBSCRIPTIONS & PAYMENTS
- **Subscription** - User's subscription tier (FREE/BASIC/PRO/ELITE), status, billing period
- **Payment** - Transactions (Stripe, Paystack, Flutterwave), refunds
- **PromoCode** - Discount codes with usage limits and tier requirements
- **PromoCodeUsage** - Tracks user redemptions
- **Referral** - Referral links with conversion tracking
- **TutorEarning** - Revenue splits (gross, platform fee, net)

### 1.3 CURRICULUM & CONTENT
- **Subject** - Mathematics, English, Sciences (with icon, color, slug)
- **Topic** - Sub-topics within subjects (e.g., "Quadratic Equations" in Math)
- **Course** - Full courses with difficulty levels, grade levels, free/paid content
- **Lesson** - Individual lessons (video, text, document) with markdown + LaTeX support
- **CourseReview** - Student ratings and comments on courses

### 1.4 EXAM QUESTIONS & QUIZZES
- **Question** - Supports multiple question types (MCQ, True/False, Short Answer, Essay, Fill-in-Blank, Drag & Drop)
  - Linked to topics, subjects, exam categories (WAEC, JAMB, NECO, GCE, IGCSE, SAT, etc.)
  - JSON options structure, AI-generated option, verification status
- **Quiz** - Question collections with time limits, pass marks, difficulty, shuffle options
- **QuizQuestion** - Many-to-many junction with ordering
- **QuizAttempt** - User quiz submission with score, time, pass/fail, AI analysis
- **AttemptAnswer** - Per-question response tracking

### 1.5 EXAM SIMULATION (Separate from Quizzes)
- **ExamSimulation** - Full-length timed exam (JAMB, WAEC, etc.)
  - Server-side time enforcement, auto-submit on timeout
  - JSON snapshot of questions for integrity
- **ExamSimulationAnswer** - Individual question responses with time tracking

### 1.6 STUDY & LEARNING PLANNING
- **StudyPlan** - AI-generated or user-created study schedules with target exams
- **StudyPlanItem** - Individual study tasks scheduled for specific dates
- **Enrollment** - User → Course relationships
- **LearningProgress** - Course completion percentage tracking
- **LessonProgress** - Granular lesson-level tracking (watched seconds for video)
- **TopicMastery** - Accuracy percentage and mastery level per topic for weak-area detection
- **StudySession** - Daily study activity (duration, XP earned, date for heatmaps)

### 1.7 FLASHCARDS (SPACED REPETITION)
- **FlashcardDeck** - User-created or public decks linked to topics
- **Flashcard** - Individual cards with SM-2 algorithm fields:
  - `easeFactor`, `repetitions`, `interval`, `nextReviewAt`
  - Can be linked to questions
- **FlashcardReview** - Spaced repetition tracking with results (AGAIN, HARD, GOOD, EASY)

### 1.8 GAMIFICATION & PROGRESS
- **Badge** - Achievement badges with XP rewards
- **UserBadge** - User badge acquisitions with earned timestamps
- **Certificate** - Course completion certificates with credential verification IDs
- **LeaderboardEntry** - Multi-period ranking (daily, weekly, monthly, all-time) by subject or school
- **Bookmark** - User-saved lessons/content

### 1.9 TUTOR MARKETPLACE
- **Booking** - Student ↔ Tutor session reservations
  - Status: PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW
  - Amount, meeting URL, pre/post notes
- **TutorReview** - Public/private review ratings and comments post-session
- **TutorEarning** - Revenue tracking with platform commission calculation

### 1.10 LIVE CLASSES
- **LiveClass** - Tutor-led live sessions (scheduled, in-progress, recorded)
  - Max students, meeting URL, AI-generated notes from transcript
- **LiveClassBooking** - Student registrations for live classes
- **Booking** (relations) - Can be linked to LiveClass for unified booking system

### 1.11 AI TUTOR
- **AiTutorSession** - Conversation history, subject/topic, token usage tracking

### 1.12 NOTIFICATIONS & COMMUNICATION
- **Notification** - In-app notifications (15+ types: Study Reminders, Badges, Streaks, Results, etc.)
- **NotificationPreference** - Per-user, per-channel opt-in settings (IN_APP, EMAIL, SMS, PUSH, WHATSAPP)
- **DeviceToken** - FCM/Web Push tokens for mobile/web notifications
- **Announcement** - Platform-wide broadcasts with role targeting

### 1.13 CONTENT MODERATION
- **ContentReport** - User-submitted reports on questions/lessons/courses
  - Reasons: Incorrect Answer, Outdated Content, Poor Explanation, Offensive, Duplicate, Other
  - Status: OPEN, UNDER_REVIEW, RESOLVED, DISMISSED
- **AuditLog** - Action tracking for compliance and debugging

---

## 2. KEY RELATIONSHIPS & HIERARCHIES

### Core Relational Flow
```
User (1) ─→ (1) StudentProfile / TutorProfile
         ─→ (1) Subscription → Payments
         ─→ (M) Enrollments ↔ Courses
         ─→ (M) StudySessions (daily activity)
         ─→ (M) Badges (achievements)
         ─→ (M) LeaderboardEntries (multi-period rankings)
         ─→ (M) Notifications / NotificationPreferences

Subject (1) ─→ (M) Topics ─→ (M) Lessons
                        ├─→ (M) Questions ─→ (M) Quizzes
                        ├─→ (M) FlashcardDecks
                        └─→ (M) StudyPlanItems

Course (1) ─→ (M) Lessons
        ─→ (M) Enrollments (student list)
        ─→ (M) LearningProgress (per-user completion %)
        ─→ (M) Certificates (completers)

Question (1) ─→ (M) QuizQuestions (in many quizzes)
           ─→ (M) AttemptAnswers (student responses)
           ─→ (M) ExamSimulationAnswers
           ─→ (M) ContentReports (moderation)
           ─→ (M) Flashcards (linked cards)

Student ─→ TutorProfile (via Booking)
        ├─→ (M) Bookings (tutor sessions)
        ├─→ (M) Enrollments (courses)
        ├─→ (M) QuizAttempts
        ├─→ (M) ExamSimulations
        ├─→ (M) StudyPlans
        ├─→ (M) FlashcardDecks (personal or public)
        ├─→ (M) AiTutorSessions
        └─→ (M) Certificates (earned)

Parent ─→ (M) ParentStudentLinks ─→ (M) Students
       ─→ (M) ParentAlerts (on linked children)

TutorProfile ─→ (M) Bookings (incoming student requests)
            ├─→ (M) TutorReviews (ratings from students)
            ├─→ (M) LiveClasses (scheduled sessions)
            └─→ (M) TutorEarnings (revenue tracking)

School (1) ─→ (M) Users (school-affiliated students)
        ─→ (1) SchoolLicense (subscription tier, seats)
```

### Multi-Tenancy Support
- **User.schoolId** → School affiliation for B2B licensing
- **LeaderboardEntry.schoolId** → Optional school-scoped rankings
- **SchoolLicense** → Manages seat count, tier, expiration

---

## 3. ENUMS DEFINED IN SCHEMA

### User & Authorization (1 enum)
- **Role**: STUDENT, TUTOR, PARENT, SCHOOL_ADMIN, ADMIN, SUPER_ADMIN

### Subscription & Commerce (3 enums)
- **SubscriptionTier**: FREE, BASIC, PRO, ELITE
- **SubscriptionStatus**: ACTIVE, CANCELLED, EXPIRED, TRIAL
- **PaymentStatus**: PENDING, SUCCESS, FAILED, REFUNDED

### Content & Learning (5 enums)
- **ContentType**: VIDEO, TEXT, QUIZ, FLASHCARD, PAST_QUESTION, LIVE_CLASS, DOCUMENT
- **DifficultyLevel**: BEGINNER, INTERMEDIATE, ADVANCED, EXAM_READY
- **QuestionType**: MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, ESSAY, FILL_IN_BLANK, DRAG_AND_DROP
- **ExamCategory**: WAEC, JAMB, NECO, GCE, COMMON_ENTRANCE, IGCSE, SAT, IELTS, GMAT, GRE, CUSTOM
- **FlashcardReviewResult**: AGAIN, HARD, GOOD, EASY

### Sessions & Bookings (3 enums)
- **SessionStatus**: SCHEDULED, LIVE, COMPLETED, CANCELLED
- **BookingStatus**: PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW
- **ExamSimulationStatus**: IN_PROGRESS, SUBMITTED, TIMED_OUT, ABANDONED

### Notifications & Communication (2 enums)
- **NotificationType**: 15 types including STUDY_REMINDER, BADGE_EARNED, STREAK_MILESTONE, EXAM_REMINDER, NEW_CONTENT, RESULT_READY, LEADERBOARD_UPDATE, BOOKING_CONFIRMED, TUTOR_APPROVED, PARENT_ALERT, PAYMENT_SUCCESS, PAYMENT_FAILED, SYSTEM, ANNOUNCEMENT
- **NotificationChannel**: IN_APP, EMAIL, SMS, PUSH, WHATSAPP

### Moderation & Administrative (4 enums)
- **TutorApplicationStatus**: PENDING, UNDER_REVIEW, APPROVED, REJECTED
- **ReportReason**: INCORRECT_ANSWER, OUTDATED_CONTENT, POOR_EXPLANATION, DUPLICATE, OFFENSIVE, OTHER
- **ReportStatus**: OPEN, UNDER_REVIEW, RESOLVED, DISMISSED
- **StudyPlanStatus**: ACTIVE, PAUSED, COMPLETED, ABANDONED

### B2B Licensing (1 enum)
- **LicenseType**: SCHOOL, INSTITUTION, CORPORATE

---

## 4. CORE LEARNING PLATFORM FEATURES

### 🎓 Learning Content Management
- **Multi-Subject Curriculum**: Topics organized under subjects with hierarchical structure
- **Flexible Lesson Formats**: Video, text, documents, markdown + LaTeX support
- **Question Bank**: 6 question types, tagged with exam categories, difficulty levels, verification status
- **Quiz Engine**: Customizable quizzes with time limits, pass marks, shuffle options

### 📚 Assessment & Exam Prep
- **Past Year Quizzes**: Questions tagged with WAEC, JAMB, NECO exam years
- **Timed Exam Simulations**: Full-length timed exams with server-side enforcement and auto-submit
- **Performance Analytics**: Accuracy per topic, mastery levels, AI-generated performance analysis
- **Question Verification**: Admin review status for quality control

### 📖 Study Tools
- **Spaced Repetition Flashcards**: SM-2 algorithm implementation for efficient memorization
- **Study Plans**: AI-generated or manual schedules with target exam dates
- **Bookmarks & Notes**: Save lessons and add personal notes
- **Study Sessions**: Daily activity tracking for heatmaps and streak calculations

### 👥 Social & Collaborative
- **Tutor Marketplace**: Students book 1-on-1 sessions with vetted tutors
- **Live Classes**: Group instruction with optional recording and AI transcript notes
- **Peer Reviews**: Rate tutors post-session for quality assurance
- **Leaderboards**: Multi-period rankings (daily, weekly, monthly, all-time) by subject or school

### 🎮 Gamification & Motivation
- **XP System**: Earned through study sessions and activities
- **Badges & Achievements**: Unlocked for milestones (7-day streak, first certification, etc.)
- **Study Streaks**: Track consecutive daily study with longest streak history
- **Certificates**: Issued upon course completion with credential verification IDs

### 👨‍👩‍👧 Parent Dashboard
- **Child Monitoring**: Track linked children's progress and activities
- **Configurable Alerts**: Notifications on inactivity, low scores, broken streaks
- **Progress Reports**: Parent-visible performance summaries

### 🤖 AI-Powered Features
- **AI Tutor Sessions**: Conversation-based learning assistance
- **AI Performance Analysis**: Detailed analysis of quiz/exam results with weak area detection
- **AI Study Recommendations**: Personalized learning paths based on topic mastery
- **AI Class Notes**: Auto-generated notes from live class transcripts

### 💰 Business Model
- **Tiered Subscriptions**: Free, Basic, Pro, Elite with access restrictions
- **Tutor Booking Revenue**: Split between tutor (net) and platform (commission)
- **School Licensing**: B2B packages with seat management and expiration
- **Promotional Marketing**: Referral system, promo codes, paid ads potential

### 🔐 Security & Moderation
- **User Verification**: Email, phone, Google OAuth, payment verification
- **Content Reporting**: Community moderation with status tracking
- **Tutor Vetting**: Application workflow with document verification
- **Audit Logging**: Full action tracking for compliance

### 📱 Multi-Channel Delivery
- **Web Push Notifications**: FCM token tracking
- **Email Notifications**: Transactional and engagement emails
- **SMS Alerts**: For critical notifications
- **WhatsApp Integration**: Direct messaging capability
- **In-App Notifications**: Native platform alerts

### 🏫 B2B Institutional Support
- **School Affiliation**: Users can belong to schools
- **School-Scoped Leaderboards**: Rankings within institutions
- **Bulk Licensing**: Seat-based subscription tiers
- **Admin Dashboard**: School admins manage their users

---

## 5. HOMEPAGE RECOMMENDATIONS: WHAT TO SHOWCASE

### For **UNAUTHENTICATED USERS** (Public Homepage)

#### Above the Fold
1. **Hero Section**
   - Value proposition: "Master exams with AI + tutors + community"
   - CTA: "Start Learning Free" or "Login"
   - Background: Social proof (user testimonials, stats)

2. **Key Features Teaser** (6 cards)
   - 📚 Structured Courses (by Subject + Grade)
   - 🎯 Exam Simulators (WAEC, JAMB, NECO, IGCSE, etc.)
   - 👨‍🏫 Live Tutoring (book vetted tutors)
   - 🤖 AI Tutor (24/7 help)
   - 📊 Progress Tracking (streaks, badges, certificates)
   - 🏆 Leaderboards (compete with peers)

#### Mid-Section
3. **Trending Content Showcase**
   - **Featured Courses** (5–6 highest-enrollment courses by Subject)
     - Display: Course title, subject, difficulty, enrollee count
     - Query: `Course WHERE isPublished=true ORDER BY enrollmentCount DESC LIMIT 6`
   
   - **Popular Subjects** (Subject cards with topic counts, icon, color)
     - Display: Subject name, # of topics, # of questions
     - Query: `Subject ORDER BY topicCount DESC LIMIT 4–6`
   
   - **Latest Exam Categories Available** (WAEC, JAMB, NECO, GCE, IGCSE, SAT)
     - Display: Exam name, # questions available, past years covered
     - Query: `Question GROUP BY examCategory COUNT(*) LIMIT 6`

4. **Social Proof Section**
   - Total users, active learners this week, total lessons completed
   - Featured testimonials from verified users (1–3 star reviews)
   - Recent badges/certificates earned (anonymized: "User earned Web Development Certificate")

#### Bottom Section
5. **Subscription Tiers Comparison Table**
   - Free vs Basic vs Pro vs Elite
   - Feature list per tier
   - CTA buttons pointing to signup

6. **Tutor Marketplace Preview**
   - Featured tutors (verified + high-rated)
   - Display: Name, subjects, rating ⭐, hourly rate, availability
   - "Browse All Tutors" link

7. **FAQ & Trust Section**
   - "Is it really free?", "How do I book a tutor?", "Will I get a certificate?"

---

### For **AUTHENTICATED USERS** (Logged-In Dashboard)

#### Quick Stats Dashboard (Top Cards)
1. **Study Stats This Week**
   - Total study time, XP earned, streak count
   - "You're on a 🔥 12-day streak!"

2. **Current Progress**
   - Enrolled courses: show top 3 with completion %
   - Active study plans: show countdown to exam date
   - Latest exam simulations: score, % passed

#### Content Recommendations
3. **Personalized Weak Areas to Review**
   - Topic mastery analysis: "You're 60% confident in Probability"
   - Recommended: Flashcard deck or lesson
   - Query: `TopicMastery WHERE accuracyPercent < 70 ORDER BY lastAttemptAt DESC LIMIT 5`

4. **Next Recommended Actions**
   - Incomplete lessons: "Finish Chapter 3 of Organic Chemistry"
   - Due study plan items: "Study Quadratic Equations by Thu 3pm"
   - Flashcard reviews due: "10 cards ready for review"
   - Query: `FlashcardReview WHERE nextReviewAt <= NOW() AND userId = ?`

5. **Recent Activity Feed**
   - Badges earned: "🏅 First 100 XP Badge"
   - Leaderboard movement: "↑ You moved to #5 in Math this week"
   - Course completions: "🎓 Completed English Literature 101"

#### Social & Engagement
6. **Leaderboard Snippet**
   - Subject-scoped top 10 (if student, show their rank)
   - "You're #5 in Mathematics this week"
   - Link to full leaderboard

7. **Peer Activity**
   - Recent certifications: "Maya just earned Web Development certificate"
   - Friends' study streaks (if friend feature exists)

8. **Referral Widget**
   - "Share your code: FLEX123ABC and earn rewards"
   - Referrals made vs converted

#### For Teachers/Parents (Conditional)
9. **If PARENT Role**
   - Child progress snapshots (linked students)
   - Recent alerts triggered
   - Quick action: "Set new alert for Maya"

10. **If TUTOR Role**
    - Upcoming bookings (next 3–5 sessions)
    - Recent reviews from students (rating, comment)
    - Earnings this month
    - Pending tutor applications (if admin)

#### Quick Access Shortcuts
11. **Action Buttons**
    - "Browse Courses" → Course catalog
    - "Start Quiz" → Recommended quiz
    - "Book a Tutor" → Tutor marketplace
    - "Chat with AI" → AI Tutor
    - "View Study Plan" → Active plan details

#### Call-to-Actions
12. **Upgrade Prompts** (Non-intrusive)
    - "Upgrade to PRO to unlock unlimited tutor bookings"
    - Show as banner ONLY if on Free tier and have taken meaningful action

---

## 6. QUERY PATTERNS FOR HOMEPAGE

### For Public Homepage
```sql
-- Featured courses (by enrollment)
SELECT id, title, subject, difficulty, thumbnail, enrollmentCount
FROM courses
WHERE isPublished = true
ORDER BY enrollmentCount DESC
LIMIT 6;

-- Popular subjects
SELECT id, name, icon, color, COUNT(DISTINCT topics) as topicCount
FROM subjects
GROUP BY id
HAVING COUNT(DISTINCT topics) > 0
ORDER BY topicCount DESC
LIMIT 6;

-- Exam statistics
SELECT examCategory, COUNT(*) as questionCount, MAX(year) as latestYear
FROM questions
WHERE examCategory IS NOT NULL
GROUP BY examCategory
ORDER BY questionCount DESC;

-- Featured tutors (high-rated + verified)
SELECT userId, rating, totalReviews, hourlyRate, specializations
FROM tutor_profiles
WHERE isVerified = true
ORDER BY rating DESC, totalReviews DESC
LIMIT 6;
```

### For Authenticated User Dashboard
```sql
-- Student weak areas
SELECT t.name, tm.accuracyPercent, tm.masteryLevel
FROM topic_mastery tm
JOIN topics t ON tm.topicId = t.id
WHERE tm.userId = $userId AND tm.accuracyPercent < 70
ORDER BY tm.lastAttemptAt DESC;

-- Flashcards due for review
SELECT COUNT(*) as dueCount
FROM flashcard_reviews
WHERE userId = $userId AND nextReviewAt <= NOW();

-- Study streak & XP
SELECT studyStreakDays, longestStreak, totalXp, weeklyGoalMins
FROM student_profiles
WHERE userId = $userId;

-- Leaderboard position
SELECT rank, score, subject
FROM leaderboard_entries
WHERE userId = $userId AND period = 'weekly'
ORDER BY score DESC;

-- Recent activity
SELECT type, title, body, createdAt
FROM notifications
WHERE userId = $userId AND isRead = false
ORDER BY createdAt DESC
LIMIT 10;
```

---

## 7. DATA MODEL INSIGHTS FOR FRONTEND

### Key Business Metrics to Track
- **Engagement**: study_sessions per user, streak data
- **Retention**: lastLoginAt, currentPeriodEnd (subscription)
- **Learning Outcomes**: TopicMastery, quizAttempt pass rates
- **Revenue**: Payment.status, Subscription.tier distribution, TutorEarning splits
- **Quality**: ContentReport resolution time, TutorReview ratings, CourseReview ratings

### Real-Time Features Enabled by Schema
- **Websocket-ready**: LiveClass bookings, notifications, leaderboard updates
- **Batch Processing**: Email digests from NotificationPreference settings
- **Background Jobs**: Exam auto-submit (ExamSimulation), flashcard interval calculations, referral conversion tracking
- **Caching Candidates**: Subject/Topic hierarchies, popular courses, leaderboard snapshots

### Schema Strengths
✅ Comprehensive role-based access control (RBAC) via Role enum
✅ Multi-currency support (NGN, etc.)
✅ Flexible payment provider integration (Stripe, Paystack, Flutterwave)
✅ AI-first design (AI tutoring, auto-generated analysis, transcripts)
✅ Scalable spaced repetition (SM-2 algorithm fields)
✅ B2B multi-tenancy via School + SchoolLicense
✅ Detailed audit trail for compliance
✅ Notification preference matrix for user control

### Potential Performance Considerations
⚠️ Large JSON fields (availabilitySlots, bankDetails, messages, questionSnapshot) – consider separate tables if queries become slow
⚠️ Leaderboard queries at scale – pre-compute and cache, consider materialized views
⚠️ Exam simulation with large question snapshots – pagination or Redis caching
⚠️ Study session heatmaps – archive old sessions or use data warehouse pattern

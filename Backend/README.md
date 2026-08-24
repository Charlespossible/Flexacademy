# 🎓 FlexAcademy Backend

> **Africa's AI-Powered Learning Ecosystem — Exam Intelligence · Tech Education · Human Tutors · Community**
> *One platform to pass your exams, build your tech career, and join Africa's learning revolution.*
> **Stack: Node.js 20 · TypeScript · Express · PostgreSQL · Prisma · Redis · Claude AI**

---

## 🌍 Product Vision

FlexAcademy is a **next-generation EdTech super-platform** built for Africa — starting with Nigeria. It serves two complementary audiences on a single, unified platform:

**🎯 The Exam Candidate** — SS1–SS3 students and university hopefuls preparing for WAEC, JAMB, NECO, GCE, IGCSE, SAT, IELTS, and GMAT. AI tutoring, past questions, timed simulations, and adaptive study plans.

**💻 The Tech Learner** — Students, graduates, and career-switchers who want to break into technology — through structured courses, hands-on bootcamps, and live community events in Programming, AI, Cybersecurity, UI/UX, Blockchain, and more.

Both audiences are served by the same AI engine, the same gamification system, the same human tutor marketplace, and the same community infrastructure — making FlexAcademy far more than a revision tool. It is the launchpad for Africa's next generation of educated, skilled, and employable talent.

---

## 🌍 Product Mission

 FlexAcademy exists to close two gaps that hold Africa back: the exam preparation gap that determines who gets into university, and the skills gap that determines who gets a tech career: 

 **🎯 Mission Details**  — Every feature we build serves one or both of these goals. The student who uses FlexAcademy to pass JAMB today should be able to use the same platform to learn Python, attend a bootcamp, build a portfolio, and get hired — without ever leaving the ecosystem.
Africa does not lack talent. It lacks accessible, affordable, and intelligent infrastructure for developing that talent. FlexAcademy is that infrastructure.


## 🆚 Where uLesson, Tuteria & Udemy Fall Short

| Gap | FlexAcademy's Answer |
|-----|---------------------|
| Static video content only | AI-adaptive content + live instruction + on-demand practice |
| Generic quiz banks | AI-curated questions built around each student's weakness pattern |
| Human tutors only (Tuteria) | 24/7 AI tutor + verified human tutor marketplace |
| No personalisation engine | Adaptive study paths powered by real performance data |
| Basic progress tracking | Deep AI analytics — weak areas, readiness scores, national benchmarks |
| No parent visibility | Real-time parent dashboard + weekly AI report cards |
| App-only experience (uLesson) | PWA + Mobile + Web + WhatsApp bot |
| No exam prep (Udemy) | Deep WAEC/JAMB/NECO intelligence baked into every feature |
| No live community layer | Bootcamps, webinars, hackathons, and tech meetups |
| Global, not African-contextualised | Built for Nigeria first — local examples, local pricing, local exams |

---

## 🏛️ Platform Pillars

FlexAcademy is structured around four reinforcing pillars:

```
┌─────────────────────────────────────────────────────────────────┐
│                       FLEXACADEMY                               │
├─────────────────┬──────────────────┬──────────────┬────────────┤
│  📚 EXAM PREP   │  💻 TECH TRACKS  │  🧑‍🏫 TUTORS  │ 🌐 COMMUNITY│
│                 │                  │              │            │
│ WAEC · JAMB     │ Programming      │ Human 1-to-1 │ Bootcamps  │
│ NECO · GCE      │ AI & ML          │ AI FlexBot   │ Webinars   │
│ IGCSE · SAT     │ Cybersecurity    │ Marketplace  │ Meetups    │
│ IELTS · GMAT    │ UI/UX Design     │ Reviews      │ Hackathons │
│                 │ Graphic Design   │ Scheduling   │ Forums     │
│ Past Questions  │ Blockchain       │ Payments     │ Cohorts    │
│ AI Tutor        │ Cryptocurrency   │              │            │
│ Exam Simulation │ Automation       │              │            │
│ Study Plans     │ Cloud & DevOps   │              │            │
└─────────────────┴──────────────────┴──────────────┴────────────┘
```

---

## 🚀 Core Features — AI-First

### 1. 🤖 FlexBot — AI Tutor (24/7, All Tracks)
- Powered by **Claude (Anthropic)** for nuanced, context-aware explanations
- Works across **both exam prep and tech learning** — explains WAEC Chemistry AND explains how recursion works in Python
- Streaming responses via **Server-Sent Events (SSE)** for a real-time tutoring feel
- Maintains full conversation context per session (persisted in PostgreSQL)
- Generates on-demand practice questions with step-by-step solutions
- **Exam-contextualised**: aware of WAEC marking schemes, JAMB syllabuses, and exam-year patterns
- **Tech-contextualised**: code review mode, debugging assistance, project feedback

### 2. 🧠 Adaptive Learning Engine
- Tracks per-topic accuracy across quizzes, assignments, and exams
- Dynamically adjusts question difficulty and recommended content based on performance
- Identifies knowledge gaps from wrong answers and time-per-question patterns
- Builds personalised study plans per student profile and target exam/track
- Spaced repetition (SM-2 algorithm) for flashcard and concept review
- Separate learning models for exam preparation vs. tech skill acquisition

### 3. 💻 Tech Learning Tracks
Structured, project-based courses across eight in-demand technology disciplines:

| Track | What You'll Build | Career Outcome |
|-------|-------------------|----------------|
| **Programming Fundamentals** | Calculator → Todo App → REST API | Junior Developer |
| **Web Development** | HTML/CSS → React → Full-Stack | Frontend / Full-Stack Developer |
| **Artificial Intelligence & ML** | Chatbots → Image classifiers → AI apps | AI Engineer / Data Scientist |
| **Cybersecurity** | CTF challenges → Penetration testing labs → Security audit | Security Analyst |
| **UI/UX Design** | Wireframes → Figma prototypes → User research | Product Designer |
| **Graphic Design** | Branding → Poster design → Social media kits | Graphic Designer |
| **Blockchain & Web3** | Smart contracts → NFT projects → DApps | Blockchain Developer |
| **Automation & DevOps** | CI/CD pipelines → Web scraping → Process automation | DevOps / Automation Engineer |

Each track includes:
- Video lessons + interactive coding exercises (in-browser)
- AI-reviewed project submissions with personalised feedback from FlexBot
- Verified completion certificates (publicly verifiable via credential ID)
- Curated job board connections upon certification

### 4. 📚 Exam Intelligence Engine
- Curated bank of past examination questions: **WAEC (1990–2024), JAMB (2000–2024), NECO, GCE**
- Every question: verified, topic-tagged, year-tagged, difficulty-rated, AI-explained
- Filter by exam type, subject, year, and difficulty
- **Timed Exam Simulation** — server-enforced countdown, auto-submission, instant scoring
- AI-generated performance analysis after every attempt
- "What would I score today?" readiness predictor per exam category

### 5. 🌐 FlexAcademy Community & Events
The community layer transforms FlexAcademy from a learning tool into a movement:

#### Online Bootcamps
- Intensive 4–12 week cohort-based programmes in high-demand tech skills
- Cohorts of 30–100 students with a lead instructor + AI assistant + peer community
- Live sessions, asynchronous lessons, group projects, and capstone presentations
- Bootcamp graduation = verified certificate + alumni network access
- Hosted entirely on the platform — registration, scheduling, video, payments, certificates

#### Webinars & Tech Talks
- Weekly/monthly live sessions on trending topics: AI in Africa, Web3, career paths, cybersecurity threats
- Guest speakers: Nigerian and pan-African tech professionals, founders, and engineers
- Recorded and searchable post-event
- Open to FREE tier users — primary top-of-funnel acquisition driver

#### Tech Meetups (Virtual)
- Regular community meetups for peer learning, project showcases, and networking
- Study groups that form organically around shared tracks or exam targets
- Regional chapters: Lagos, Abuja, Port Harcourt, Ibadan, Kano, and diaspora

#### Hackathons & Challenges
- Platform-hosted hackathons (solo and team) with real prizes
- Monthly "FlexChallenge" coding competition with leaderboard
- Integration with employer partners who scout hackathon top performers

### 6. 🧑‍🏫 Hybrid Tutor Marketplace
- Browse and book verified human tutors for 1-to-1 sessions
- Tutors cover both **exam subjects** (Maths, English, Physics, Chemistry, Biology, etc.) and **tech skills** (Python, React, Figma, etc.)
- Tutor application → admin review → approval → live on marketplace
- Full session management: scheduling, payment, video link, notes, post-session review
- Tutor earnings dashboard + withdrawal management

### 7. 📊 AI Performance Analytics
- After every quiz or assignment: AI-generated breakdown of weak areas with specific revision recommendations
- **Exam Readiness Score** — "You are 73% WAEC-ready. Focus on Organic Chemistry and Statistics."
- **Career Readiness Score** for tech tracks — "Your JavaScript fundamentals are strong. Next: async/await and API integration."
- Weekly AI-written progress reports delivered to students AND parents
- Benchmarking against national averages (anonymised, aggregated)
- Parent dashboard with child activity, streak, scores, and AI-generated weekly report card

### 8. 🎮 Gamification Engine
- XP points, badges, and levelling across both exam prep and tech tracks
- Daily/weekly/monthly leaderboards per subject, track, region, and national rank
- Study streak rewards and consistency bonuses
- Challenge mode: compete with peers or attempt to beat the AI
- Special bootcamp cohort leaderboards during live programmes
- Achievement badges: "WAEC Warrior", "Python Pioneer", "30-Day Streak", "Hackathon Hero"

### 9. 📱 WhatsApp Study Bot *(Phase 2)*
- Practice questions, flashcards, and FlexBot explanations delivered via WhatsApp
- Daily "Question of the Day" — exam or tech track, user-selectable
- Bootcamp reminders, event notifications, and assignment nudges
- Zero app download required — maximum reach in Nigeria's WhatsApp-first market

### 10. 🎥 Live Classes + AI Moderation *(Phase 2)*
- Tutors and instructors host live video sessions on the platform
- AI auto-generates session notes from real-time transcription (Whisper API)
- Recorded sessions with AI-generated chapter markers, summaries, and quiz questions
- Chat moderation and Q&A aggregation during large webinars/bootcamps

### 11. 👨‍👩‍👧 Parent Dashboard
- Link parent account to one or more student accounts
- View study activity, session times, quiz scores, and daily streaks
- Set custom alerts: inactivity threshold, minimum score warnings
- Receive weekly AI-generated report cards via email and in-app notification
- Full visibility without interfering with student's study experience

### 12. 🏫 School & Institution Layer *(B2B, Year 3+)*
- Bulk student enrolment via CSV or email list
- School-scoped leaderboards and analytics dashboard
- Track school-wide WAEC/JAMB readiness in aggregate
- Annual per-seat licensing for private schools, tutorial centres, and polytechnic prep centres
- School Admin role with class management and progress reporting

---

## 🛠️ Tech Stack

### Core Runtime
| Tool | Purpose |
|------|---------|
| **Node.js 20 LTS** | Runtime |
| **TypeScript 5.4** | Strict type safety across the entire codebase |
| **Express.js** | HTTP framework |
| **PostgreSQL 16** | Primary relational database |
| **Prisma ORM v5** | Type-safe DB access, migrations, Prisma Studio |
| **Redis (ioredis)** | Caching, rate limit state, session storage |

### AI & Intelligence
| Tool | Purpose |
|------|---------|
| **Anthropic Claude API** | FlexBot — AI tutor, code reviewer, content generation, performance analysis |
| **OpenAI API** | Embeddings for semantic search, Whisper for live class transcription (Phase 2) |
| **Bull + Redis** | Background AI job queue (analysis reports, email digests, exam auto-submit) |

### Auth & Security
| Tool | Purpose |
|------|---------|
| **jsonwebtoken** | Stateless JWT access + refresh token auth |
| **Passport.js** | JWT strategy + Google OAuth 2.0 |
| **bcryptjs** | Password hashing (cost factor 12) |
| **Helmet** | HTTP security headers |
| **express-rate-limit** | Per-route rate limiting (global, auth, AI-specific) |
| **Zod** | Runtime request validation with inferred TypeScript types |

### Payments
| Tool | Purpose |
|------|---------|
| **Paystack** | Primary Nigerian payment gateway (card, bank transfer, USSD) |
| **Stripe** | International card payments (diaspora users) |
| **Flutterwave** | Pan-African expansion payments (Ghana, Kenya, etc.) |

### Dev Productivity
| Tool | Why It Makes You Fast |
|------|-----------------------|
| **tsx** | Run `.ts` files directly — no compile step in dev |
| **tsx watch** | Hot reload for TypeScript (replaces ts-node-dev) |
| **Prisma Studio** | Visual DB explorer — `npx prisma studio` |
| **pino + pino-pretty** | Structured logging, 5× faster than Winston |
| **express-async-errors** | No try/catch boilerplate in controllers |
| **http-status-codes** | `StatusCodes.OK` not magic numbers |
| **swagger-jsdoc** | API docs auto-generated from JSDoc comments |
| **Faker.js** | Realistic seed data in seconds |
| **ts-jest** | Jest with native TypeScript support |

---

## 📁 Project Structure

```
flexacademy/
├── prisma/
│   ├── schema.prisma              # Full DB schema (52 models, all typed via Prisma)
│   ├── seed.ts                    # TypeScript seed — subjects, users, questions, badges, bootcamps
│   └── migrations/
│
├── src/
│   ├── server.ts                  # Entry point, graceful shutdown, startup checks
│   ├── app.ts                     # Express app, middleware stack, all 25 routes wired
│   │
│   ├── types/
│   │   └── index.ts               # Global types: Express augmentation, JWT, all request bodies
│   │
│   ├── config/
│   │   ├── database.ts            # Prisma singleton + slow query logging
│   │   ├── redis.ts               # Redis client + typed cache helpers
│   │   ├── passport.ts            # JWT + Google OAuth strategies
│   │   └── swagger.ts             # OpenAPI 3.0 Swagger config
│   │
│   ├── controllers/               # Thin request handlers — no business logic
│   │   ├── auth.controller.ts
│   │   ├── aiTutor.controller.ts  ← Claude streaming + question gen + analysis
│   │   ├── quiz.controller.ts
│   │   └── ...
│   │
│   ├── services/                  # Business logic layer (pure functions where possible)
│   │   ├── email.service.ts
│   │   ├── gamification.service.ts
│   │   ├── analytics.service.ts
│   │   ├── payment.service.ts
│   │   ├── spacedRepetition.service.ts   ← SM-2 algorithm
│   │   ├── examSimulation.service.ts
│   │   ├── studyPlan.service.ts
│   │   ├── notification.service.ts
│   │   └── referral.service.ts
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts     # authenticate, requireRoles, requireVerifiedEmail
│   │   ├── errorHandler.ts        # Typed Prisma + Zod + ApiError mapping
│   │   ├── rateLimiter.ts         # Global, auth, AI-specific rate limits
│   │   ├── validate.ts            # Generic Zod schema validator
│   │   └── notFound.ts
│   │
│   ├── routes/                    # One file per resource, full Swagger JSDoc
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── subject.routes.ts
│   │   ├── course.routes.ts
│   │   ├── lesson.routes.ts
│   │   ├── question.routes.ts
│   │   ├── quiz.routes.ts
│   │   ├── aiTutor.routes.ts
│   │   ├── examSimulation.routes.ts   ← NEW
│   │   ├── studyPlan.routes.ts        ← NEW
│   │   ├── flashcard.routes.ts        ← NEW
│   │   ├── progress.routes.ts
│   │   ├── subscription.routes.ts
│   │   ├── leaderboard.routes.ts
│   │   ├── liveClass.routes.ts
│   │   ├── notification.routes.ts
│   │   ├── tutor.routes.ts            ← NEW
│   │   ├── booking.routes.ts          ← NEW
│   │   ├── parent.routes.ts           ← NEW
│   │   ├── school.routes.ts           ← NEW
│   │   ├── search.routes.ts           ← NEW
│   │   ├── certificate.routes.ts      ← NEW
│   │   ├── referral.routes.ts         ← NEW
│   │   ├── admin.routes.ts
│   │   └── webhook.routes.ts
│   │
│   ├── validators/
│   │   └── index.ts               # 22 Zod schemas + inferred TypeScript types
│   │
│   ├── jobs/                      # Bull queue workers
│   │   ├── queue.ts
│   │   ├── email.job.ts
│   │   ├── aiAnalysis.job.ts
│   │   ├── examAutoSubmit.job.ts  ← NEW: auto-submits timed exams on expiry
│   │   └── parentReport.job.ts   ← NEW: weekly AI report cards for parents
│   │
│   └── utils/
│       ├── ApiResponse.ts         # Typed success/error response wrappers
│       ├── tokens.ts              # JWT generate/verify with full types
│       ├── logger.ts              # Pino structured logger
│       └── validateEnv.ts         # Startup environment variable guard
│
├── tests/
│   ├── unit/
│   ├── integration/               # Supertest API tests
│   └── e2e/
│
├── tsconfig.json                  # Strict TS config with path aliases
├── package.json
├── .env.example
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16
- Redis 7 (or Memurai on Windows)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Fill in: DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, ANTHROPIC_API_KEY

# 3. Database setup
npx prisma migrate dev --name init
npx prisma generate

# 4. Seed with sample data
npm run prisma:seed

# 5. Start development server (TypeScript, hot reload)
npm run dev
# → API:     http://localhost:5000
# → Swagger: http://localhost:5000/api/v1/docs
# → DB GUI:  npx prisma studio
```

### Other Commands

```bash
npm run typecheck        # Type-check without compiling
npm run build            # Compile TypeScript to dist/
npm run lint             # ESLint with TypeScript rules
npm test                 # Jest with ts-jest
npm run test:coverage    # Coverage report
npm run validate:env     # Check all required env vars are present
```

---

## 🗺️ Full API Reference

### Authentication
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/verify-email/:token
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
GET    /api/v1/auth/google
GET    /api/v1/auth/google/callback
```

### Users & Profile
```
GET    /api/v1/users/me
PATCH  /api/v1/users/me
POST   /api/v1/users/me/avatar
GET    /api/v1/users/me/dashboard
GET    /api/v1/users/me/badges
GET    /api/v1/users/me/streak
GET    /api/v1/users/me/activity
GET    /api/v1/users/me/certificates
GET    /api/v1/users/me/bookmarks
DELETE /api/v1/users/me/bookmarks/:lessonId
```

### AI Tutor (FlexBot)
```
POST   /api/v1/ai-tutor/chat               ← SSE streaming — exam prep & tech Q&A
POST   /api/v1/ai-tutor/generate-questions ← custom practice questions per topic
GET    /api/v1/ai-tutor/analyze            ← AI performance analysis
GET    /api/v1/ai-tutor/sessions           ← session history
```

### Content — Subjects, Courses & Lessons
```
GET    /api/v1/subjects
GET    /api/v1/courses?subject=&grade=&difficulty=&track=
POST   /api/v1/courses/:id/enroll
GET    /api/v1/courses/:id/review
POST   /api/v1/courses/:id/review
GET    /api/v1/lessons/:id
POST   /api/v1/lessons/:id/complete
POST   /api/v1/lessons/:id/bookmark
```

### Exam Questions & Past Papers
```
GET    /api/v1/questions?topicId=&examCategory=&year=&difficulty=
GET    /api/v1/questions/past?exam=WAEC&subject=Mathematics&year=2023
GET    /api/v1/questions/years?exam=JAMB&subject=Physics
POST   /api/v1/questions/:id/report
```

### Quizzes & Practice
```
GET    /api/v1/quizzes?subject=&exam=&year=
POST   /api/v1/quizzes/:id/start
POST   /api/v1/quizzes/attempts/:id/submit
GET    /api/v1/quizzes/attempts/:id/results
```

### Exam Simulation *(timed, server-enforced)*
```
POST   /api/v1/exams/simulate              ← start timed simulation
GET    /api/v1/exams/simulate/me           ← my simulation history
GET    /api/v1/exams/simulate/:id          ← running sim + seconds remaining
POST   /api/v1/exams/simulate/:id/submit   ← manual early submission
GET    /api/v1/exams/simulate/:id/results  ← full results + AI analysis
```

### Study Plans
```
GET    /api/v1/study-plans/me
POST   /api/v1/study-plans
POST   /api/v1/study-plans/generate        ← AI-generated plan from weak areas + target date
GET    /api/v1/study-plans/:id/items
PATCH  /api/v1/study-plans/items/:id/complete
PATCH  /api/v1/study-plans/:id
DELETE /api/v1/study-plans/:id
```

### Flashcards *(SM-2 Spaced Repetition)*
```
GET    /api/v1/flashcards/due              ← cards due for review today
GET    /api/v1/flashcards/decks/me
POST   /api/v1/flashcards/decks
GET    /api/v1/flashcards/decks/:id
PATCH  /api/v1/flashcards/decks/:id
DELETE /api/v1/flashcards/decks/:id
GET    /api/v1/flashcards/decks/:id/cards
POST   /api/v1/flashcards/decks/:id/cards
PATCH  /api/v1/flashcards/:id
DELETE /api/v1/flashcards/:id
POST   /api/v1/flashcards/:id/review       ← AGAIN | HARD | GOOD | EASY
```

### Progress & Analytics
```
GET    /api/v1/progress/me
GET    /api/v1/progress/me/subjects
GET    /api/v1/progress/me/topics?subjectId=
GET    /api/v1/progress/me/weak-areas
GET    /api/v1/progress/me/exam-readiness
GET    /api/v1/progress/me/timeline?days=30
GET    /api/v1/progress/me/heatmap?year=
GET    /api/v1/progress/me/comparisons
GET    /api/v1/progress/courses/:courseId
```

### Subscriptions & Payments
```
GET    /api/v1/subscriptions/me
POST   /api/v1/subscriptions/checkout
POST   /api/v1/subscriptions/verify
POST   /api/v1/subscriptions/cancel
GET    /api/v1/subscriptions/history
POST   /api/v1/subscriptions/promo/validate
```

### Leaderboard
```
GET    /api/v1/leaderboard?period=weekly&subject=
GET    /api/v1/leaderboard/me
```

### Tutor Marketplace
```
GET    /api/v1/tutors                      ← browse tutors (public)
GET    /api/v1/tutors/:id                  ← tutor profile (public)
GET    /api/v1/tutors/:id/availability
GET    /api/v1/tutors/:id/reviews
POST   /api/v1/tutors/apply
PATCH  /api/v1/tutors/me
PATCH  /api/v1/tutors/me/availability
GET    /api/v1/tutors/me/sessions
GET    /api/v1/tutors/me/earnings
```

### Bookings
```
POST   /api/v1/bookings
GET    /api/v1/bookings/me
GET    /api/v1/bookings/:id
PATCH  /api/v1/bookings/:id/cancel
PATCH  /api/v1/bookings/:id/reschedule
POST   /api/v1/bookings/:id/review
```

### Live Classes & Events
```
GET    /api/v1/live-classes
GET    /api/v1/live-classes/upcoming
POST   /api/v1/live-classes/:id/register
GET    /api/v1/live-classes/:id
```

### Bootcamps & Community Events *(Phase 2)*
```
GET    /api/v1/bootcamps                   ← all open bootcamps
GET    /api/v1/bootcamps/:id               ← bootcamp detail + syllabus
POST   /api/v1/bootcamps/:id/enroll        ← enroll + payment
GET    /api/v1/bootcamps/me                ← my enrolled bootcamps
GET    /api/v1/bootcamps/:id/cohort        ← cohort members + leaderboard
GET    /api/v1/events                      ← webinars, meetups, hackathons
POST   /api/v1/events/:id/register
GET    /api/v1/events/:id/recordings       ← past event recordings
POST   /api/v1/hackathons/:id/submit       ← hackathon project submission
GET    /api/v1/hackathons/:id/leaderboard
```

### Parent Dashboard
```
POST   /api/v1/parent/link-child
GET    /api/v1/parent/children
GET    /api/v1/parent/children/:id/progress
GET    /api/v1/parent/children/:id/activity
GET    /api/v1/parent/children/:id/streak
GET    /api/v1/parent/reports/weekly
GET    /api/v1/parent/alerts
PATCH  /api/v1/parent/alerts/settings
```

### Schools & Institutions *(B2B)*
```
POST   /api/v1/schools/register
GET    /api/v1/schools/:id
GET    /api/v1/schools/:id/students
POST   /api/v1/schools/:id/bulk-enroll
GET    /api/v1/schools/:id/analytics
GET    /api/v1/schools/:id/leaderboard
POST   /api/v1/schools/licenses/purchase
```

### Certificates
```
GET    /api/v1/certificates/me
GET    /api/v1/certificates/verify/:credentialId   ← public employer verification
```

### Search
```
GET    /api/v1/search?q=&type=course|lesson|question|topic|all
```

### Referrals
```
GET    /api/v1/referrals/me/code
GET    /api/v1/referrals/me/stats
```

### Notifications
```
GET    /api/v1/notifications/me
PATCH  /api/v1/notifications/:id/read
POST   /api/v1/notifications/read-all
DELETE /api/v1/notifications/:id
GET    /api/v1/notifications/preferences
PATCH  /api/v1/notifications/preferences
POST   /api/v1/notifications/push/subscribe
DELETE /api/v1/notifications/push/subscribe
```

### Admin
```
GET    /api/v1/admin/stats
GET    /api/v1/admin/analytics/dau
GET    /api/v1/admin/analytics/retention
GET    /api/v1/admin/analytics/top-subjects
GET    /api/v1/admin/analytics/ai-usage
GET    /api/v1/admin/analytics/revenue
GET    /api/v1/admin/users
PATCH  /api/v1/admin/users/:id/role
POST   /api/v1/admin/users/:id/suspend
POST   /api/v1/admin/users/:id/impersonate
GET    /api/v1/admin/tutors/applications
PATCH  /api/v1/admin/tutors/:id/approve
POST   /api/v1/admin/tutors/:id/suspend
GET    /api/v1/admin/questions/flagged
PATCH  /api/v1/admin/questions/:id/verify
POST   /api/v1/admin/questions/bulk-import
POST   /api/v1/admin/courses
PATCH  /api/v1/admin/courses/:id/publish
GET    /api/v1/admin/announcements
POST   /api/v1/admin/announcements
PATCH  /api/v1/admin/announcements/:id/publish
```

### Webhooks
```
POST   /api/v1/webhooks/paystack
POST   /api/v1/webhooks/stripe
POST   /api/v1/webhooks/flutterwave
```

---

## 💰 Subscription Tiers

| Tier | Monthly Price | Key Access |
|------|--------------|------------|
| **FREE** | ₦0 | 10 AI chats/day, 50 past questions, basic quiz, leaderboard, 1 community event/month |
| **BASIC** | ₦1,500 | Unlimited past questions, unlimited AI, study plans, flashcards, all webinars |
| **PRO** | ₦3,000 | Everything + exam simulation, parent dashboard, tech track courses, certificates |
| **ELITE** | ₦5,000 | Everything PRO + 2 human tutor sessions/month, bootcamp discounts, priority support |
| **School License** | ₦150K–₦800K/yr | PRO for all enrolled students + school analytics + dedicated support |

---

## 🔮 Phased Roadmap

### ✅ Phase 1 — Foundation *(Live)*
- [x] AI Tutor (FlexBot) with SSE streaming
- [x] Past questions bank (WAEC, JAMB, NECO, GCE)
- [x] Timed exam simulation with server-side auto-submit
- [x] Adaptive study plans (manual + AI-generated)
- [x] Spaced repetition flashcards (SM-2)
- [x] Human tutor marketplace (apply, browse, book, review)
- [x] Progress analytics (topics, heatmap, readiness, benchmarks)
- [x] Parent dashboard + weekly AI report cards
- [x] Gamification engine (XP, badges, streaks, leaderboards)
- [x] Referral programme
- [x] School/institution B2B licensing
- [x] Verified completion certificates
- [x] Paystack + Stripe + Flutterwave payments

### 🔄 Phase 2 — Community & Tech Tracks *(In Progress)*
- [ ] Tech learning tracks (8 disciplines — Programming through Blockchain)
- [ ] Online bootcamp infrastructure (cohorts, scheduling, group chat, certificates)
- [ ] Webinars & virtual tech meetup events system
- [ ] Hackathon & challenge hosting module
- [ ] WhatsApp Study Bot (Meta Cloud API)
- [ ] AI-generated lesson summaries from uploaded PDFs
- [ ] Offline mode (Service Worker + IndexedDB sync)
- [ ] Live class video integration (AI transcription + chapter markers)
- [ ] In-browser code execution environment (tech track exercises)
- [ ] Alumni network + job board integrations

### 🔭 Phase 3 — Scale & Expansion *(2027)*
- [ ] React Native mobile app (iOS + Android)
- [ ] West Africa expansion: Ghana (WASSCE), Kenya (KCSE), Cameroon
- [ ] IGCSE, SAT, IELTS, and GMAT full track expansion
- [ ] AI proctoring for certified exams
- [ ] Corporate training partnerships (B2B2E)
- [ ] Employer partnership portal (hiring from FlexAcademy certified graduates)
- [ ] Multi-language support (Hausa, Yoruba, Igbo, French)

---

## 🧾 Seed Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@flexacademy.com | Admin@1234 |
| Demo Student | demo@flexacademy.com | Student@1234 |
| Demo Tutor | tutor@flexacademy.com | Tutor@1234 |
| Demo Parent | parent@flexacademy.com | Parent@1234 |

---

## 🌍 Our Mission

> **FlexAcademy exists to close two gaps that hold Africa back: the exam preparation gap that determines who gets into university, and the skills gap that determines who gets a tech career.**

Every feature we build serves one or both of these goals. The student who uses FlexAcademy to pass JAMB today should be able to use the same platform to learn Python, attend a bootcamp, build a portfolio, and get hired — without ever leaving the ecosystem.

Africa does not lack talent. It lacks accessible, affordable, and intelligent infrastructure for developing that talent. FlexAcademy is that infrastructure.

---

## 📜 License
MIT — FlexAcademy © 2026

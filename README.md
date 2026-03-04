# 🎓 FlexAcademy Backend

> **The AI-Powered Learning & Exam Practice Platform for African Students**
> *Built to beat uLesson and Tuteria with modern, intelligent technology.*
> **Stack: Node.js 20 · TypeScript · Express · PostgreSQL · Prisma · Redis · Claude AI**

---

## 🌍 Product Vision

FlexAcademy is a **next-generation EdTech platform** targeting students from Primary through tertiary level across Africa — with a primary focus on Nigerian curricula (WAEC, JAMB, NECO, GCE) while expanding to IGCSE, SAT, IELTS, and GMAT.

### Where uLesson & Tuteria Fall Short

| Gap | FlexAcademy's Answer |
|-----|---------------------|
| Static video content | AI-generated, adaptive content per student |
| Generic quiz banks | AI-curated questions based on real weakness patterns |
| Human tutors only (Tuteria) | 24/7 AI tutor + human tutor marketplace hybrid |
| No personalization engine | Adaptive learning paths using student data |
| Basic progress tracking | Deep AI performance analytics with actionable insight |
| No parent dashboard | Real-time parent monitoring & alerts |
| App-only (uLesson) | PWA + Mobile + Web + WhatsApp bot integration |

---

## 🚀 FlexAcademy's Competitive Edge — AI-First Features

### 1. 🤖 FlexBot — AI Tutor (24/7)
- Powered by **Claude (Anthropic)** for nuanced, exam-focused explanations
- Streaming responses via **Server-Sent Events (SSE)** for real-time feel
- Maintains conversation context per session (persisted in PostgreSQL)
- Generates custom practice questions on demand with full explanations
- Contextualised for Nigerian students — relatable examples, exam-aware

### 2. 🧠 Adaptive Learning Engine
- Tracks per-topic performance and adjusts difficulty dynamically
- Identifies knowledge gaps from wrong answers across quiz attempts
- Builds personalised study plans per student profile
- Spaced repetition algorithm for flashcard review

### 3. 📊 AI Performance Analytics
- After each quiz: AI-generated analysis of weak areas with recommendations
- Weekly AI-written progress reports for students AND parents
- Predicts exam readiness score (e.g. "75% WAEC ready")
- Benchmarks performance against national averages

### 4. 🎮 Gamification Engine
- XP points, badges, streaks, and levelling system
- Daily/weekly/monthly leaderboards per subject and national rank
- Study streak rewards for consistency
- Challenge mode: compete with friends or beat the AI

### 5. 📱 WhatsApp Study Bot (Phase 2)
- Practice questions and explanations delivered via WhatsApp
- Daily "Question of the Day" — no app download required
- Massive reach: WhatsApp penetration > App Store in Nigeria

### 6. 🎥 Live Classes + AI Moderation (Phase 2)
- Tutors host live sessions via integrated video
- AI auto-generates class notes from transcription (Whisper API)
- Recorded sessions with AI chapter markers and summaries

### 7. 👨‍👩‍👧 Parent Dashboard (Phase 2)
- Real-time study tracking and low-activity alerts
- Weekly AI-written report cards via email/SMS

---

## 🛠️ Tech Stack

### Core
| Tool | Purpose |
|------|---------|
| **Node.js 20 LTS** | Runtime |
| **TypeScript 5** | Type safety across the entire codebase |
| **Express.js** | HTTP framework |
| **PostgreSQL 16** | Primary relational database |
| **Prisma ORM v5** | Type-safe DB access, migrations, Prisma Studio |
| **Redis (ioredis)** | Caching, rate limit state, token storage |

### AI & Intelligence
| Tool | Purpose |
|------|---------|
| **Anthropic Claude API** | FlexBot AI tutor, content generation, analysis |
| **OpenAI API** | Embeddings, Whisper transcription (Phase 2) |
| **Bull + Redis** | Background AI job queue |

### Auth & Security
| Tool | Purpose |
|------|---------|
| **jsonwebtoken** | Stateless JWT access + refresh token auth |
| **Passport.js** | JWT strategy + Google OAuth 2.0 |
| **bcryptjs** | Password hashing (cost 12) |
| **Helmet** | HTTP security headers |
| **express-rate-limit** | Per-route rate limiting |
| **Zod** | Runtime validation with inferred TypeScript types |

### Dev Productivity
| Tool | Why It Makes You Fast |
|------|-----------------------|
| **tsx** | Run `.ts` files directly — no compile step in dev |
| **tsx watch** | Hot reload for TypeScript (replaces ts-node-dev) |
| **Prisma Studio** | Visual DB explorer — `npx prisma studio` |
| **pino + pino-pretty** | Structured logging, 5x faster than Winston |
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
│   ├── schema.prisma              # Full DB schema (20+ models, all typed via Prisma)
│   ├── seed.ts                    # TypeScript seed — subjects, users, questions, badges
│   └── migrations/
│
├── src/
│   ├── server.ts                  # Entry point, graceful shutdown, startup checks
│   ├── app.ts                     # Express app, middleware stack, route wiring
│   │
│   ├── types/
│   │   └── index.ts               # Global types: Express augmentation, JWT, API shapes
│   │
│   ├── config/
│   │   ├── database.ts            # Prisma singleton + slow query logging
│   │   ├── redis.ts               # Redis client + typed cache helpers
│   │   ├── passport.ts            # JWT + Google OAuth strategies
│   │   └── swagger.ts             # OpenAPI/Swagger config
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
│   │   └── payment.service.ts
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts     # authenticate, requireRoles, requireVerifiedEmail
│   │   ├── errorHandler.ts        # Typed Prisma + Zod + ApiError mapping
│   │   ├── rateLimiter.ts         # Global, auth, AI-specific rate limits
│   │   ├── validate.ts            # Generic Zod schema validator
│   │   └── notFound.ts
│   │
│   ├── routes/                    # One file per resource, Swagger JSDoc annotated
│   │   ├── auth.routes.ts
│   │   ├── aiTutor.routes.ts
│   │   └── ...
│   │
│   ├── validators/
│   │   └── index.ts               # Zod schemas + inferred TypeScript types
│   │
│   ├── jobs/                      # Bull queue workers
│   │   ├── queue.ts
│   │   ├── email.job.ts
│   │   └── aiAnalysis.job.ts
│   │
│   └── utils/
│       ├── ApiResponse.ts         # Typed response wrappers
│       ├── tokens.ts              # JWT generate/verify with full types
│       ├── logger.ts              # Pino logger
│       └── validateEnv.ts         # Startup env guard
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
- Redis 7

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
# → http://localhost:5000
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
npm run validate:env     # Check required env vars
```

---

## 🗺️ API Routes (Phase 1)

### Auth
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

### AI Tutor (FlexBot)
```
POST   /api/v1/ai-tutor/chat               ← SSE streaming
POST   /api/v1/ai-tutor/generate-questions
GET    /api/v1/ai-tutor/analyze
GET    /api/v1/ai-tutor/sessions
```

### Content
```
GET    /api/v1/subjects
GET    /api/v1/courses?subject=&grade=&difficulty=
POST   /api/v1/courses/:id/enroll
GET    /api/v1/lessons/:id
POST   /api/v1/lessons/:id/complete
```

### Quizzes & Practice
```
GET    /api/v1/quizzes?subject=&exam=&year=
POST   /api/v1/quizzes/:id/start
POST   /api/v1/quizzes/attempts/:id/submit
GET    /api/v1/quizzes/attempts/:id/results
```

### Gamification
```
GET    /api/v1/leaderboard?period=weekly&subject=
GET    /api/v1/users/me/badges
GET    /api/v1/users/me/streak
GET    /api/v1/progress/me
```

---

## 🔮 Phase 2 Roadmap

- [ ] WhatsApp Study Bot (Meta Cloud API / Twilio)
- [ ] AI-generated lesson summaries from uploaded PDFs
- [ ] Adaptive quiz engine (real-time difficulty adjustment)
- [ ] Parent dashboard + weekly AI report cards
- [ ] Tutor marketplace with booking and payments
- [ ] Offline mode (Service Worker + local sync)
- [ ] National mock exam simulation (timed, proctored)
- [ ] School/institution B2B licensing module
- [ ] React Native mobile app

---

## 🧾 Seed Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@flexacademy.com | Admin@1234 |
| Demo Student | demo@flexacademy.com | Student@1234 |

---

## 📜 License
MIT — FlexAcademy © 2025

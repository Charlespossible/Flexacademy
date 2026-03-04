# 🎓 FlexAcademy Backend

> **The AI-Powered Learning & Exam Practice Platform for African Students**
> *Built to beat uLesson and Tuteria with modern, intelligent technology.*

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
- Streaming responses for real-time conversation feel
- Remembers conversation context per session
- Generates custom practice questions on demand
- Speaks to Nigerian student context (relatable examples, pidgin-friendly)

### 2. 🧠 Adaptive Learning Engine
- Tracks per-topic performance and adjusts difficulty dynamically
- Identifies knowledge gaps from wrong answers
- Builds personalized study plans per student
- Spaced repetition algorithm for flashcard review

### 3. 📊 AI Performance Analytics
- After each quiz: AI-generated analysis of weak areas
- Weekly AI-written progress reports for students AND parents
- Predicts exam readiness score (e.g. "75% WAEC ready")
- Compares performance against national averages

### 4. 🎮 Gamification Engine
- XP points, badges, streaks, and leveling system
- Daily/weekly leaderboards per subject and national rank
- Study streak rewards (motivates consistency)
- Challenge mode: compete with friends or the AI

### 5. 📱 WhatsApp Study Bot
- Students can practice questions and get explanations via WhatsApp
- Daily question of the day delivered via WA
- "Send me 5 WAEC Chemistry questions" — instant response
- Massive reach since WhatsApp penetration > App store in Nigeria

### 6. 🎥 Live Classes + AI Moderation
- Tutors can host live sessions via integrated video
- AI auto-generates class notes from video transcription (Whisper API)
- AI Q&A during sessions — students get instant answers alongside tutor
- Recorded sessions with AI-generated chapter markers and summaries

### 7. 👨‍👩‍👧 Parent Dashboard
- Real-time study time tracking
- Weekly AI-written report cards
- Low activity alerts via SMS/email
- Subscription management for families

---

## 🛠️ Backend Tech Stack

### Core
| Tool | Purpose | Why |
|------|---------|-----|
| **Node.js 20 LTS** | Runtime | Latest, fastest, native ESM |
| **Express.js** | HTTP Framework | Battle-tested, flexible |
| **PostgreSQL 16** | Primary Database | ACID, JSON support, full-text search |
| **Prisma ORM** | DB Access Layer | Type-safe, excellent DX, migrations |
| **Redis (ioredis)** | Caching + Rate Limiting + Sessions | Sub-ms reads |

### AI & Intelligence
| Tool | Purpose |
|------|---------|
| **Anthropic Claude API** | AI Tutor, content generation, analysis |
| **OpenAI API** | Embeddings, Whisper (audio transcription) |
| **Bull + Redis** | Background AI job queue |

### Auth & Security
| Tool | Purpose |
|------|---------|
| **JWT (jsonwebtoken)** | Stateless auth |
| **Passport.js** | OAuth strategies (Google) |
| **bcryptjs** | Password hashing |
| **Helmet** | HTTP security headers |
| **express-rate-limit** | DDoS protection |

### Payments
| Tool | Purpose |
|------|---------|
| **Stripe** | International cards |
| **Paystack** | Nigerian cards + Bank transfer |

### Communication
| Tool | Purpose |
|------|---------|
| **Nodemailer** | Transactional emails |
| **Socket.IO** | Real-time (live class, notifications) |
| **Twilio / Termii** | SMS, WhatsApp API |

### Dev Productivity (Lightning Fast)
| Tool | Why It Makes You Fast |
|------|-----------------------|
| **Prisma Studio** | Visual DB explorer — no SQL needed for inspection |
| **pino** | Structured logging, 5x faster than Winston |
| **express-async-errors** | Zero try-catch boilerplate in controllers |
| **Zod** | Runtime validation + TypeScript-like inference |
| **nodemon** | Auto-restart on file changes |
| **Faker.js** | Instant realistic seed data |
| **Jest + Supertest** | Fast, reliable API testing |
| **Swagger (swagger-jsdoc)** | Auto-generated Postman-compatible API docs |
| **http-status-codes** | No magic numbers — `StatusCodes.OK` not `200` |

---

## 📁 Project Structure

```
flexacademy/
├── prisma/
│   ├── schema.prisma          # Full DB schema (15+ models)
│   ├── seed.js                # Seed subjects, users, questions, badges
│   └── migrations/            # Auto-generated migration history
│
├── src/
│   ├── server.js              # Entry point, graceful shutdown
│   ├── app.js                 # Express app config, middleware, routes
│   │
│   ├── config/
│   │   ├── database.js        # Prisma singleton + slow query logging
│   │   ├── redis.js           # Redis client + cache helpers
│   │   ├── passport.js        # JWT + Google OAuth strategies
│   │   └── swagger.js         # Swagger/OpenAPI config
│   │
│   ├── controllers/           # Request handlers (thin, no business logic)
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── course.controller.js
│   │   ├── quiz.controller.js
│   │   ├── aiTutor.controller.js   ← Claude streaming AI tutor
│   │   ├── leaderboard.controller.js
│   │   └── admin.controller.js
│   │
│   ├── services/              # Business logic layer
│   │   ├── auth.service.js
│   │   ├── email.service.js
│   │   ├── ai.service.js      # Claude + OpenAI wrappers
│   │   ├── gamification.service.js  # XP, badges, streaks
│   │   ├── analytics.service.js
│   │   └── payment.service.js
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js  # authenticate, requireRoles
│   │   ├── rateLimiter.js
│   │   ├── errorHandler.js
│   │   ├── notFound.js
│   │   └── validate.js        # Zod request validation
│   │
│   ├── routes/                # One file per resource
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── subject.routes.js
│   │   ├── course.routes.js
│   │   ├── lesson.routes.js
│   │   ├── quiz.routes.js
│   │   ├── question.routes.js
│   │   ├── aiTutor.routes.js
│   │   ├── leaderboard.routes.js
│   │   ├── subscription.routes.js
│   │   ├── liveClass.routes.js
│   │   ├── notification.routes.js
│   │   ├── admin.routes.js
│   │   └── webhook.routes.js
│   │
│   ├── validators/            # Zod schemas for request validation
│   │   ├── auth.validator.js
│   │   ├── quiz.validator.js
│   │   └── question.validator.js
│   │
│   ├── jobs/                  # Bull queue workers
│   │   ├── queue.js           # Bull queue setup
│   │   ├── email.job.js
│   │   ├── aiAnalysis.job.js
│   │   └── leaderboard.job.js
│   │
│   └── utils/
│       ├── ApiResponse.js     # Standardized response wrapper
│       ├── ApiError.js        # Custom error class
│       ├── tokens.js          # JWT generate/verify
│       ├── logger.js          # Pino logger
│       └── validateEnv.js     # Env var guard on startup
│
├── tests/
│   ├── unit/                  # Service unit tests
│   ├── integration/           # API integration tests (Supertest)
│   └── e2e/                   # End-to-end flow tests
│
├── docs/                      # Additional documentation
├── .env.example               # All env vars documented
├── .gitignore
└── package.json
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16
- Redis 7

### Setup

```bash
# 1. Clone and install
git clone https://github.com/yourorg/flexacademy-backend
cd flexacademy-backend
npm install

# 2. Environment
cp .env.example .env
# Fill in your DATABASE_URL, JWT secrets, ANTHROPIC_API_KEY

# 3. Database
npx prisma migrate dev --name init
npx prisma generate
npm run prisma:seed

# 4. Start dev server
npm run dev
# → API running at http://localhost:5000
# → Swagger docs at http://localhost:5000/api/v1/docs
# → Prisma Studio: npx prisma studio
```

---

## 🗺️ API Endpoints (Phase 1)

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

### Content
```
GET    /api/v1/subjects
GET    /api/v1/courses?subject=&grade=&difficulty=
GET    /api/v1/courses/:id
POST   /api/v1/courses/:id/enroll
GET    /api/v1/lessons/:id
POST   /api/v1/lessons/:id/complete
```

### Quizzes
```
GET    /api/v1/quizzes?subject=&exam=&year=
POST   /api/v1/quizzes/:id/start
POST   /api/v1/quizzes/attempts/:attemptId/submit
GET    /api/v1/quizzes/attempts/:attemptId/results
```

### AI Tutor
```
POST   /api/v1/ai-tutor/chat           (streaming SSE)
POST   /api/v1/ai-tutor/generate-questions
GET    /api/v1/ai-tutor/analyze
GET    /api/v1/ai-tutor/sessions
```

### Progress & Gamification
```
GET    /api/v1/progress/me
GET    /api/v1/leaderboard?period=weekly&subject=
GET    /api/v1/users/me/badges
GET    /api/v1/users/me/streak
```

---

## 🔮 Phase 2 Roadmap

- [ ] WhatsApp Study Bot (Twilio / Meta Cloud API)
- [ ] AI-generated lesson summaries from uploaded PDFs
- [ ] Adaptive quiz engine (difficulty auto-adjusts mid-quiz)
- [ ] Parent dashboard with weekly AI reports
- [ ] Tutor marketplace with booking + payments
- [ ] Offline mode with service worker caching
- [ ] Exam countdown + personalized study plan generator
- [ ] National mock exam simulation (timed, proctored)
- [ ] School/institution B2B licensing module

---

## 📜 License
MIT — FlexAcademy © 2025

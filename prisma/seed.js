// prisma/seed.js — FlexAcademy seed data
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding FlexAcademy database...");

  // ─── Subjects ──────────────────────────────
  const subjects = await Promise.all([
    prisma.subject.upsert({
      where: { slug: "mathematics" },
      update: {},
      create: { name: "Mathematics", slug: "mathematics", color: "#2563EB", icon: "📐" },
    }),
    prisma.subject.upsert({
      where: { slug: "english-language" },
      update: {},
      create: { name: "English Language", slug: "english-language", color: "#16A34A", icon: "📚" },
    }),
    prisma.subject.upsert({
      where: { slug: "physics" },
      update: {},
      create: { name: "Physics", slug: "physics", color: "#9333EA", icon: "⚛️" },
    }),
    prisma.subject.upsert({
      where: { slug: "chemistry" },
      update: {},
      create: { name: "Chemistry", slug: "chemistry", color: "#EA580C", icon: "🧪" },
    }),
    prisma.subject.upsert({
      where: { slug: "biology" },
      update: {},
      create: { name: "Biology", slug: "biology", color: "#0D9488", icon: "🧬" },
    }),
    prisma.subject.upsert({
      where: { slug: "economics" },
      update: {},
      create: { name: "Economics", slug: "economics", color: "#CA8A04", icon: "📊" },
    }),
    prisma.subject.upsert({
      where: { slug: "government" },
      update: {},
      create: { name: "Government", slug: "government", color: "#DC2626", icon: "🏛️" },
    }),
    prisma.subject.upsert({
      where: { slug: "literature" },
      update: {},
      create: { name: "Literature in English", slug: "literature", color: "#7C3AED", icon: "📖" },
    }),
  ]);
  console.log(`✅ ${subjects.length} subjects created`);

  // ─── Admin User ────────────────────────────
  const adminHash = await bcrypt.hash("Admin@1234", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@flexacademy.com" },
    update: {},
    create: {
      email: "admin@flexacademy.com",
      passwordHash: adminHash,
      firstName: "Flex",
      lastName: "Admin",
      role: "SUPER_ADMIN",
      isEmailVerified: true,
    },
  });

  await prisma.subscription.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id, tier: "ELITE", status: "ACTIVE" },
  });
  console.log(`✅ Admin user created: admin@flexacademy.com`);

  // ─── Demo Student ──────────────────────────
  const studentHash = await bcrypt.hash("Student@1234", 12);
  const student = await prisma.user.upsert({
    where: { email: "demo@flexacademy.com" },
    update: {},
    create: {
      email: "demo@flexacademy.com",
      passwordHash: studentHash,
      firstName: "Chidi",
      lastName: "Okafor",
      role: "STUDENT",
      isEmailVerified: true,
      studentProfile: {
        create: {
          gradeLevel: "SS3",
          curriculum: "WAEC",
          targetExams: ["WAEC", "JAMB"],
          targetYear: 2025,
          state: "Lagos",
          country: "Nigeria",
        },
      },
      subscription: {
        create: { tier: "PRO", status: "TRIAL" },
      },
    },
  });
  console.log(`✅ Demo student: demo@flexacademy.com`);

  // ─── Sample Math Topics ────────────────────
  const mathSubject = subjects[0];
  const mathTopics = await Promise.all([
    prisma.topic.upsert({
      where: { subjectId_slug: { subjectId: mathSubject.id, slug: "algebra" } },
      update: {},
      create: { subjectId: mathSubject.id, name: "Algebra", slug: "algebra", order: 1 },
    }),
    prisma.topic.upsert({
      where: { subjectId_slug: { subjectId: mathSubject.id, slug: "trigonometry" } },
      update: {},
      create: { subjectId: mathSubject.id, name: "Trigonometry", slug: "trigonometry", order: 2 },
    }),
    prisma.topic.upsert({
      where: { subjectId_slug: { subjectId: mathSubject.id, slug: "calculus" } },
      update: {},
      create: { subjectId: mathSubject.id, name: "Calculus", slug: "calculus", order: 3 },
    }),
  ]);
  console.log(`✅ ${mathTopics.length} math topics created`);

  // ─── Sample WAEC Questions ─────────────────
  const q1 = await prisma.question.create({
    data: {
      topicId: mathTopics[0].id,
      examCategory: "WAEC",
      year: 2023,
      questionType: "MULTIPLE_CHOICE",
      body: "Simplify: $\\frac{x^2 - 9}{x - 3}$",
      options: [
        { id: "A", text: "x + 3", isCorrect: true },
        { id: "B", text: "x - 3", isCorrect: false },
        { id: "C", text: "x² + 3", isCorrect: false },
        { id: "D", text: "x + 9", isCorrect: false },
      ],
      correctAnswer: "A",
      explanation: "Factor the numerator: $x^2 - 9 = (x+3)(x-3)$. Cancel $(x-3)$ to get $x+3$.",
      difficulty: "INTERMEDIATE",
      tags: ["algebra", "factorization", "simplification"],
      isVerified: true,
    },
  });

  console.log(`✅ Sample questions created`);

  // ─── Badges ────────────────────────────────
  const badges = await Promise.all([
    prisma.badge.upsert({
      where: { name: "First Quiz" },
      update: {},
      create: {
        name: "First Quiz",
        description: "Completed your very first quiz",
        icon: "🎯",
        criteria: { type: "quiz_count", value: 1 },
        xpReward: 50,
      },
    }),
    prisma.badge.upsert({
      where: { name: "7-Day Streak" },
      update: {},
      create: {
        name: "7-Day Streak",
        description: "Studied for 7 consecutive days",
        icon: "🔥",
        criteria: { type: "streak", value: 7 },
        xpReward: 200,
      },
    }),
    prisma.badge.upsert({
      where: { name: "Perfect Score" },
      update: {},
      create: {
        name: "Perfect Score",
        description: "Scored 100% on a quiz",
        icon: "💎",
        criteria: { type: "quiz_score", value: 100 },
        xpReward: 500,
      },
    }),
    prisma.badge.upsert({
      where: { name: "Century" },
      update: {},
      create: {
        name: "Century",
        description: "Answered 100 questions correctly",
        icon: "💯",
        criteria: { type: "correct_answers", value: 100 },
        xpReward: 300,
      },
    }),
  ]);
  console.log(`✅ ${badges.length} badges created`);

  console.log("\n🎉 FlexAcademy seeding complete!");
  console.log("─────────────────────────────────────");
  console.log("  Admin:   admin@flexacademy.com / Admin@1234");
  console.log("  Student: demo@flexacademy.com  / Student@1234");
  console.log("─────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

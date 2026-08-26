import { PrismaClient, Role, SubscriptionTier, SubscriptionStatus, ExamCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("🌱 Seeding FlexAcademy database...");

  // ─── Subjects ──────────────────────────────
  const subjectData = [
    { name: "Mathematics", slug: "mathematics", color: "#2563EB", icon: "📐" },
    { name: "English Language", slug: "english-language", color: "#16A34A", icon: "📚" },
    { name: "Physics", slug: "physics", color: "#9333EA", icon: "⚛️" },
    { name: "Chemistry", slug: "chemistry", color: "#EA580C", icon: "🧪" },
    { name: "Biology", slug: "biology", color: "#0D9488", icon: "🧬" },
    { name: "Economics", slug: "economics", color: "#CA8A04", icon: "📊" },
    { name: "Government", slug: "government", color: "#DC2626", icon: "🏛️" },
    { name: "Literature in English", slug: "literature", color: "#7C3AED", icon: "📖" },
  ];

  const subjects = await Promise.all(
    subjectData.map((s) =>
      prisma.subject.upsert({
        where: { slug: s.slug },
        update: {},
        create: s,
      })
    )
  );
  console.log(`✅ ${subjects.length} subjects seeded`);

  // ─── Admin User ────────────────────────────
  // In production the credentials MUST come from the environment. A hardcoded
  // password in a public repo would hand over SUPER_ADMIN to anyone who reads it.
  const isProd = process.env.NODE_ENV === "production";
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@flexacademy.ng";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? (isProd ? null : "Admin@1234");

  if (!adminPassword) {
    throw new Error(
      "SEED_ADMIN_PASSWORD must be set when seeding with NODE_ENV=production. " +
        "Refusing to create a super-admin with a default password."
    );
  }
  if (isProd && adminPassword.length < 12) {
    throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters in production.");
  }

  const adminHash = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: adminHash,
      firstName: "Flex",
      lastName: "Admin",
      role: Role.SUPER_ADMIN,
      isEmailVerified: true,
    },
  });

  await prisma.subscription.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      tier: SubscriptionTier.ELITE,
      status: SubscriptionStatus.ACTIVE,
    },
  });
  console.log(
      );

  // ─── Demo Student ──────────────────────────
  // Demo accounts are a development convenience. Seeding a known-password
  // student into production would be an open door, so skip it there.
  if (!isProd) {
    const studentHash = await bcrypt.hash("Student@1234", 12);
    await prisma.user.upsert({
      where: { email: "demo@flexacademy.ng" },
      update: {},
      create: {
        email: "demo@flexacademy.ng",
        passwordHash: studentHash,
        firstName: "Chidi",
        lastName: "Okafor",
        role: Role.STUDENT,
        isEmailVerified: true,
        studentProfile: {
          create: {
            gradeLevel: "SS3",
            curriculum: "WAEC",
            targetExams: [ExamCategory.WAEC, ExamCategory.JAMB],
            targetYear: 2025,
            state: "Lagos",
            country: "Nigeria",
          },
        },
        subscription: {
          create: {
            tier: SubscriptionTier.PRO,
            status: SubscriptionStatus.TRIAL,
          },
        },
      },
    });
    console.log("✅ Demo student seeded: demo@flexacademy.ng / Student@1234");
  } else {
    console.log("↷ Demo student skipped (production)");
  }

  // ─── Math Topics ───────────────────────────
  const mathSubject = subjects[0];
  const topicsData = [
    { name: "Algebra", slug: "algebra", order: 1 },
    { name: "Trigonometry", slug: "trigonometry", order: 2 },
    { name: "Calculus", slug: "calculus", order: 3 },
    { name: "Statistics & Probability", slug: "statistics", order: 4 },
    { name: "Geometry", slug: "geometry", order: 5 },
  ];

  const mathTopics = await Promise.all(
    topicsData.map((t) =>
      prisma.topic.upsert({
        where: { subjectId_slug: { subjectId: mathSubject.id, slug: t.slug } },
        update: {},
        create: { subjectId: mathSubject.id, ...t },
      })
    )
  );
  console.log(`✅ ${mathTopics.length} math topics seeded`);

  // ─── Sample WAEC Question ──────────────────
  await prisma.question.create({
    data: {
      topicId: mathTopics[0].id,
      examCategory: ExamCategory.WAEC,
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
      explanation:
        "Factor the numerator: $x^2 - 9 = (x+3)(x-3)$. Cancel the $(x-3)$ term to get $x+3$.",
      difficulty: "INTERMEDIATE",
      tags: ["algebra", "factorization"],
      isVerified: true,
    },
  });
  console.log("✅ Sample WAEC question seeded");

  // ─── Badges ────────────────────────────────
  const badgesData = [
    {
      name: "First Quiz",
      description: "Completed your very first quiz",
      icon: "🎯",
      criteria: { type: "quiz_count", value: 1 },
      xpReward: 50,
    },
    {
      name: "7-Day Streak",
      description: "Studied for 7 consecutive days",
      icon: "🔥",
      criteria: { type: "streak", value: 7 },
      xpReward: 200,
    },
    {
      name: "Perfect Score",
      description: "Scored 100% on a quiz",
      icon: "💎",
      criteria: { type: "quiz_score", value: 100 },
      xpReward: 500,
    },
    {
      name: "Century",
      description: "Answered 100 questions correctly",
      icon: "💯",
      criteria: { type: "correct_answers", value: 100 },
      xpReward: 300,
    },
  ];

  const badges = await Promise.all(
    badgesData.map((b) =>
      prisma.badge.upsert({
        where: { name: b.name },
        update: {},
        create: b,
      })
    )
  );
  console.log(`✅ ${badges.length} badges seeded`);

  console.log("\n🎉 FlexAcademy seeding complete!");
  console.log("────────────────────────────────────────");
  console.log("  Admin:   admin@flexacademy.com / Admin@1234");
  console.log("  Student: demo@flexacademy.com  / Student@1234");
  console.log("────────────────────────────────────────");
}

main()
  .catch((e: unknown) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());

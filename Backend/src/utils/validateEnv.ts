/**
 * Boot-time environment check.
 *
 * A container that starts with a missing secret and only fails on the first
 * user request is worse than one that never starts: Railway will happily route
 * traffic to it. Fail loudly, immediately, before the port is bound.
 */

/** Needed in every environment — the app cannot function without these. */
const ALWAYS_REQUIRED = [
  "DATABASE_URL",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "ANTHROPIC_API_KEY",
] as const;

/** Additionally required in production. Without these the app is broken. */
const PRODUCTION_REQUIRED = [
  "CLIENT_URL",
  "FRONTEND_URL",
  "INTERNAL_API_KEY",
  // Required here so a missing value surfaces with the rest of the config,
  // rather than half-way through a seed that has already written rows.
  "SEED_ADMIN_PASSWORD",
] as const;

/**
 * Features that degrade rather than break. Missing these is worth shouting
 * about in the logs, but must not stop the platform booting — you should be
 * able to launch with lessons and the AI tutor working while payment
 * credentials are still going through approval.
 */
const PRODUCTION_RECOMMENDED: Record<string, string> = {
  NOMBA_CLIENT_ID: "card checkout will fail",
  NOMBA_CLIENT_SECRET: "card checkout will fail",
  NOMBA_ACCOUNT_ID: "card checkout will fail",
  NOMBA_WEBHOOK_SECRET: "payment webhooks cannot be verified",
  CLOUDINARY_CLOUD_NAME: "tutors cannot upload lesson video",
  CLOUDINARY_API_KEY: "tutors cannot upload lesson video",
  CLOUDINARY_API_SECRET: "tutors cannot upload lesson video",
  REDIS_URL: "caching disabled; the app still runs",
};

/** Secrets that must not ship with their example values. */
const WEAK_VALUES = new Set(["", "changeme", "secret", "your-secret-here", "your_jwt_secret"]);

export function validateEnv(): void {
  const isProd = process.env.NODE_ENV === "production";
  const problems: string[] = [];

  for (const key of ALWAYS_REQUIRED) {
    if (!process.env[key]) problems.push(`${key} is missing`);
  }

  if (isProd) {
    for (const key of PRODUCTION_REQUIRED) {
      if (!process.env[key]) problems.push(`${key} is missing (required in production)`);
    }

    // A short or placeholder signing key is the difference between sessions
    // that are secure and sessions anyone can forge.
    for (const key of ["JWT_SECRET", "JWT_REFRESH_SECRET"] as const) {
      const v = process.env[key] ?? "";
      if (WEAK_VALUES.has(v.toLowerCase())) problems.push(`${key} is still a placeholder`);
      else if (v.length < 32) problems.push(`${key} is too short (${v.length} chars, need 32+)`);
    }

    if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
      problems.push("JWT_SECRET and JWT_REFRESH_SECRET must differ");
    }

    for (const key of ["CLIENT_URL", "FRONTEND_URL"] as const) {
      const v = process.env[key];
      if (v && !v.startsWith("https://")) {
        problems.push(`${key} should be https in production (got ${v})`);
      }
    }

    const degraded = Object.entries(PRODUCTION_RECOMMENDED).filter(([k]) => !process.env[k]);
    if (degraded.length > 0) {
      console.warn("\nRunning with reduced functionality:\n");
      degraded.forEach(([k, effect]) => console.warn(`   - ${k} not set: ${effect}`));
      console.warn("");
    }
  }

  if (problems.length > 0) {
    console.error("\nEnvironment is not deployable:\n");
    problems.forEach((p) => console.error(`   - ${p}`));
    console.error("\nSee Backend/.env.example for the full list.\n");
    process.exit(1);
  }

  console.log(`Environment validated (${isProd ? "production" : "development"})`);
}

// Allow running standalone: npm run validate:env
if (require.main === module) validateEnv();

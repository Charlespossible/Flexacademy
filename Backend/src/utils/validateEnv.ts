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

/**
 * Additionally required in production. Locally these fall back to localhost
 * defaults, which is fine; in production a wrong value is a broken redirect,
 * a failed payment callback, or a CORS wall.
 */
const PRODUCTION_REQUIRED = [
  "CLIENT_URL",
  "FRONTEND_URL",
  "NOMBA_CLIENT_ID",
  "NOMBA_CLIENT_SECRET",
  "NOMBA_ACCOUNT_ID",
  "NOMBA_WEBHOOK_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "INTERNAL_API_KEY",
] as const;

/** Secrets that must not ship with their example values. */
const WEAK_VALUES = new Set([
  "",
  "changeme",
  "secret",
  "your-secret-here",
  "your_jwt_secret",
]);

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
  }

  if (problems.length > 0) {
    console.error("\n❌ Environment is not deployable:\n");
    problems.forEach((p) => console.error(`   • ${p}`));
    console.error("\nSee Backend/.env.example for the full list.\n");
    process.exit(1);
  }

  console.log(`✅ Environment validated (${isProd ? "production" : "development"})`);
}

// Allow running standalone: `npm run validate:env`
if (require.main === module) validateEnv();

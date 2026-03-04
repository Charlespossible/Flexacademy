const REQUIRED_ENV_VARS: string[] = [
  "DATABASE_URL",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "ANTHROPIC_API_KEY",
];

export const validateEnv = (): void => {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `❌ Missing required environment variables: ${missing.join(", ")}`
    );
    process.exit(1);
  }

  console.log("✅ Environment variables validated.");
};

// Run directly: tsx src/utils/validateEnv.ts
validateEnv();

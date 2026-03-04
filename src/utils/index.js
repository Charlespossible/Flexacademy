// ─────────────────────────────────────────────
// utils/ApiResponse.js
// ─────────────────────────────────────────────
export class ApiResponse {
  static success(data, message = "Success") {
    return { success: true, message, data };
  }

  static paginated(data, { total, page, limit }) {
    return {
      success: true,
      message: "Success",
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }
}

// ─────────────────────────────────────────────
// utils/ApiError.js
// ─────────────────────────────────────────────
export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ApiError";
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─────────────────────────────────────────────
// utils/tokens.js
// ─────────────────────────────────────────────
import jwt from "jsonwebtoken";

export const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token.");
  }
};

// ─────────────────────────────────────────────
// utils/logger.js
// ─────────────────────────────────────────────
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty", options: { colorize: true, ignore: "pid,hostname" } }
      : undefined,
});

export const morganStream = {
  write: (message) => logger.info(message.trim()),
};

// ─────────────────────────────────────────────
// utils/validateEnv.js
// ─────────────────────────────────────────────
const required = [
  "DATABASE_URL",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "ANTHROPIC_API_KEY",
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}
console.log("✅ Environment variables validated.");

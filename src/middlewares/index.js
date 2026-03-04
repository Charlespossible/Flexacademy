// ─────────────────────────────────────────────
// middlewares/auth.middleware.js
// ─────────────────────────────────────────────
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../config/database.js";
import { ApiError } from "../utils/ApiError.js";

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required.");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) throw new ApiError(StatusCodes.UNAUTHORIZED, "User no longer exists.");
    if (!user.isActive) throw new ApiError(StatusCodes.FORBIDDEN, "Account suspended.");

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err.name === "TokenExpiredError") {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Access token expired.");
    }
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid token.");
  }
};

export const requireRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        `Access denied. Required role(s): ${roles.join(", ")}`
      );
    }
    next();
  };
};

export const requireVerifiedEmail = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Please verify your email to access this feature.");
  }
  next();
};

// ─────────────────────────────────────────────
// middlewares/rateLimiter.js
// ─────────────────────────────────────────────
import rateLimit from "express-rate-limit";

export const globalRateLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  message: { success: false, message: "Too many auth attempts. Try again in 15 minutes." },
  skipSuccessfulRequests: true,
});

export const aiTutorRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { success: false, message: "AI Tutor rate limit reached. Slow down a bit!" },
  keyGenerator: (req) => req.user?.id || req.ip,
});

// ─────────────────────────────────────────────
// middlewares/errorHandler.js
// ─────────────────────────────────────────────
import { logger } from "../utils/logger.js";

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Prisma known errors
  if (err.code === "P2002") {
    statusCode = 409;
    const field = err.meta?.target?.[0] || "field";
    message = `${field} already exists.`;
  }

  if (err.code === "P2025") {
    statusCode = 404;
    message = "Record not found.";
  }

  if (err.name === "ZodError") {
    statusCode = 422;
    message = "Validation failed.";
    return res.status(statusCode).json({
      success: false,
      message,
      errors: err.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
    });
  }

  if (statusCode === 500) {
    logger.error({ err, url: req.url, method: req.method }, "Unhandled server error");
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// ─────────────────────────────────────────────
// middlewares/notFound.js
// ─────────────────────────────────────────────
export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found.`,
  });
};

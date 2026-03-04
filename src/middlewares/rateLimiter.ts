import { Request, Response } from "express";
import rateLimit from "express-rate-limit";

// ─── 404 Handler ──────────────────────────────
export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found.`,
  });
};

// ─── Rate Limiters ────────────────────────────
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
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: "Too many auth attempts. Try again in 15 minutes.",
  },
});

export const aiTutorRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req: Request) =>
    (req.user as { id?: string } | undefined)?.id ?? req.ip ?? "unknown",
  message: { success: false, message: "AI Tutor rate limit reached. Slow down a bit!" },
});

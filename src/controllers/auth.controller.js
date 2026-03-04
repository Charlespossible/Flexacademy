import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../config/database.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { generateTokens, verifyRefreshToken } from "../utils/tokens.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/email.service.js";
import { cache } from "../config/redis.js";
import { logger } from "../utils/logger.js";
import crypto from "crypto";

// ─── Register ─────────────────────────────────
export const register = async (req, res) => {
  const { email, password, firstName, lastName, role, gradeLevel, curriculum } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new ApiError(StatusCodes.CONFLICT, "Email already registered.");

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: role || "STUDENT",
      },
    });

    // Auto-create profile based on role
    if (role === "TUTOR" || !role) {
      if (!role || role === "STUDENT") {
        await tx.studentProfile.create({
          data: {
            userId: newUser.id,
            gradeLevel: gradeLevel || "SS3",
            curriculum: curriculum || "WAEC",
          },
        });
      }
    }

    // Create free subscription
    await tx.subscription.create({
      data: {
        userId: newUser.id,
        tier: "FREE",
        status: "ACTIVE",
      },
    });

    return newUser;
  });

  // Send email verification
  const verifyToken = crypto.randomBytes(32).toString("hex");
  await cache.set(`email_verify:${verifyToken}`, user.id, 86400); // 24h
  await sendVerificationEmail(user.email, user.firstName, verifyToken);

  const { accessToken, refreshToken } = generateTokens(user.id, user.role);

  // Store refresh token hash
  const refreshHash = await bcrypt.hash(refreshToken, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash: refreshHash },
  });

  logger.info({ userId: user.id }, "New user registered");

  return res.status(StatusCodes.CREATED).json(
    ApiResponse.success(
      {
        user: sanitizeUser(user),
        accessToken,
        refreshToken,
      },
      "Registration successful. Please verify your email."
    )
  );
};

// ─── Login ────────────────────────────────────
export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { studentProfile: true, subscription: true },
  });

  if (!user || !user.passwordHash) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password.");
  }

  if (!user.isActive) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Account suspended. Contact support.");
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password.");

  const { accessToken, refreshToken } = generateTokens(user.id, user.role);
  const refreshHash = await bcrypt.hash(refreshToken, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshTokenHash: refreshHash,
      lastLoginAt: new Date(),
    },
  });

  logger.info({ userId: user.id }, "User logged in");

  return res.status(StatusCodes.OK).json(
    ApiResponse.success(
      {
        user: sanitizeUser(user),
        subscription: user.subscription,
        accessToken,
        refreshToken,
      },
      "Login successful"
    )
  );
};

// ─── Refresh Token ────────────────────────────
export const refreshToken = async (req, res) => {
  const { refreshToken: token } = req.body;
  if (!token) throw new ApiError(StatusCodes.UNAUTHORIZED, "Refresh token required.");

  const decoded = verifyRefreshToken(token);
  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

  if (!user?.refreshTokenHash) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid refresh token.");
  }

  const isValid = await bcrypt.compare(token, user.refreshTokenHash);
  if (!isValid) throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid refresh token.");

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id, user.role);
  const newHash = await bcrypt.hash(newRefreshToken, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash: newHash },
  });

  return res.status(StatusCodes.OK).json(
    ApiResponse.success({ accessToken, refreshToken: newRefreshToken }, "Token refreshed")
  );
};

// ─── Logout ───────────────────────────────────
export const logout = async (req, res) => {
  await prisma.user.update({
    where: { id: req.user.id },
    data: { refreshTokenHash: null },
  });

  return res
    .status(StatusCodes.OK)
    .json(ApiResponse.success(null, "Logged out successfully"));
};

// ─── Verify Email ─────────────────────────────
export const verifyEmail = async (req, res) => {
  const { token } = req.params;
  const userId = await cache.get(`email_verify:${token}`);

  if (!userId) throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid or expired verification token.");

  await prisma.user.update({
    where: { id: userId },
    data: { isEmailVerified: true },
  });

  await cache.del(`email_verify:${token}`);

  return res
    .status(StatusCodes.OK)
    .json(ApiResponse.success(null, "Email verified successfully."));
};

// ─── Forgot Password ──────────────────────────
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  // Always respond OK to prevent email enumeration
  if (user) {
    const resetToken = crypto.randomBytes(32).toString("hex");
    await cache.set(`pwd_reset:${resetToken}`, user.id, 3600); // 1h
    await sendPasswordResetEmail(user.email, user.firstName, resetToken);
  }

  return res
    .status(StatusCodes.OK)
    .json(ApiResponse.success(null, "If that email exists, a reset link has been sent."));
};

// ─── Reset Password ───────────────────────────
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  const userId = await cache.get(`pwd_reset:${token}`);

  if (!userId) throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid or expired reset token.");

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  await cache.del(`pwd_reset:${token}`);

  return res
    .status(StatusCodes.OK)
    .json(ApiResponse.success(null, "Password reset successful."));
};

// ─── Google OAuth Callback ────────────────────
export const googleCallback = async (req, res) => {
  const user = req.user; // populated by Passport
  const { accessToken, refreshToken } = generateTokens(user.id, user.role);

  const refreshHash = await bcrypt.hash(refreshToken, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash: refreshHash, lastLoginAt: new Date() },
  });

  // Redirect to frontend with tokens
  const clientUrl = process.env.CLIENT_URL;
  res.redirect(`${clientUrl}/auth/callback?access=${accessToken}&refresh=${refreshToken}`);
};

// ─── Helper ───────────────────────────────────
const sanitizeUser = (user) => {
  const { passwordHash, refreshTokenHash, ...safe } = user;
  return safe;
};

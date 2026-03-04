import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../config/database";
import { ApiResponse, ApiError } from "../utils/ApiResponse";
import { generateTokens, verifyRefreshToken } from "../utils/tokens";
import { cache } from "../config/redis";
import { logger } from "../utils/logger";
import { RegisterBody, LoginBody, ResetPasswordBody, TokenPair } from "../types";
import { User } from "@prisma/client";

// ─── Helpers ──────────────────────────────────
type SafeUser = Omit<User, "passwordHash" | "refreshTokenHash">;

const sanitizeUser = (user: User): SafeUser => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, refreshTokenHash, ...safe } = user;
  return safe;
};

const storeRefreshToken = async (userId: string, token: string): Promise<void> => {
  const hash = await bcrypt.hash(token, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { refreshTokenHash: hash },
  });
};

// ─── Register ─────────────────────────────────
export const register = async (
  req: Request<object, object, RegisterBody>,
  res: Response
): Promise<void> => {
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
        role: role ?? "STUDENT",
      },
    });

    if (!role || role === "STUDENT") {
      await tx.studentProfile.create({
        data: {
          userId: newUser.id,
          gradeLevel: gradeLevel ?? "SS3",
          curriculum: curriculum ?? "WAEC",
        },
      });
    }

    await tx.subscription.create({
      data: { userId: newUser.id, tier: "FREE", status: "ACTIVE" },
    });

    return newUser;
  });

  // Email verification
  const verifyToken = crypto.randomBytes(32).toString("hex");
  await cache.set<string>(`email_verify:${verifyToken}`, user.id, 86400);
  // await sendVerificationEmail(user.email, user.firstName, verifyToken);

  const tokens: TokenPair = generateTokens(user.id, user.role);
  await storeRefreshToken(user.id, tokens.refreshToken);

  logger.info({ userId: user.id }, "New user registered");

  res.status(StatusCodes.CREATED).json(
    ApiResponse.success(
      { user: sanitizeUser(user), ...tokens },
      "Registration successful. Please verify your email."
    )
  );
};

// ─── Login ────────────────────────────────────
export const login = async (
  req: Request<object, object, LoginBody>,
  res: Response
): Promise<void> => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { studentProfile: true, subscription: true },
  });

  if (!user?.passwordHash) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password.");
  }

  if (!user.isActive) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Account suspended. Contact support.");
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password.");

  const tokens: TokenPair = generateTokens(user.id, user.role);
  await storeRefreshToken(user.id, tokens.refreshToken);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  logger.info({ userId: user.id }, "User logged in");

  res.status(StatusCodes.OK).json(
    ApiResponse.success(
      {
        user: sanitizeUser(user),
        subscription: user.subscription,
        ...tokens,
      },
      "Login successful"
    )
  );
};

// ─── Refresh Token ────────────────────────────
export const refreshToken = async (
  req: Request<object, object, { refreshToken: string }>,
  res: Response
): Promise<void> => {
  const { refreshToken: token } = req.body;
  if (!token) throw new ApiError(StatusCodes.UNAUTHORIZED, "Refresh token required.");

  const decoded = verifyRefreshToken(token);
  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

  if (!user?.refreshTokenHash) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid refresh token.");
  }

  const isValid = await bcrypt.compare(token, user.refreshTokenHash);
  if (!isValid) throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid refresh token.");

  const tokens = generateTokens(user.id, user.role);
  await storeRefreshToken(user.id, tokens.refreshToken);

  res
    .status(StatusCodes.OK)
    .json(ApiResponse.success(tokens, "Token refreshed"));
};

// ─── Logout ───────────────────────────────────
export const logout = async (req: Request, res: Response): Promise<void> => {
  if (req.user) {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { refreshTokenHash: null },
    });
  }

  res
    .status(StatusCodes.OK)
    .json(ApiResponse.success(null, "Logged out successfully"));
};

// ─── Verify Email ─────────────────────────────
export const verifyEmail = async (
  req: Request<{ token: string }>,
  res: Response
): Promise<void> => {
  const { token } = req.params;
  const userId = await cache.get<string>(`email_verify:${token}`);

  if (!userId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid or expired verification token.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isEmailVerified: true },
  });

  await cache.del(`email_verify:${token}`);

  res
    .status(StatusCodes.OK)
    .json(ApiResponse.success(null, "Email verified successfully."));
};

// ─── Forgot Password ──────────────────────────
export const forgotPassword = async (
  req: Request<object, object, { email: string }>,
  res: Response
): Promise<void> => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const resetToken = crypto.randomBytes(32).toString("hex");
    await cache.set<string>(`pwd_reset:${resetToken}`, user.id, 3600);
    // await sendPasswordResetEmail(user.email, user.firstName, resetToken);
  }

  // Always OK — prevents email enumeration
  res
    .status(StatusCodes.OK)
    .json(
      ApiResponse.success(null, "If that email exists, a reset link has been sent.")
    );
};

// ─── Reset Password ───────────────────────────
export const resetPassword = async (
  req: Request<object, object, ResetPasswordBody>,
  res: Response
): Promise<void> => {
  const { token, newPassword } = req.body;
  const userId = await cache.get<string>(`pwd_reset:${token}`);

  if (!userId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid or expired reset token.");
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  await cache.del(`pwd_reset:${token}`);

  res
    .status(StatusCodes.OK)
    .json(ApiResponse.success(null, "Password reset successful."));
};

// ─── Google OAuth Callback ────────────────────
export const googleCallback = async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const tokens = generateTokens(user.id, user.role);
  await storeRefreshToken(user.id, tokens.refreshToken);

  const clientUrl = process.env.CLIENT_URL ?? "http://localhost:3000";
  res.redirect(
    `${clientUrl}/auth/callback?access=${tokens.accessToken}&refresh=${tokens.refreshToken}`
  );
};

import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { JwtPayload, RefreshTokenPayload, TokenPair } from "../types";
import { ApiError } from "./ApiResponse";
import { StatusCodes } from "http-status-codes";

export const generateTokens = (userId: string, role: Role): TokenPair => {
  const accessToken = jwt.sign(
    { userId, role } satisfies JwtPayload,
    process.env.JWT_SECRET as string,
    { expiresIn: (process.env.JWT_EXPIRES_IN ?? "15m") as jwt.SignOptions["expiresIn"] }
  );

  const refreshToken = jwt.sign(
    { userId } satisfies RefreshTokenPayload,
    process.env.JWT_REFRESH_SECRET as string,
    {
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ??
        "7d") as jwt.SignOptions["expiresIn"],
    }
  );

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    return jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET as string
    ) as RefreshTokenPayload;
  } catch {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid or expired refresh token.");
  }
};

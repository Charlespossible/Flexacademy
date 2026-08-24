import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { Role } from "@prisma/client";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiResponse";
import { JwtPayload } from "../types";

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(ApiError(StatusCodes.UNAUTHORIZED, "Authentication required."));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

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

    if (!user) {
      return next(ApiError(StatusCodes.UNAUTHORIZED, "User no longer exists."));
    }

    if (!user.isActive) {
      return next(ApiError(StatusCodes.FORBIDDEN, "Account suspended."));
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(ApiError(StatusCodes.UNAUTHORIZED, "Access token expired."));
    }
    return next(ApiError(StatusCodes.UNAUTHORIZED, "Invalid token."));
  }
};

export const requireRoles = (...roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        ApiError(
          StatusCodes.FORBIDDEN,
          `Access denied. Required role(s): ${roles.join(", ")}`
        )
      );
    }
    next();
  };
};

// Attaches user to req if a valid Bearer token is present, but never blocks
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return next();

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true, isEmailVerified: true, firstName: true, lastName: true },
    });
    if (user?.isActive) req.user = user;
  } catch {
    // invalid token — just proceed unauthenticated
  }
  next();
};

export const requireVerifiedEmail = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user?.isEmailVerified) {
    return next(
      ApiError(
        StatusCodes.FORBIDDEN,
        "Please verify your email to access this feature."
      )
    );
  }
  next();
};

import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "../utils/ApiResponse";
import { logger } from "../utils/logger";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = "Internal Server Error";

  // Known API error
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;

    res.status(statusCode).json({ success: false, message });
    return;
  }

  // Zod validation error
  if (err instanceof ZodError) {
    res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
      success: false,
      message: "Validation failed.",
      errors: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  // Prisma known request errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const field = (err.meta?.target as string[])?.[0] ?? "field";
      statusCode = StatusCodes.CONFLICT;
      message = `${field} already exists.`;
    } else if (err.code === "P2025") {
      statusCode = StatusCodes.NOT_FOUND;
      message = "Record not found.";
    }

    res.status(statusCode).json({ success: false, message });
    return;
  }

  // Unknown error — log and respond generically
  logger.error(
    { err, url: req.url, method: req.method },
    "Unhandled server error"
  );

  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: "An unexpected error occurred.",
    ...(process.env.NODE_ENV === "development" && err instanceof Error
      ? { stack: err.stack }
      : {}),
  });
};

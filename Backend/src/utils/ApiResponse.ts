import { PaginationMeta } from "../types";

// ─────────────────────────────────────────────
// API ERROR
// Factory function instead of a class.
// Extends the native Error so instanceof Error still works,
// and stack traces are captured from the call site.
// ─────────────────────────────────────────────

export interface AppError extends Error {
  readonly statusCode: number;
  readonly isOperational: boolean;
}

export const createApiError = (
  statusCode: number,
  message: string
): AppError => {
  const error = new Error(message) as AppError;
  (error as { statusCode: number }).statusCode = statusCode;
  (error as { isOperational: boolean }).isOperational = true;
  error.name = "ApiError";
  Error.captureStackTrace(error, createApiError);
  return error;
};

// Named alias — call as ApiError(statusCode, message) with no `new` keyword
// working without any changes — just drop `new`.
export const ApiError = createApiError;

// Type guard for downstream narrowing
export const isApiError = (err: unknown): err is AppError =>
  err instanceof Error && err.name === "ApiError";

// ─────────────────────────────────────────────
// API RESPONSE FACTORIES
// Pure functions — no class, no `this`, no shared state.
// ─────────────────────────────────────────────

export interface SuccessResponse<T> {
  readonly success: true;
  readonly message: string;
  readonly data: T;
}

export interface PaginatedResponse<T> {
  readonly success: true;
  readonly message: string;
  readonly data: T[];
  readonly pagination: PaginationMeta;
}

export const successResponse = <T>(
  data: T,
  message = "Success"
): SuccessResponse<T> => ({
  success: true,
  message,
  data,
});

export const paginatedResponse = <T>(
  data: T[],
  meta: { total: number; page: number; limit: number }
): PaginatedResponse<T> => ({
  success: true,
  message: "Success",
  data,
  pagination: {
    total: meta.total,
    page: meta.page,
    limit: meta.limit,
    totalPages: Math.ceil(meta.total / meta.limit),
    hasNext: meta.page * meta.limit < meta.total,
    hasPrev: meta.page > 1,
  },
});

// ─────────────────────────────────────────────
// Namespace object — keeps every existing
// `ApiResponse.success()` and `ApiResponse.paginated()`
// call site compiling with zero edits.
// ─────────────────────────────────────────────
export const ApiResponse = {
  success: successResponse,
  paginated: paginatedResponse,
} as const;

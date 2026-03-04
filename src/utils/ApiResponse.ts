import { PaginationMeta } from "../types";

// ─── ApiError ─────────────────────────────────
export class ApiError extends Error {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ApiError";
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── ApiResponse ──────────────────────────────
export class ApiResponse {
  static success<T>(data: T, message = "Success") {
    return { success: true as const, message, data };
  }

  static paginated<T>(
    data: T[],
    meta: { total: number; page: number; limit: number }
  ) {
    const pagination: PaginationMeta = {
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages: Math.ceil(meta.total / meta.limit),
      hasNext: meta.page * meta.limit < meta.total,
      hasPrev: meta.page > 1,
    };

    return { success: true as const, message: "Success", data, pagination };
  }
}

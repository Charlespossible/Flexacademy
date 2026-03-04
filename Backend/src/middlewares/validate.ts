import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { StatusCodes } from "http-status-codes";

type RequestPart = "body" | "query" | "params";

export const validate =
  (schema: AnyZodObject, part: RequestPart = "body") =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req[part] = await schema.parseAsync(req[part]);
      next();
    } catch (err) {
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
      next(err);
    }
  };

import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodSchema } from "zod";

/** Every route returns this shape on failure (§8). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields?: string[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function sendError(res: Response, error: ApiError): void {
  res.status(error.status).json({
    error: { code: error.code, message: error.message, ...(error.fields && { fields: error.fields }) },
  });
}

/** Wraps an async handler so a rejected promise reaches the error middleware. */
export function asyncRoute(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res, next).catch(next);
  };
}

/** Validates a request body, converting zod issues into the standard error shape. */
export function parseBody<T>(schema: ZodSchema<T>, body: unknown): T {
  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      const fields = error.issues.map((issue) => issue.path.join("."));
      throw new ApiError(400, "VALIDATION_ERROR", error.issues[0]?.message ?? "Invalid request", fields);
    }
    throw error;
  }
}

/**
 * Reads a route parameter. Express types params as a loose dictionary, so under
 * `noUncheckedIndexedAccess` every read is `string | undefined`; a missing
 * parameter means the route pattern and the handler disagree.
 */
export function routeParam(req: Request, name: string): string {
  const value = req.params[name];
  if (!value) {
    throw new ApiError(400, "MISSING_PARAMETER", `Missing route parameter "${name}".`);
  }
  return value;
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ApiError) {
    sendError(res, error);
    return;
  }
  if (error instanceof ZodError) {
    sendError(
      res,
      new ApiError(
        400,
        "VALIDATION_ERROR",
        error.issues[0]?.message ?? "Invalid request",
        error.issues.map((issue) => issue.path.join(".")),
      ),
    );
    return;
  }

  console.error("[unhandled]", error);
  sendError(res, new ApiError(500, "INTERNAL_ERROR", "Something went wrong on our side."));
}

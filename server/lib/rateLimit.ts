import type { NextFunction, Request, Response } from "express";
import { ApiError } from "./http.js";

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Deliberately simple in-memory limiter: enough to blunt obvious abuse during a
 * public demo without standing up real infrastructure (§17.5). A multi-instance
 * deployment would need a shared store.
 */
export function rateLimit(options: { max: number; windowMs: number; key: string }) {
  const buckets = new Map<string, Bucket>();

  return (req: Request, _res: Response, next: NextFunction): void => {
    const identity = req.auth?.userId ?? req.ip ?? "anonymous";
    const bucketKey = `${options.key}:${identity}`;
    const now = Date.now();

    const existing = buckets.get(bucketKey);
    if (!existing || existing.resetAt <= now) {
      buckets.set(bucketKey, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    if (existing.count >= options.max) {
      const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
      next(
        new ApiError(
          429,
          "RATE_LIMITED",
          `Too many requests. Try again in ${retryAfter} second${retryAfter === 1 ? "" : "s"}.`,
        ),
      );
      return;
    }

    existing.count += 1;
    next();
  };
}

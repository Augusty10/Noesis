import { Request, Response, NextFunction } from "express";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const store: Record<string, RateLimitRecord> = {};

/**
 * Basic in-memory rate-limiter middleware.
 */
export function rateLimiter(windowMs: number, max: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown-ip";
    const now = Date.now();

    if (!store[ip]) {
      store[ip] = {
        count: 1,
        resetTime: now + windowMs,
      };
      next();
      return;
    }

    const record = store[ip];
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      next();
      return;
    }

    record.count += 1;
    if (record.count > max) {
      res.status(429).json({ message: "Too many requests, please try again later." });
      return;
    }

    next();
  };
}

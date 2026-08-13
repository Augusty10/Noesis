import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  console.log(`[Auth Middleware] URL=${req.originalUrl} Method=${req.method}`);
  console.log("[Auth Middleware] Headers =", JSON.stringify(req.headers, null, 2));
  
  const userId = req.headers["x-user-id"];
  console.log("[Auth Middleware] x-user-id header parsed =", userId);
  
  if (!userId || typeof userId !== "string") {
    console.warn("[Auth Middleware] Unauthorized access attempt: x-user-id is missing or invalid");
    res.status(401).json({ message: "Unauthorized. Please sign in." });
    return;
  }
  
  req.userId = userId;
  next();
}

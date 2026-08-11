import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const userId = req.headers["x-user-id"];
  
  if (!userId || typeof userId !== "string") {
    res.status(401).json({ message: "Unauthorized. Please sign in." });
    return;
  }
  
  req.userId = userId;
  next();
}

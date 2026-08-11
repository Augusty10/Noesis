import { Request, Response, NextFunction } from "express";
import { db } from "../lib/db";

export async function requireNotebookOwnership(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const notebookId = req.params.notebookId || req.params.id || req.body.notebookId;

    if (!notebookId || typeof notebookId !== "string") {
      res.status(400).json({ message: "Notebook ID is required." });
      return;
    }

    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized. Please sign in." });
      return;
    }

    const notebook = await db.notebook.findUnique({
      where: { id: notebookId },
      select: { userId: true },
    });

    if (!notebook || notebook.userId !== userId) {
      res.status(404).json({ message: "Notebook not found." });
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}

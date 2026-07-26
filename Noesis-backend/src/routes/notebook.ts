import { Router, Request, Response, NextFunction } from "express";
import { db } from "../lib/db";

const router = Router();

// GET /api/notebooks
router.get("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const notebooks = await db.notebook.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { sources: true }
        }
      }
    });

    // Map source count to match frontend notebook model expectation
    const mapped = notebooks.map((n) => ({
      id: n.id,
      title: n.title,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
      sourceCount: n._count.sources,
    }));

    res.json(mapped);
  } catch (err) {
    next(err);
  }
});

// GET /api/notebooks/:id (used to get individual notebook title and status)
router.get("/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const notebook = await db.notebook.findUnique({
      where: { id },
      include: {
        sources: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!notebook) {
      res.status(404).json({ message: "Notebook not found." });
      return;
    }

    res.json({
      id: notebook.id,
      title: notebook.title,
      createdAt: notebook.createdAt.toISOString(),
      updatedAt: notebook.updatedAt.toISOString(),
      sources: notebook.sources.map((s) => ({
        id: s.id,
        notebookId: s.notebookId,
        type: s.type,
        title: s.title,
        originalUrl: s.originalUrl,
        status: s.status,
        errorMessage: s.errorMessage,
        createdAt: s.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/notebooks
router.post("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title } = req.body;
    if (!title || typeof title !== "string") {
      res.status(400).json({ message: "Title is required and must be a string." });
      return;
    }

    const notebook = await db.notebook.create({
      data: { title },
    });

    res.status(201).json({
      id: notebook.id,
      title: notebook.title,
      createdAt: notebook.createdAt.toISOString(),
      updatedAt: notebook.updatedAt.toISOString(),
      sourceCount: 0,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notebooks/:id
router.patch("/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    if (!title || typeof title !== "string") {
      res.status(400).json({ message: "Title is required and must be a string." });
      return;
    }

    const notebook = await db.notebook.update({
      where: { id },
      data: { title },
      include: {
        _count: {
          select: { sources: true }
        }
      }
    });

    res.json({
      id: notebook.id,
      title: notebook.title,
      createdAt: notebook.createdAt.toISOString(),
      updatedAt: notebook.updatedAt.toISOString(),
      sourceCount: notebook._count.sources,
    });
  } catch (err) {
    res.status(404).json({ message: "Notebook not found." });
  }
});

// DELETE /api/notebooks/:id
router.delete("/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await db.notebook.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    res.status(404).json({ message: "Notebook not found." });
  }
});

export default router;

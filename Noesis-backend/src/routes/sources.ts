import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "../lib/db";
import { indexSource } from "../jobs/index-source";
import { validateUploadedFile, UploadedFile } from "../lib/security/file-validation";
import { extractVideoId } from "../lib/ingestion/extractors/youtube";

const router = Router();

// Configure local uploads directory
const uploadDir = path.resolve(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// GET /api/notebooks/:notebookId/sources
router.get("/notebooks/:notebookId/sources", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const notebookId = req.params.notebookId as string;
    const sources = await db.source.findMany({
      where: { notebookId },
      orderBy: { createdAt: "desc" },
    });

    res.json(sources.map((s) => ({
      id: s.id,
      notebookId: s.notebookId,
      type: s.type,
      title: s.title,
      originalUrl: s.originalUrl,
      status: s.status,
      errorMessage: s.errorMessage,
      createdAt: s.createdAt.toISOString(),
    })));
  } catch (err) {
    next(err);
  }
});

// POST /api/sources
router.post("/sources", upload.single("file"), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { notebookId, type, title, content, url } = req.body;

    if (!notebookId) {
      res.status(400).json({ message: "notebookId is required." });
      return;
    }

    const notebook = await db.notebook.findUnique({ where: { id: notebookId } });
    if (!notebook) {
      res.status(404).json({ message: "Notebook not found." });
      return;
    }

    let source;

    if (type === "TEXT") {
      if (!title || !content) {
        res.status(400).json({ message: "Title and content are required for TEXT sources." });
        return;
      }
      source = await db.source.create({
        data: {
          notebookId,
          type: "TEXT",
          title,
          status: "UPLOADING",
          metadata: JSON.stringify({ content }),
        },
      });

    } else if (type === "URL") {
      if (!url) {
        res.status(400).json({ message: "URL is required for Web Page sources." });
        return;
      }
      source = await db.source.create({
        data: {
          notebookId,
          type: "URL",
          title: `Webpage: ${url}`,
          originalUrl: url,
          status: "UPLOADING",
        },
      });

    } else if (type === "YOUTUBE") {
      if (!url) {
        res.status(400).json({ message: "YouTube URL is required." });
        return;
      }
      source = await db.source.create({
        data: {
          notebookId,
          type: "YOUTUBE",
          title: `YouTube Video`,
          originalUrl: url,
          status: "UPLOADING",
        },
      });

    } else if (type === "PDF" || type === "VTT") {
      if (!req.file) {
        res.status(400).json({ message: `A file upload is required for ${type} sources.` });
        return;
      }

      const fileValidation = validateUploadedFile(req.file as UploadedFile, type);
      if (!fileValidation.valid) {
        res.status(400).json({ message: fileValidation.error });
        return;
      }

      source = await db.source.create({
        data: {
          notebookId,
          type,
          title: req.file.originalname,
          filePath: req.file.path,
          status: "UPLOADING",
        },
      });
    } else {
      res.status(400).json({ message: `Unsupported source type: ${type}` });
      return;
    }

    // Trigger background indexing asynchronously
    indexSource(source.id).catch((err) => {
      console.error(`Background ingestion failed for source ${source.id}:`, err);
    });

    res.status(201).json({
      id: source.id,
      notebookId: source.notebookId,
      type: source.type,
      title: source.title,
      originalUrl: source.originalUrl,
      status: source.status,
      createdAt: source.createdAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/sources/:id
router.get("/sources/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const source = await db.source.findUnique({ where: { id } });
    if (!source) {
      res.status(404).json({ message: "Source not found." });
      return;
    }
    res.json(source);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/sources/:id
router.delete("/sources/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const source = await db.source.findUnique({ where: { id } });
    if (!source) {
      res.status(404).json({ message: "Source not found." });
      return;
    }

    // Remove local file if present
    if (source.filePath && fs.existsSync(source.filePath)) {
      try {
        fs.unlinkSync(source.filePath);
      } catch (err) {
        console.error(`Failed to delete local file ${source.filePath}:`, err);
      }
    }

    await db.source.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// POST /api/sources/:id/reindex
router.post("/sources/:id/reindex", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const source = await db.source.findUnique({ where: { id } });
    if (!source) {
      res.status(404).json({ message: "Source not found." });
      return;
    }

    const updated = await db.source.update({
      where: { id },
      data: {
        status: "UPLOADING",
        errorMessage: null,
      },
    });

    // Launch background indexing task
    indexSource(id).catch((err) => {
      console.error(`Background reindexing failed for source ${id}:`, err);
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// GET /api/sources/:id/file (serves uploaded files directly like PDF)
router.get("/sources/:id/file", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const source = await db.source.findUnique({ where: { id } });
    if (!source || !source.filePath) {
      res.status(404).json({ message: "File not found." });
      return;
    }

    if (!fs.existsSync(source.filePath)) {
      res.status(404).json({ message: "File does not exist on disk." });
      return;
    }

    res.sendFile(path.resolve(source.filePath));
  } catch (err) {
    next(err);
  }
});

// GET /api/sources/:id/view
router.get("/sources/:id/view", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { chunkId } = req.query;

    const source = await db.source.findUnique({
      where: { id },
      include: {
        chunks: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!source) {
      res.status(404).json({ message: "Source not found." });
      return;
    }

    // Reconstruct full text of the source by joining all chunks
    const rawText = source.chunks.map((c) => c.text).join("\n\n");

    const payload: any = {
      type: source.type,
      originalUrl: source.originalUrl || undefined,
      rawText,
    };

    if (source.type === "PDF") {
      // Return filepath URL that maps back to our file download route
      payload.filePath = `/api/sources/${source.id}/file`;
    }

    if (source.type === "YOUTUBE") {
      let videoId = extractVideoId(source.originalUrl || "");
      if (!videoId && source.metadata) {
        try {
          const meta = JSON.parse(source.metadata);
          if (meta.videoId) {
            videoId = meta.videoId;
          }
        } catch (_) {}
      }
      payload.videoId = videoId || undefined;
    }

    // If a chunkId was referenced in the citation, load its specific details and highlight text
    if (chunkId && typeof chunkId === "string") {
      const chunk = source.chunks.find((c) => c.id === chunkId);
      if (chunk) {
        payload.highlightText = chunk.text;
        payload.pageNumber = chunk.page ?? undefined;
        payload.startTime = chunk.startTime ?? undefined;
        payload.endTime = chunk.endTime ?? undefined;
      }
    }

    res.json(payload);
  } catch (err) {
    next(err);
  }
});

export default router;

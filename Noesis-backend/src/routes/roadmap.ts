import { Router, Request, Response, NextFunction } from "express";
import { OpenAI } from "openai";
import { db } from "../lib/db";

const router = Router();

// POST /api/roadmap - Generates a structured learning roadmap from the sources
router.post("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { notebookId } = req.body;

    if (!notebookId) {
      res.status(400).json({ message: "notebookId is required." });
      return;
    }

    // 1. Fetch ready sources and text chunks
    const sources = await db.source.findMany({
      where: { notebookId, status: "READY" },
      include: {
        chunks: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (sources.length === 0) {
      res.status(400).json({
        message: "No ready sources found. Please add and wait for sources to index to generate a roadmap.",
      });
      return;
    }

    // 2. Prepare structured representation of sources for OpenAI context
    const sourcesMeta = sources.map((s) => {
      // Take up to 10 chunks as a sample of concepts
      const sampleChunks = s.chunks.slice(0, 10).map((c) => {
        let locator = "";
        if (c.page) locator = `[Page ${c.page}]`;
        else if (c.startTime !== null && c.startTime !== undefined) {
          const m = Math.floor(c.startTime / 60);
          const s = Math.floor(c.startTime % 60);
          locator = `[Time: ${m}:${s.toString().padStart(2, "0")}]`;
        }
        return {
          locator,
          chunkId: c.id,
          text: c.text.slice(0, 300), // snippet
        };
      });

      return {
        id: s.id,
        title: s.title,
        type: s.type,
        chunks: sampleChunks,
      };
    });

    // 3. Request structured roadmap from OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ message: "OPENAI_API_KEY is not configured on the server." });
      return;
    }

    const openai = new OpenAI({ apiKey });

    const prompt = `You are a curriculum designer. Based on the following source materials (YouTube videos, PDFs, webpages, transcripts) in this notebook, generate a structured, personalized learning roadmap.
The roadmap should break down the key topics from these sources into a logical progression of milestones (3 to 5 milestones).

Sources Data:
${JSON.stringify(sourcesMeta, null, 2)}

You must return a JSON object (and ONLY the JSON object, no markdown formatting or block wrapping) with the following structure:
{
  "title": "Title of the Learning Roadmap",
  "description": "A high-level description of what this roadmap covers",
  "milestones": [
    {
      "title": "Milestone Title",
      "description": "What the learner will achieve in this step",
      "concepts": ["Concept Name A", "Concept Name B"],
      "references": [
        {
          "sourceId": "The UUID of the matching source from the sources data",
          "sourceTitle": "Title of the source",
          "chunkId": "The chunkId of the sample chunk if relevant, or null",
          "timestampText": "Human-readable label (e.g., '02:45' or 'Page 3')",
          "startTime": number (the starting time in seconds if it is YOUTUBE or VTT type, or page number if PDF, or null otherwise)
        }
      ]
    }
  ]
}

Ensure that the milestones are logical, clear, and connect directly to the original source IDs and references provided in the sources data.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const roadmapJSON = JSON.parse(completion.choices[0]?.message?.content || "{}");
    res.json(roadmapJSON);
  } catch (err) {
    next(err);
  }
});

export default router;

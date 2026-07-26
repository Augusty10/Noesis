import { Router, Request, Response, NextFunction } from "express";
import { OpenAI } from "openai";
import { getEmbedding } from "../lib/ingestion/embedder";
import { retrieveRelevantChunks } from "../lib/rag/retriever";
import { buildPrompt } from "../lib/rag/prompt-builder";
import { parseCitations } from "../lib/rag/citation-parser";

const router = Router();

// POST /api/query - Grounded RAG query answer streaming
router.post("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { notebookId, question } = req.body;

    if (!notebookId || !question) {
      res.status(400).json({ message: "Both notebookId and question are required." });
      return;
    }

    // Setup chunked streaming headers
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // 1. Generate query embedding
    let queryEmbedding: number[];
    try {
      queryEmbedding = await getEmbedding(question);
    } catch (err) {
      res.write(JSON.stringify({ type: "token", data: "Error: Failed to process query embeddings." }) + "\n");
      res.end();
      return;
    }

    // 2. Query matching chunks
    const chunks = await retrieveRelevantChunks(notebookId, queryEmbedding, 6);
    if (chunks.length === 0) {
      res.write(
        JSON.stringify({
          type: "token",
          data: "No sources are indexed and ready to query in this notebook. Please add a source first.",
        }) + "\n"
      );
      res.write(JSON.stringify({ type: "citations", data: [] }) + "\n");
      res.end();
      return;
    }

    // 3. Build grounding prompts
    const { systemPrompt, userPrompt } = buildPrompt(question, chunks);

    // 4. Stream chat completion from OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      res.write(JSON.stringify({ type: "token", data: "Error: OPENAI_API_KEY is missing on server." }) + "\n");
      res.end();
      return;
    }

    const openai = new OpenAI({ apiKey });

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: true,
      temperature: 0.1, // low temperature for high grounding accuracy
    });

    let fullResponseText = "";
    for await (const streamChunk of stream) {
      const token = streamChunk.choices[0]?.delta?.content || "";
      if (token) {
        fullResponseText += token;
        res.write(JSON.stringify({ type: "token", data: token }) + "\n");
      }
    }

    // 5. Parse inline markers from the output and return corresponding citations metadata
    const citations = parseCitations(fullResponseText, chunks);
    res.write(JSON.stringify({ type: "citations", data: citations }) + "\n");
    res.end();
  } catch (err) {
    console.error("[Query Stream] Error:", err);
    res.write(JSON.stringify({ type: "token", data: "\nAn error occurred while synthesizing the answer." }) + "\n");
    res.end();
  }
});

export default router;

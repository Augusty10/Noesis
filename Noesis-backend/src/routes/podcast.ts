import { Router, Request, Response, NextFunction } from "express";
import { OpenAI } from "openai";
import path from "path";
import fs from "fs";
import * as googleTTS from "google-tts-api";
import { db } from "../lib/db";

const router = Router();

const podcastDir = path.resolve(__dirname, "../../uploads/podcasts");
if (!fs.existsSync(podcastDir)) {
  fs.mkdirSync(podcastDir, { recursive: true });
}

interface ScriptLine {
  speaker: "Lisa" | "Dan";
  text: string;
}

// POST /api/podcast - Generates the podcast script and synthesizes host voices
router.post("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { notebookId } = req.body;

    if (!notebookId) {
      res.status(400).json({ message: "notebookId is required." });
      return;
    }

    // 1. Fetch sources text
    const chunks = await db.chunk.findMany({
      where: {
        source: {
          notebookId,
          status: "READY",
        },
      },
    });

    if (chunks.length === 0) {
      res.status(400).json({
        message: "No ready sources found. Add and index at least one source to create a podcast.",
      });
      return;
    }

    const sourceText = chunks
      .map((c) => c.text)
      .join("\n\n")
      .slice(0, 15000); // limit to gpt-4o-mini context window chunk limit safely

    // 2. Generate podcast conversation script
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ message: "OPENAI_API_KEY is not configured on the server." });
      return;
    }

    const openai = new OpenAI({ apiKey });

    const prompt = `You are a scriptwriter for a professional tech podcast. Based on the following source materials, write a conversational dialogue script between two hosts:
- Lisa (host, smart, asks interesting questions, British accent)
- Dan (co-host, expert, explains concepts clearly, American accent)

They should discuss the main findings, concepts, and takeaways from the source material in an engaging, easy-to-follow way. Alternate speakers: Lisa speaks first, then Dan, then Lisa, etc.

Format the output EXACTLY like this (with no markdown styling, headers or bold text):
Lisa: Hello everyone and welcome to our podcast! Today we are discussing...
Dan: Yes Lisa, it's a fascinating topic because...
Lisa: That makes sense! But what about...

Source Material:
${sourceText}

Write about 8-12 dialogue lines. Ensure there is no additional introductory or concluding text, only the script lines starting with "Lisa:" or "Dan:".`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const scriptText = completion.choices[0]?.message?.content || "";
    const lines = scriptText.split("\n");
    const script: ScriptLine[] = [];

    for (let line of lines) {
      line = line.trim();
      const match = line.match(/^(Lisa|Dan):\s*(.*)$/i);
      if (match) {
        script.push({
          speaker: match[1].toLowerCase() === "lisa" ? "Lisa" : "Dan",
          text: match[2].trim(),
        });
      }
    }

    if (script.length === 0) {
      res.status(500).json({
        message: "Failed to parse generated podcast script. Please try again.",
        rawText: scriptText,
      });
      return;
    }

    // 3. Audio generation (Text-To-Speech)
    // Lisa uses British accent ('en-GB'), Dan uses US accent ('en-US')
    const audioFilePath = path.join(podcastDir, `${notebookId}.mp3`);
    let audioGenerated = false;
    let warning: string | undefined;

    try {
      const audioBuffers: Buffer[] = [];

      for (const line of script) {
        const lang = line.speaker === "Lisa" ? "en-GB" : "en-US";
        
        // Split line text into 180-character chunks (Google TTS limit is 200 characters)
        const textParts = splitTextIntoParts(line.text, 180);

        for (const part of textParts) {
          const base64 = await googleTTS.getAudioBase64(part, {
            lang,
            slow: false,
            host: "https://translate.google.com",
            timeout: 8000,
          });
          audioBuffers.push(Buffer.from(base64, "base64"));
        }

        // Add a tiny silence buffer between speakers (optional, but 100ms silence helps natural flow)
        // A simple raw 100ms MP3 silence frame or just simple concatenation
      }

      // Concatenate all MP3 buffers
      const finalBuffer = Buffer.concat(audioBuffers);
      fs.writeFileSync(audioFilePath, finalBuffer);
      audioGenerated = true;
    } catch (err) {
      console.error("[Podcast Audio Gen] Failed to synthesize audio. Error:", err);
      warning = "Could not generate audio due to translation rate-limiting or network issues, but the script is ready below!";
    }

    res.json({
      script,
      audioUrl: audioGenerated ? `/api/podcast/play/${notebookId}` : null,
      warning,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/podcast/play/:notebookId - Serves generated podcast audio file
router.get("/play/:notebookId", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { notebookId } = req.params;
    const audioFilePath = path.join(podcastDir, `${notebookId}.mp3`);

    if (!fs.existsSync(audioFilePath)) {
      res.status(404).json({ message: "Podcast audio file not found." });
      return;
    }

    res.sendFile(audioFilePath);
  } catch (err) {
    next(err);
  }
});

/**
 * Splits string text into chunks of maximum length, breaking at space boundaries.
 */
function splitTextIntoParts(text: string, maxLength: number): string[] {
  const parts: string[] = [];
  const words = text.split(" ");
  let currentPart = "";

  for (const word of words) {
    if ((currentPart + " " + word).trim().length > maxLength) {
      if (currentPart.trim()) parts.push(currentPart.trim());
      currentPart = word;
    } else {
      currentPart = currentPart ? currentPart + " " + word : word;
    }
  }

  if (currentPart.trim()) {
    parts.push(currentPart.trim());
  }

  return parts;
}

export default router;

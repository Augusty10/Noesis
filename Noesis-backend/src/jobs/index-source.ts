import { db } from "../lib/db";
import { extractPdf } from "../lib/ingestion/extractors/pdf";
import { extractText } from "../lib/ingestion/extractors/text";
import { extractUrl } from "../lib/ingestion/extractors/url";
import { extractYoutube } from "../lib/ingestion/extractors/youtube";
import { extractVtt } from "../lib/ingestion/extractors/vtt";
import { chunkText, chunkCues } from "../lib/ingestion/chunker";
import { getEmbeddingsBatch } from "../lib/ingestion/embedder";

/**
 * Background worker task to fully ingest, extract, chunk, embed and index a source.
 * Updates source database status at each state of the pipeline.
 */
export async function indexSource(sourceId: string): Promise<void> {
  try {
    const source = await db.source.findUnique({ where: { id: sourceId } });
    if (!source) {
      console.warn(`[Index Job] Source ${sourceId} not found in DB.`);
      return;
    }

    // 1. Extraction phase
    await db.source.update({
      where: { id: sourceId },
      data: { status: "EXTRACTING", errorMessage: null },
    });

    let chunksToEmbed: { text: string; page?: number; startTime?: number; endTime?: number }[] = [];
    let updatedTitle = source.title;

    if (source.type === "TEXT") {
      let rawText = "";
      if (source.metadata) {
        try {
          const meta = JSON.parse(source.metadata);
          rawText = meta.content || "";
        } catch {
          rawText = source.metadata;
        }
      }
      const text = await extractText(rawText);
      await db.source.update({ where: { id: sourceId }, data: { status: "CHUNKING" } });
      const chunks = chunkText(text);
      chunksToEmbed = chunks.map((c) => ({ text: c.text }));

    } else if (source.type === "PDF") {
      if (!source.filePath) {
        throw new Error("PDF file path not registered on server.");
      }
      const pages = await extractPdf(source.filePath);
      await db.source.update({ where: { id: sourceId }, data: { status: "CHUNKING" } });
      for (const p of pages) {
        const pageChunks = chunkText(p.text, 1000, 200, p.page);
        chunksToEmbed.push(...pageChunks.map((c) => ({ text: c.text, page: c.page })));
      }

    } else if (source.type === "URL") {
      if (!source.originalUrl) {
        throw new Error("No website URL provided.");
      }
      const webPage = await extractUrl(source.originalUrl);
      updatedTitle = webPage.title;
      await db.source.update({
        where: { id: sourceId },
        data: { status: "CHUNKING", title: updatedTitle },
      });
      const chunks = chunkText(webPage.text);
      chunksToEmbed = chunks.map((c) => ({ text: c.text }));

    } else if (source.type === "YOUTUBE") {
      if (!source.originalUrl) {
        throw new Error("No YouTube URL provided.");
      }
      const yt = await extractYoutube(source.originalUrl);
      updatedTitle = yt.title;
      await db.source.update({
        where: { id: sourceId },
        data: { status: "CHUNKING", title: updatedTitle },
      });
      const cues = chunkCues(yt.cues);
      chunksToEmbed = cues.map((c) => ({
        text: c.text,
        startTime: c.startTime,
        endTime: c.endTime,
      }));

    } else if (source.type === "VTT") {
      if (!source.filePath) {
        throw new Error("VTT file path not registered on server.");
      }
      const cues = await extractVtt(source.filePath);
      await db.source.update({ where: { id: sourceId }, data: { status: "CHUNKING" } });
      const chunks = chunkCues(cues);
      chunksToEmbed = chunks.map((c) => ({
        text: c.text,
        startTime: c.startTime,
        endTime: c.endTime,
      }));
    }

    if (chunksToEmbed.length === 0) {
      throw new Error("No readable text could be extracted from this source.");
    }

    // 2. Embedding phase
    await db.source.update({ where: { id: sourceId }, data: { status: "EMBEDDING" } });

    const batchSize = 100;
    const texts = chunksToEmbed.map((c) => c.text);
    const embeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchEmbeddings = await getEmbeddingsBatch(batch);
      embeddings.push(...batchEmbeddings);
    }

    // 3. Storing phase
    const prismaChunksData = chunksToEmbed.map((chunk, idx) => ({
      sourceId,
      text: chunk.text,
      page: chunk.page,
      startTime: chunk.startTime,
      endTime: chunk.endTime,
      embedding: JSON.stringify(embeddings[idx]),
    }));

    // Delete any existing chunks if re-indexing, then bulk insert
    await db.$transaction([
      db.chunk.deleteMany({ where: { sourceId } }),
      db.chunk.createMany({ data: prismaChunksData }),
    ]);

    // Complete source status update
    await db.source.update({
      where: { id: sourceId },
      data: { status: "READY" },
    });

    console.log(`[Index Job] Successfully indexed source: ${sourceId} (${updatedTitle})`);
  } catch (err) {
    const errorMsg = (err as Error).message || "Unknown error during ingestion pipeline.";
    console.error(`[Index Job] Ingestion failed for source: ${sourceId}. Error:`, err);

    await db.source.update({
      where: { id: sourceId },
      data: {
        status: "FAILED",
        errorMessage: errorMsg,
      },
    });
  }
}

import { db } from "../db";

export interface RetrievedChunk {
  id: string;
  sourceId: string;
  sourceTitle: string;
  sourceType: string;
  text: string;
  page?: number | null;
  startTime?: number | null;
  endTime?: number | null;
  similarity: number;
}

function dotProduct(vecA: number[], vecB: number[]): number {
  let product = 0;
  const len = Math.min(vecA.length, vecB.length);
  for (let i = 0; i < len; i++) {
    product += vecA[i] * vecB[i];
  }
  return product;
}

function magnitude(vec: number[]): number {
  let sum = 0;
  for (let i = 0; i < vec.length; i++) {
    sum += vec[i] * vec[i];
  }
  return Math.sqrt(sum);
}

/**
 * Computes cosine similarity between two vector arrays.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const magA = magnitude(vecA);
  const magB = magnitude(vecB);
  if (magA === 0 || magB === 0) return 0;
  return dotProduct(vecA, vecB) / (magA * magB);
}

/**
 * Retrieves the most relevant chunks in a notebook by generating similarities with the query vector.
 */
export async function retrieveRelevantChunks(
  notebookId: string,
  queryEmbedding: number[],
  topK = 6
): Promise<RetrievedChunk[]> {
  // Query all chunks belonging to ready sources in this notebook
  const chunks = await db.chunk.findMany({
    where: {
      source: {
        notebookId,
        status: "READY",
      },
    },
    include: {
      source: true,
    },
  });

  const scoredChunks = chunks.map((chunk) => {
    let embeddingVector: number[] = [];
    try {
      embeddingVector = JSON.parse(chunk.embedding);
    } catch {
      // Empty vector if error parsing
    }

    const similarity = cosineSimilarity(queryEmbedding, embeddingVector);

    return {
      id: chunk.id,
      sourceId: chunk.sourceId,
      sourceTitle: chunk.source.title,
      sourceType: chunk.source.type,
      text: chunk.text,
      page: chunk.page,
      startTime: chunk.startTime,
      endTime: chunk.endTime,
      similarity,
    };
  });

  // Sort descending and return top K
  return scoredChunks
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

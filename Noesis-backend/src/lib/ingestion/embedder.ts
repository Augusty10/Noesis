import { OpenAI } from "openai";

let openaiInstance: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is missing.");
    }
    openaiInstance = new OpenAI({ apiKey });
  }
  return openaiInstance;
}

/**
 * Generates a 1536-dimensional vector embedding for the input text using text-embedding-3-small.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const client = getOpenAI();
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text.replace(/\n/g, " "),
  });

  if (!response.data || response.data.length === 0) {
    throw new Error("OpenAI API did not return any embeddings.");
  }

  return response.data[0].embedding;
}

/**
 * Generates embeddings for a batch of texts in a single request.
 */
export async function getEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const client = getOpenAI();
  const cleanTexts = texts.map((t) => t.replace(/\n/g, " "));

  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: cleanTexts,
  });

  // Ensure response order matches input
  const sortedData = [...response.data].sort((a, b) => a.index - b.index);
  return sortedData.map((item) => item.embedding);
}

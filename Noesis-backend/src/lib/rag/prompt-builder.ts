import { RetrievedChunk } from "./retriever";

export interface PromptPayload {
  systemPrompt: string;
  userPrompt: string;
}

/**
 * Builds grounded prompts for OpenAI RAG, framing the retrieved context and instructing citation behaviors.
 */
export function buildPrompt(question: string, chunks: RetrievedChunk[]): PromptPayload {
  const contextStr = chunks
    .map((chunk, index) => {
      const sourceIndex = index + 1;
      let details = "";
      if (chunk.page) {
        details = ` (Page ${chunk.page})`;
      } else if (chunk.startTime !== undefined && chunk.startTime !== null) {
        details = ` (Starts at ${Math.floor(chunk.startTime)}s)`;
      }
      return `[Source S${sourceIndex}] Title: "${chunk.sourceTitle}" (Type: ${chunk.sourceType})${details}\nContent: ${chunk.text}\n---`;
    })
    .join("\n\n");

  const systemPrompt = `You are an expert AI research assistant. Your objective is to answer the user's question using ONLY the provided text chunks in the context.

Strict Grounding Rules:
1. Every answer must be strictly grounded in the context. If the context does not contain the answer, say: "I am sorry, but the provided sources do not contain the information to answer this question."
2. You MUST cite your claims using inline markers like [S1], [S2], [S3] (where S1 refers to [Source S1], S2 to [Source S2], etc.).
3. Place the citation marker immediately at the end of the sentence or clause that references that source. For example: "The company reported a 20% increase in revenue [S1]. However, operating expenses also rose by 15% [S2]."
4. If a statement is supported by multiple sources, cite them all, e.g., [S1][S3].
5. Do NOT use your own training data or assume facts not explicitly mentioned in the context. Keep the tone objective and academic.`;

  const userPrompt = `Context:
${contextStr}

Question:
${question}

Answer:`;

  return { systemPrompt, userPrompt };
}

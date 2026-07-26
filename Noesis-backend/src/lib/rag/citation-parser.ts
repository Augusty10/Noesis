import { RetrievedChunk } from "./retriever";

export interface CitationLocation {
  page?: number;
  startTime?: number;
  endTime?: number;
  charStart?: number;
  charEnd?: number;
}

export interface Citation {
  marker: string; // e.g. "S1"
  chunkId: string;
  sourceId: string;
  sourceTitle: string;
  sourceType: string;
  snippet: string;
  location: CitationLocation;
}

/**
 * Parses inline citation markers (e.g., [S1], [S2]) from the LLM text output
 * and maps them back to original source chunk metadata.
 */
export function parseCitations(responseText: string, retrievedChunks: RetrievedChunk[]): Citation[] {
  const markerRegex = /\[S(\d+)\]/g;
  const matches = Array.from(responseText.matchAll(markerRegex));

  const uniqueIndices = new Set<number>();
  for (const match of matches) {
    const sourceNum = parseInt(match[1], 10);
    const idx = sourceNum - 1; // 1-indexed to 0-indexed
    if (idx >= 0 && idx < retrievedChunks.length) {
      uniqueIndices.add(idx);
    }
  }

  const citations: Citation[] = [];

  for (const idx of uniqueIndices) {
    const chunk = retrievedChunks[idx];
    citations.push({
      marker: `S${idx + 1}`,
      chunkId: chunk.id,
      sourceId: chunk.sourceId,
      sourceTitle: chunk.sourceTitle,
      sourceType: chunk.sourceType,
      snippet: chunk.text,
      location: {
        page: chunk.page ?? undefined,
        startTime: chunk.startTime ?? undefined,
        endTime: chunk.endTime ?? undefined,
      },
    });
  }

  // Sort citations by their marker indices for clean ordering
  return citations.sort((a, b) => {
    const numA = parseInt(a.marker.slice(1), 10);
    const numB = parseInt(b.marker.slice(1), 10);
    return numA - numB;
  });
}

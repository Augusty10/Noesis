export interface ChunkResult {
  text: string;
  page?: number;
  startTime?: number;
  endTime?: number;
  charStart?: number;
  charEnd?: number;
}

/**
 * Standard character-based chunking with sliding window.
 * Splits text into segments, seeking sentence or space boundaries near the end of each window.
 */
export function chunkText(
  text: string,
  chunkSize = 1000,
  overlap = 200,
  defaultPage?: number
): ChunkResult[] {
  if (!text) return [];
  const chunks: ChunkResult[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;
    if (end > text.length) {
      end = text.length;
    } else {
      // Find sentence boundary or space to avoid cutting words
      const lastPeriod = text.lastIndexOf(".", end);
      const lastSpace = text.lastIndexOf(" ", end);
      const boundary = lastPeriod > start + overlap ? lastPeriod + 1 : (lastSpace > start + overlap ? lastSpace : end);
      end = boundary;
    }

    const chunkTextContent = text.slice(start, end).trim();
    if (chunkTextContent) {
      chunks.push({
        text: chunkTextContent,
        page: defaultPage,
        charStart: start,
        charEnd: end,
      });
    }

    start = end - overlap;
    if (start >= text.length - overlap) {
      break;
    }
  }

  return chunks;
}

export interface CueItem {
  text: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
}

/**
 * YouTube and VTT subtitle chunker.
 * Groups cues sequentially until size threshold is met, preserving timing context.
 */
export function chunkCues(cues: CueItem[], targetCharCount = 800): ChunkResult[] {
  if (!cues || cues.length === 0) return [];
  const chunks: ChunkResult[] = [];
  let currentText = "";
  let currentStart = cues[0].startTime;
  let currentEnd = cues[0].endTime;

  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    if (currentText.length + cue.text.length > targetCharCount && currentText.trim()) {
      chunks.push({
        text: currentText.trim(),
        startTime: currentStart,
        endTime: currentEnd,
      });
      // Start new chunk
      currentText = cue.text + " ";
      currentStart = cue.startTime;
      currentEnd = cue.endTime;
    } else {
      currentText += cue.text + " ";
      currentEnd = cue.endTime;
    }
  }

  if (currentText.trim()) {
    chunks.push({
      text: currentText.trim(),
      startTime: currentStart,
      endTime: currentEnd,
    });
  }

  return chunks;
}

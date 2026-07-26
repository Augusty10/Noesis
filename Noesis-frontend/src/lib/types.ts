export type SourceType = "PDF" | "TEXT" | "URL" | "YOUTUBE" | "VTT";

export type IndexStatus =
  | "UPLOADING"
  | "EXTRACTING"
  | "CHUNKING"
  | "EMBEDDING"
  | "READY"
  | "FAILED";

export interface Notebook {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  sourceCount?: number;
}

export interface Source {
  id: string;
  notebookId: string;
  type: SourceType;
  title: string;
  originalUrl?: string | null;
  status: IndexStatus;
  errorMessage?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

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
  sourceType: SourceType;
  snippet: string;
  location: CitationLocation;
}

export interface ChatMessage {
  id: string;
  notebookId: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  createdAt: string;
}

export interface SourceViewPayload {
  type: SourceType;
  filePath?: string;
  originalUrl?: string;
  videoId?: string;
  rawText?: string;
  pageNumber?: number;
  startTime?: number;
  endTime?: number;
  charStart?: number;
  charEnd?: number;
  highlightText?: string;
}

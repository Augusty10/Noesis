"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import type { Citation, SourceViewPayload } from "@/lib/types";
import PdfViewer from "./PdfViewer";
import WebPreview from "./WebPreview";
import YoutubeEmbed from "./YoutubeEmbed";
import TranscriptViewer from "./TranscriptViewer";
import TextViewer from "./TextViewer";
import Skeleton from "@/components/ui/Skeleton";

interface SourceViewerPanelProps {
  citation: Citation | null;
  onClose: () => void;
}

export default function SourceViewerPanel({ citation, onClose }: SourceViewerPanelProps) {
  const [payload, setPayload] = useState<SourceViewPayload | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!citation) {
      setPayload(null);
      return;
    }
    setLoading(true);
    api.sources
      .view(citation.sourceId, citation.chunkId)
      .then(setPayload)
      .finally(() => setLoading(false));
  }, [citation]);

  if (!citation) {
    return (
      <div className="w-[300px] border-l border-border bg-surface1 flex items-center justify-center p-6">
        <p className="text-xs text-textMuted text-center">
          Click a citation number in an answer to view its original source here.
        </p>
      </div>
    );
  }

  return (
    <div className="w-[300px] border-l border-border bg-surface1 flex flex-col">
      <div className="flex items-start justify-between px-4 py-3 border-b border-border">
        <div>
          <p className="text-xs font-medium text-textPrimary truncate max-w-[220px]">{citation.sourceTitle}</p>
          <p className="text-[11px] text-textMuted mt-0.5">cited as [{citation.marker}]</p>
        </div>
        <button onClick={onClose} className="text-textMuted hover:text-textPrimary">
          <X size={15} />
        </button>
      </div>
      <div className="flex-1 min-h-0">
        {loading || !payload ? (
          <div className="p-4 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : payload.type === "PDF" ? (
          <PdfViewer fileUrl={payload.filePath!} pageNumber={payload.pageNumber} />
        ) : payload.type === "URL" ? (
          <WebPreview url={payload.originalUrl!} extractedText={payload.rawText} highlightText={payload.highlightText} />
        ) : payload.type === "YOUTUBE" ? (
          <YoutubeEmbed videoId={payload.videoId!} startTime={payload.startTime} />
        ) : payload.type === "VTT" ? (
          <TranscriptViewer
            fullText={payload.rawText}
            highlightText={payload.highlightText}
            startTime={payload.startTime}
            endTime={payload.endTime}
          />
        ) : (
          <TextViewer fullText={payload.rawText} highlightText={payload.highlightText} />
        )}
      </div>
    </div>
  );
}

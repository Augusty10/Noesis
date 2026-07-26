function formatTimestamp(seconds = 0) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

interface TranscriptViewerProps {
  fullText?: string;
  highlightText?: string;
  startTime?: number;
  endTime?: number;
}

export default function TranscriptViewer({ fullText, highlightText, startTime, endTime }: TranscriptViewerProps) {
  const parts = fullText && highlightText ? fullText.split(highlightText) : [fullText ?? ""];

  return (
    <div className="p-4 text-xs leading-relaxed text-textSecondary overflow-auto h-full">
      {startTime !== undefined && (
        <span className="inline-block mb-3 text-[10px] bg-surface2 border border-borderStrong text-greenBright px-2 py-0.5 rounded">
          {formatTimestamp(startTime)}
          {endTime !== undefined ? ` – ${formatTimestamp(endTime)}` : ""}
        </span>
      )}
      <div>
        {parts.length > 1 ? (
          <>
            {parts[0]}
            <mark className="bg-greenDeep text-textPrimary border-l-2 border-greenBright px-1 rounded-sm block my-2 py-1">
              {highlightText}
            </mark>
            {parts[1]}
          </>
        ) : (
          fullText || "Transcript unavailable."
        )}
      </div>
    </div>
  );
}

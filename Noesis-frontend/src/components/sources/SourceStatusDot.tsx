import clsx from "clsx";
import type { IndexStatus } from "@/lib/types";

const STATUS_CONFIG: Record<IndexStatus, { color: string; label: string; pulse: boolean }> = {
  UPLOADING: { color: "bg-amber", label: "Uploading", pulse: true },
  EXTRACTING: { color: "bg-amber", label: "Extracting content", pulse: true },
  CHUNKING: { color: "bg-amber", label: "Chunking", pulse: true },
  EMBEDDING: { color: "bg-amber", label: "Generating embeddings", pulse: true },
  READY: { color: "bg-greenBright", label: "Ready to query", pulse: false },
  FAILED: { color: "bg-danger", label: "Failed", pulse: false },
};

interface SourceStatusDotProps {
  status: IndexStatus;
  showLabel?: boolean;
}

export default function SourceStatusDot({ status, showLabel = false }: SourceStatusDotProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        {config.pulse && (
          <span
            className={clsx("animate-ping absolute inline-flex h-full w-full rounded-full opacity-60", config.color)}
          />
        )}
        <span className={clsx("relative inline-flex rounded-full h-2 w-2", config.color)} />
      </span>
      {showLabel && <span className="text-xs text-textMuted">{config.label}</span>}
    </span>
  );
}

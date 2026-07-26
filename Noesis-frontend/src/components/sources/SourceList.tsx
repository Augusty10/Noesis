"use client";

import { useState } from "react";
import { MoreVertical, RefreshCw, Trash2 } from "lucide-react";
import clsx from "clsx";
import type { Source } from "@/lib/types";
import SourceStatusDot from "./SourceStatusDot";

interface SourceListProps {
  sources: Source[];
  selectedSourceId: string | null;
  onSelect: (source: Source) => void;
  onRemove: (id: string) => Promise<void>;
  onReindex: (id: string) => Promise<void>;
}

const TYPE_LABEL: Record<Source["type"], string> = {
  PDF: "pdf",
  TEXT: "text",
  URL: "url",
  YOUTUBE: "yt",
  VTT: "vtt",
};

export default function SourceList({ sources, selectedSourceId, onSelect, onRemove, onReindex }: SourceListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  if (sources.length === 0) {
    return <p className="text-xs text-textMuted px-2 py-4">No sources yet. Add one to get started.</p>;
  }

  return (
    <div className="flex flex-col gap-0.5">
      {sources.map((source) => (
        <div
          key={source.id}
          className={clsx(
            "group flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer text-xs transition-colors",
            selectedSourceId === source.id
              ? "bg-surface2 text-textPrimary"
              : "text-textSecondary hover:bg-surface2 hover:text-textPrimary"
          )}
          onClick={() => onSelect(source)}
        >
          <SourceStatusDot status={source.status} />
          <span className="flex-1 truncate">{source.title}</span>
          <span className="text-[9.5px] uppercase tracking-wide text-textMuted">
            {TYPE_LABEL[source.type]}
          </span>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(openMenuId === source.id ? null : source.id);
              }}
              className="opacity-0 group-hover:opacity-100 text-textMuted hover:text-textPrimary p-0.5"
            >
              <MoreVertical size={13} />
            </button>
            {openMenuId === source.id && (
              <div
                className="absolute right-0 mt-1 w-32 rounded-md border border-border bg-surface2 shadow-lg z-10 py-1"
                onMouseLeave={() => setOpenMenuId(null)}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    onReindex(source.id);
                    setOpenMenuId(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-textSecondary hover:text-textPrimary hover:bg-surface1"
                >
                  <RefreshCw size={11} /> Reindex
                </button>
                <button
                  onClick={() => {
                    onRemove(source.id);
                    setOpenMenuId(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-danger hover:bg-surface1"
                >
                  <Trash2 size={11} /> Remove
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

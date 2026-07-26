"use client";

import { FileText, Youtube, Globe, Type, Captions } from "lucide-react";
import type { SourceType } from "@/lib/types";

interface AddSourceGridProps {
  onSelectType: (type: SourceType) => void;
}

const CARDS: { type: SourceType; label: string; desc: string; icon: React.ReactNode }[] = [
  { type: "PDF", label: "PDF", desc: "Upload a document", icon: <FileText size={16} /> },
  { type: "YOUTUBE", label: "YouTube link", desc: "Paste a video or playlist URL", icon: <Youtube size={16} /> },
  { type: "URL", label: "Web link", desc: "Paste any article URL", icon: <Globe size={16} /> },
  { type: "TEXT", label: "Plain text", desc: "Paste or type content", icon: <Type size={16} /> },
  { type: "VTT", label: "Transcript (VTT)", desc: "Upload a caption file", icon: <Captions size={16} /> },
];

export default function AddSourceGrid({ onSelectType }: AddSourceGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {CARDS.map((card) => (
        <button
          key={card.type}
          onClick={() => onSelectType(card.type)}
          className="flex flex-col items-start gap-2.5 rounded-lg border border-border bg-surface1 p-4 text-left hover:border-greenBright hover:bg-surface2 transition-colors"
        >
          <div className="w-8 h-8 rounded-md bg-greenDeep border border-greenMid flex items-center justify-center text-greenBright">
            {card.icon}
          </div>
          <div>
            <p className="text-sm font-medium text-textPrimary">{card.label}</p>
            <p className="text-[11px] text-textMuted">{card.desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Plus, ArrowLeft, MessageSquare, Radio, Compass } from "lucide-react";
import Link from "next/link";
import { useSources } from "@/hooks/useSources";
import SourceList from "@/components/sources/SourceList";
import AddSourceDialog from "@/components/sources/AddSourceDialog";
import ChatPanel from "@/components/chat/ChatPanel";
import PodcastPanel from "@/components/notebook/PodcastPanel";
import RoadmapPanel from "@/components/notebook/RoadmapPanel";
import SourceViewerPanel from "@/components/sources/SourceViewer";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import type { Citation, Source } from "@/lib/types";

export default function NotebookWorkspacePage() {
  const { notebookId } = useParams<{ notebookId: string }>();
  const { sources, loading, addSource, removeSource, reindexSource } = useSources(notebookId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "podcast" | "roadmap">("chat");

  const hasReadySources = sources.some((s) => s.status === "READY");

  return (
    <div className="flex flex-1 min-h-0">
      {/* Sidebar */}
      <aside className="w-[240px] border-r border-border bg-surface1 flex flex-col p-3 gap-3">
        <Link href="/notebooks" className="flex items-center gap-1.5 text-xs text-textMuted hover:text-textPrimary px-1">
          <ArrowLeft size={13} /> All notebooks
        </Link>

        <Button variant="secondary" size="sm" onClick={() => setDialogOpen(true)}>
          <Plus size={14} /> Add source
        </Button>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="space-y-2 px-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8" />
              ))}
            </div>
          ) : (
            <SourceList
              sources={sources}
              selectedSourceId={selectedSource?.id ?? null}
              onSelect={setSelectedSource}
              onRemove={removeSource}
              onReindex={reindexSource}
            />
          )}
        </div>

        <div className="border-t border-border pt-3 flex flex-col gap-1.5 text-[10.5px] text-textMuted px-1">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber" /> Indexing
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-greenBright" /> Ready to query
          </div>
        </div>
      </aside>

      {/* Main Workspace Section */}
      <div className="flex-1 flex flex-col min-h-0 bg-bg">
        {/* Workspace Tab Bar */}
        <div className="flex border-b border-border bg-surface1 px-6 h-12 items-center gap-6 shrink-0">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-1.5 text-xs font-semibold h-full px-1 border-b-2 transition-all cursor-pointer ${
              activeTab === "chat"
                ? "border-greenBright text-greenBright font-bold"
                : "border-transparent text-textMuted hover:text-textPrimary"
            }`}
          >
            <MessageSquare size={14} />
            Chat Q&A
          </button>
          <button
            onClick={() => setActiveTab("podcast")}
            className={`flex items-center gap-1.5 text-xs font-semibold h-full px-1 border-b-2 transition-all cursor-pointer ${
              activeTab === "podcast"
                ? "border-greenBright text-greenBright font-bold"
                : "border-transparent text-textMuted hover:text-textPrimary"
            }`}
          >
            <Radio size={14} />
            Podcast Studio
          </button>
          <button
            onClick={() => setActiveTab("roadmap")}
            className={`flex items-center gap-1.5 text-xs font-semibold h-full px-1 border-b-2 transition-all cursor-pointer ${
              activeTab === "roadmap"
                ? "border-greenBright text-greenBright font-bold"
                : "border-transparent text-textMuted hover:text-textPrimary"
            }`}
          >
            <Compass size={14} />
            Learning Roadmap
          </button>
        </div>

        {/* Dynamic Panels */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className={activeTab === "chat" ? "flex-1 flex flex-col min-h-0" : "hidden"}>
            <ChatPanel
              notebookId={notebookId}
              hasReadySources={hasReadySources}
              onCitationClick={setActiveCitation}
            />
          </div>
          <div className={activeTab === "podcast" ? "flex-1 flex flex-col min-h-0" : "hidden"}>
            <PodcastPanel notebookId={notebookId} />
          </div>
          <div className={activeTab === "roadmap" ? "flex-1 flex flex-col min-h-0" : "hidden"}>
            <RoadmapPanel notebookId={notebookId} onCitationClick={setActiveCitation} />
          </div>
        </div>
      </div>

      {/* Source viewer */}
      <SourceViewerPanel citation={activeCitation} onClose={() => setActiveCitation(null)} />

      <AddSourceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        notebookId={notebookId}
        onSourceAdded={addSource}
      />
    </div>
  );
}

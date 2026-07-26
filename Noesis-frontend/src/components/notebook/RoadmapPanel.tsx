"use client";

import { useState } from "react";
import { Compass, RefreshCw, Play, FileText } from "lucide-react";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import type { Citation } from "@/lib/types";

interface Reference {
  sourceId: string;
  sourceTitle: string;
  chunkId: string | null;
  timestampText: string;
  startTime: number | null;
}

interface Milestone {
  title: string;
  description: string;
  concepts: string[];
  references: Reference[];
}

interface Roadmap {
  title: string;
  description: string;
  milestones: Milestone[];
}

/**
 * Renders the concept learning roadmap panel.
 * Allows users to inspect structured milestones, concepts, and click reference nodes
 * to jump to exact page/timestamp citations in the workspace.
 */
export default function RoadmapPanel({
  notebookId,
  onCitationClick,
}: {
  notebookId: string;
  onCitationClick: (citation: Citation) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generateRoadmap() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notebookId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to generate learning roadmap.");
      }
      const data = await res.json();
      setRoadmap(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleReferenceClick(ref: Reference) {
    const isPdf = ref.timestampText.toLowerCase().includes("page");
    const citation: Citation = {
      marker: ref.timestampText,
      chunkId: ref.chunkId || "view",
      sourceId: ref.sourceId,
      sourceTitle: ref.sourceTitle,
      sourceType: isPdf ? "PDF" : "YOUTUBE",
      snippet: `Roadmap topic matching reference: ${ref.timestampText}`,
      location: {
        startTime: !isPdf && ref.startTime !== null ? ref.startTime : undefined,
        page: isPdf && ref.startTime !== null ? ref.startTime : undefined,
      },
    };
    onCitationClick(citation);
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto p-6 gap-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-base font-semibold text-textPrimary flex items-center gap-2">
            <Compass size={18} className="text-greenBright" /> Learning Roadmap
          </h2>
          <p className="text-xs text-textMuted mt-1">
            Track sequential curriculum topics and pin-point video timestamps or text excerpts.
          </p>
        </div>
        {roadmap && (
          <Button variant="secondary" size="sm" onClick={generateRoadmap} disabled={loading}>
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Regenerate
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-xs text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : !roadmap ? (
        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-border rounded-lg p-10 text-center">
          <Compass size={36} className="text-textMuted mb-3" />
          <h3 className="text-sm font-semibold text-textPrimary mb-1">No Roadmap Synthesized</h3>
          <p className="text-xs text-textMuted max-w-sm mb-6">
            Generate a personalized concept timeline showing exactly where and what to study based on your playlist and document sources.
          </p>
          <Button variant="primary" onClick={generateRoadmap}>
            Generate Roadmap
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-surface1 border border-border p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-textPrimary">{roadmap.title}</h3>
            <p className="text-xs text-textSecondary mt-1 leading-relaxed">{roadmap.description}</p>
          </div>

          <div className="relative pl-6 border-l border-borderStrong ml-2 space-y-8 mt-4">
            {roadmap.milestones.map((milestone, idx) => (
              <div key={idx} className="relative group">
                {/* Visual timeline node */}
                <div className="absolute -left-[30px] top-0 w-3 h-3 rounded-full bg-surface2 border-2 border-greenBright flex items-center justify-center group-hover:bg-greenBright transition-all">
                  <div className="w-1 h-1 rounded-full bg-bg" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-greenBright">
                    Concept Milestone {idx + 1}
                  </span>
                  <h4 className="text-sm font-semibold text-textPrimary">{milestone.title}</h4>
                  <p className="text-xs text-textSecondary leading-relaxed">{milestone.description}</p>

                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {milestone.concepts.map((concept, cIdx) => (
                      <span
                        key={cIdx}
                        className="text-[10px] bg-surface2 border border-border text-textSecondary px-2 py-0.5 rounded"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>

                  {milestone.references && milestone.references.length > 0 && (
                    <div className="mt-2.5">
                      <p className="text-[9.5px] font-bold text-textMuted uppercase tracking-wider mb-1.5">
                        Pinpointed reference links:
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {milestone.references.map((ref, rIdx) => (
                          <button
                            key={rIdx}
                            onClick={() => handleReferenceClick(ref)}
                            className="flex items-center gap-1.5 w-fit text-left text-xs text-greenBright hover:underline cursor-pointer group/item"
                          >
                            {ref.startTime !== null ? (
                              <Play size={11} className="shrink-0 text-amber" />
                            ) : (
                              <FileText size={11} className="shrink-0 text-textMuted" />
                            )}
                            <span className="truncate max-w-[280px] text-textSecondary group-hover/item:text-greenBright">
                              {ref.sourceTitle}
                            </span>
                            <span className="text-[9.5px] bg-greenDeep text-greenBright border border-greenMid/30 px-1 rounded font-mono">
                              {ref.timestampText}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

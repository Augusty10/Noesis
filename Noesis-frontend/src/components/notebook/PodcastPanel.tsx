"use client";

import { useState, useRef } from "react";
import { Play, Pause, Radio, RefreshCw, AlertTriangle, MessageSquare } from "lucide-react";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";

interface ScriptLine {
  speaker: "Lisa" | "Dan";
  text: string;
}

/**
 * Renders the Podcast panel where users can trigger audio dialogue generation
 * based on all ready notebook sources.
 */
export default function PodcastPanel({ notebookId }: { notebookId: string }) {
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState<ScriptLine[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function generatePodcast() {
    setLoading(true);
    setWarning(null);
    try {
      const res = await fetch("/api/podcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notebookId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to generate podcast dialogue.");
      }
      const data = await res.json();
      setScript(data.script || []);
      setAudioUrl(data.audioUrl || null);
      setWarning(data.warning || null);
    } catch (err) {
      setWarning((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function togglePlay() {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto p-6 gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 gap-4 sm:gap-2">
        <div>
          <h2 className="text-base font-semibold text-textPrimary flex items-center gap-2">
            <Radio size={18} className="text-greenBright" /> Podcast Studio
          </h2>
          <p className="text-xs text-textMuted mt-1">
            Generate an alternate voice dialogue discussing your notes and sources.
          </p>
        </div>
        {script.length > 0 && (
          <Button variant="secondary" size="sm" onClick={generatePodcast} disabled={loading}>
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Regenerate
          </Button>
        )}
      </div>

      {warning && (
        <div className="rounded-md border border-amber/40 bg-amber/10 px-4 py-3 text-xs text-amber flex items-start gap-2">
          <AlertTriangle size={14} className="shrink-0 mt-0.5 animate-bounce" />
          <div>{warning}</div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : script.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-border rounded-lg p-10 text-center">
          <Radio size={36} className="text-textMuted mb-3" />
          <h3 className="text-sm font-semibold text-textPrimary mb-1">No Podcast Generated</h3>
          <p className="text-xs text-textMuted max-w-sm mb-6">
            Convert your uploaded documents and notes into an interactive conversation between Lisa and Dan.
          </p>
          <Button variant="primary" onClick={generatePodcast}>
            Generate Podcast
          </Button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-6">
          {audioUrl && (
            <div className="bg-surface1 border border-border p-4 rounded-lg flex items-center justify-between gap-4">
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
              <button
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-greenBright text-[#04150E] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer"
              >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} className="ml-1" fill="currentColor" />}
              </button>
              <div className="flex-1">
                <p className="text-xs font-semibold text-textPrimary">Listen to Discussion</p>
                <p className="text-[11px] text-textMuted mt-0.5">Lisa (en-GB Accent) & Dan (en-US Accent)</p>
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col gap-4">
            <h4 className="text-xs font-semibold text-textMuted uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare size={13} /> Discussion Script
            </h4>
            <div className="flex flex-col gap-4">
              {script.map((line, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col gap-1 p-3.5 rounded-lg border max-w-[80%] ${
                    line.speaker === "Lisa"
                      ? "bg-surface1 border-border self-start rounded-tl-none"
                      : "bg-greenDeep border-greenMid/30 self-end text-right rounded-tr-none"
                  }`}
                  style={{ alignSelf: line.speaker === "Lisa" ? "flex-start" : "flex-end" }}
                >
                  <span className={`text-[10px] font-bold tracking-wider ${line.speaker === "Lisa" ? "text-greenBright" : "text-amber"}`}>
                    {line.speaker}
                  </span>
                  <p className="text-xs leading-relaxed text-textPrimary mt-1 text-left">{line.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

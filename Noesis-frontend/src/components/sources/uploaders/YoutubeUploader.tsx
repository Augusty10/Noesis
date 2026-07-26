"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

interface YoutubeUploaderProps {
  onSubmit: (url: string) => Promise<void>;
  submitting: boolean;
}

const YT_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i;

export default function YoutubeUploader({ onSubmit, submitting }: YoutubeUploaderProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!YT_REGEX.test(url.trim())) {
      setError("Enter a valid YouTube video or playlist URL.");
      return;
    }
    setError(null);
    await onSubmit(url.trim());
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="block text-xs text-textSecondary mb-1.5">YouTube URL</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full h-9 rounded-md bg-surface2 border border-border px-3 text-sm text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-greenBright"
        />
        <p className="text-[10px] text-textMuted mt-1.5">
          Captions/transcript are pulled automatically. Videos without captions can't be indexed yet.
        </p>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      <Button variant="primary" disabled={!url.trim() || submitting} onClick={handleSubmit}>
        {submitting ? "Adding..." : "Add YouTube source"}
      </Button>
    </div>
  );
}

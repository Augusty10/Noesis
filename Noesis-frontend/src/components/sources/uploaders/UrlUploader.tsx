"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

interface UrlUploaderProps {
  onSubmit: (url: string) => Promise<void>;
  submitting: boolean;
}

export default function UrlUploader({ onSubmit, submitting }: UrlUploaderProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  function isValidHttpUrl(value: string) {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  async function handleSubmit() {
    if (!isValidHttpUrl(url)) {
      setError("Enter a valid http(s) URL.");
      return;
    }
    setError(null);
    await onSubmit(url.trim());
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="block text-xs text-textSecondary mb-1.5">Web page URL</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/article"
          className="w-full h-9 rounded-md bg-surface2 border border-border px-3 text-sm text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-greenBright"
        />
        <p className="text-[10px] text-textMuted mt-1.5">
          Article text is extracted server-side; private or internal URLs are rejected.
        </p>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      <Button variant="primary" disabled={!url.trim() || submitting} onClick={handleSubmit}>
        {submitting ? "Adding..." : "Add web source"}
      </Button>
    </div>
  );
}

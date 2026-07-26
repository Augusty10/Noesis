"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

interface TextUploaderProps {
  onSubmit: (title: string, content: string) => Promise<void>;
  submitting: boolean;
}

export default function TextUploader({ onSubmit, submitting }: TextUploaderProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="block text-xs text-textSecondary mb-1.5">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Project abstract"
          className="w-full h-9 rounded-md bg-surface2 border border-border px-3 text-sm text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-greenBright"
        />
      </div>
      <div>
        <label className="block text-xs text-textSecondary mb-1.5">Content</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          placeholder="Paste or type your text here..."
          className="w-full rounded-md bg-surface2 border border-border px-3 py-2 text-sm text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-greenBright resize-none"
        />
      </div>
      <Button
        variant="primary"
        disabled={!title.trim() || !content.trim() || submitting}
        onClick={() => onSubmit(title.trim(), content.trim())}
      >
        {submitting ? "Adding..." : "Add text source"}
      </Button>
    </div>
  );
}

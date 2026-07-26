"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import Button from "@/components/ui/Button";

interface VttUploaderProps {
  onSubmit: (file: File) => Promise<void>;
  submitting: boolean;
}

export default function VttUploader({ onSubmit, submitting }: VttUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File | null) {
    setError(null);
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".vtt")) {
      setError("Please select a .vtt caption file.");
      return;
    }
    setFile(f);
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFile(e.dataTransfer.files?.[0] ?? null);
        }}
        className="cursor-pointer rounded-lg border border-dashed border-borderStrong p-8 text-center hover:border-greenBright transition-colors"
      >
        <UploadCloud className="mx-auto mb-2 text-textMuted" size={22} />
        <p className="text-xs text-textSecondary">
          {file ? file.name : "Click to choose a .vtt file, or drag and drop here"}
        </p>
        <input ref={inputRef} type="file" accept=".vtt" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      <Button variant="primary" disabled={!file || submitting} onClick={() => file && onSubmit(file)}>
        {submitting ? "Uploading..." : "Add transcript source"}
      </Button>
    </div>
  );
}

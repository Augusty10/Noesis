"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import Button from "@/components/ui/Button";

interface PdfUploaderProps {
  onSubmit: (file: File) => Promise<void>;
  submitting: boolean;
}

const MAX_SIZE_MB = 20;

export default function PdfUploader({ onSubmit, submitting }: PdfUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File | null) {
    setError(null);
    if (!f) return;
    if (f.type !== "application/pdf") {
      setError("Please select a PDF file.");
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File exceeds the ${MAX_SIZE_MB}MB limit.`);
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
          {file ? file.name : "Click to choose a PDF, or drag and drop here"}
        </p>
        <p className="text-[10px] text-textMuted mt-1">Max {MAX_SIZE_MB}MB</p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      <Button
        variant="primary"
        disabled={!file || submitting}
        onClick={() => file && onSubmit(file)}
      >
        {submitting ? "Uploading..." : "Add PDF source"}
      </Button>
    </div>
  );
}

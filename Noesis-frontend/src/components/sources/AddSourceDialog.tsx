"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Dialog from "@/components/ui/Dialog";
import AddSourceGrid from "./AddSourceGrid";
import PdfUploader from "./uploaders/PdfUploader";
import TextUploader from "./uploaders/TextUploader";
import UrlUploader from "./uploaders/UrlUploader";
import YoutubeUploader from "./uploaders/YoutubeUploader";
import VttUploader from "./uploaders/VttUploader";
import { api } from "@/lib/api";
import type { Source, SourceType } from "@/lib/types";

interface AddSourceDialogProps {
  open: boolean;
  onClose: () => void;
  notebookId: string;
  onSourceAdded: (source: Source) => void;
}

const TITLES: Record<SourceType, string> = {
  PDF: "Add a PDF",
  TEXT: "Add plain text",
  URL: "Add a web link",
  YOUTUBE: "Add a YouTube source",
  VTT: "Add a transcript",
};

export default function AddSourceDialog({ open, onClose, notebookId, onSourceAdded }: AddSourceDialogProps) {
  const [selectedType, setSelectedType] = useState<SourceType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setSelectedType(null);
    setError(null);
    setSubmitting(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleResult(promise: Promise<Source>) {
    setSubmitting(true);
    setError(null);
    try {
      const source = await promise;
      onSourceAdded(source);
      handleClose();
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={selectedType ? TITLES[selectedType] : "Add a source"}
      width={selectedType ? "440px" : "620px"}
    >
      {selectedType && (
        <button
          onClick={() => setSelectedType(null)}
          className="flex items-center gap-1 text-xs text-textMuted hover:text-textPrimary mb-4"
        >
          <ArrowLeft size={13} /> Back to source types
        </button>
      )}

      {error && <p className="text-xs text-danger mb-3">{error}</p>}

      {!selectedType && <AddSourceGrid onSelectType={setSelectedType} />}

      {selectedType === "PDF" && (
        <PdfUploader
          submitting={submitting}
          onSubmit={(file) => handleResult(api.sources.createFile(notebookId, "PDF", file))}
        />
      )}
      {selectedType === "VTT" && (
        <VttUploader
          submitting={submitting}
          onSubmit={(file) => handleResult(api.sources.createFile(notebookId, "VTT", file))}
        />
      )}
      {selectedType === "TEXT" && (
        <TextUploader
          submitting={submitting}
          onSubmit={(title, content) => handleResult(api.sources.createText(notebookId, title, content))}
        />
      )}
      {selectedType === "URL" && (
        <UrlUploader submitting={submitting} onSubmit={(url) => handleResult(api.sources.createUrl(notebookId, url))} />
      )}
      {selectedType === "YOUTUBE" && (
        <YoutubeUploader
          submitting={submitting}
          onSubmit={(url) => handleResult(api.sources.createYoutube(notebookId, url))}
        />
      )}
    </Dialog>
  );
}

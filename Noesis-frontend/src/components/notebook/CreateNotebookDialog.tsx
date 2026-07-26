"use client";

import { FormEvent, useState } from "react";
import Dialog from "@/components/ui/Dialog";
import Button from "@/components/ui/Button";

interface CreateNotebookDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (title: string) => Promise<unknown>;
}

export default function CreateNotebookDialog({ open, onClose, onCreate }: CreateNotebookDialogProps) {
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onCreate(title.trim());
      setTitle("");
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="New notebook">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs text-textSecondary mb-1.5">Notebook title</label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. MCA final year research"
            className="w-full h-10 rounded-md bg-surface2 border border-border px-3 text-sm text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-greenBright"
          />
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting || !title.trim()}>
            {submitting ? "Creating..." : "Create notebook"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreVertical, Pencil, Trash2, FileStack } from "lucide-react";
import type { Notebook } from "@/lib/types";

interface NotebookCardProps {
  notebook: Notebook;
  onRename: (id: string, title: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function NotebookCard({ notebook, onRename, onDelete }: NotebookCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(notebook.title);
  const [deleting, setDeleting] = useState(false);

  async function handleRenameSubmit() {
    if (title.trim() && title !== notebook.title) {
      await onRename(notebook.id, title.trim());
    }
    setRenaming(false);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete(notebook.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="group relative rounded-lg border border-border bg-surface1 p-4 hover:border-greenBright transition-colors">
      <div className="flex items-start justify-between mb-6">
        <div className="w-9 h-9 rounded-md bg-greenDeep border border-greenMid flex items-center justify-center text-greenBright">
          <FileStack size={16} />
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="text-textMuted hover:text-textPrimary p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 mt-1 w-36 rounded-md border border-border bg-surface2 shadow-lg z-10 py-1"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <button
                onClick={() => {
                  setRenaming(true);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-textSecondary hover:text-textPrimary hover:bg-surface1"
              >
                <Pencil size={12} /> Rename
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-danger hover:bg-surface1"
              >
                <Trash2 size={12} /> {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          )}
        </div>
      </div>

      {renaming ? (
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
          className="w-full bg-surface2 border border-greenBright rounded px-2 py-1 text-sm text-textPrimary mb-1 focus:outline-none"
        />
      ) : (
        <Link href={`/notebooks/${notebook.id}`}>
          <h3 className="text-sm font-medium text-textPrimary mb-1 hover:text-greenBright transition-colors">
            {notebook.title}
          </h3>
        </Link>
      )}
      <p className="text-xs text-textMuted">
        {notebook.sourceCount ?? 0} source{notebook.sourceCount === 1 ? "" : "s"}
      </p>
    </div>
  );
}

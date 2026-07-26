"use client";

import { useState } from "react";
import { Plus, FileStack } from "lucide-react";
import { useNotebooks } from "@/hooks/useNotebooks";
import NotebookCard from "@/components/notebook/NotebookCard";
import CreateNotebookDialog from "@/components/notebook/CreateNotebookDialog";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

export default function NotebooksPage() {
  const { notebooks, loading, error, create, rename, remove } = useNotebooks();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex-1 px-8 py-8 max-w-5xl w-full mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-textPrimary">Your notebooks</h1>
          <p className="text-sm text-textMuted mt-1">
            Each notebook keeps its own isolated set of sources.
          </p>
        </div>
        <Button variant="primary" onClick={() => setDialogOpen(true)}>
          <Plus size={16} /> New notebook
        </Button>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : notebooks.length === 0 ? (
        <EmptyState
          icon={<FileStack size={20} />}
          title="No notebooks yet"
          description="Create your first notebook to start uploading sources and asking grounded questions."
          action={
            <Button variant="primary" onClick={() => setDialogOpen(true)}>
              <Plus size={16} /> Create notebook
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notebooks.map((notebook) => (
            <NotebookCard
              key={notebook.id}
              notebook={notebook}
              onRename={rename}
              onDelete={remove}
            />
          ))}
        </div>
      )}

      <CreateNotebookDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onCreate={create} />
    </div>
  );
}

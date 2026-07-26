"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { Source } from "@/lib/types";

const IN_PROGRESS = new Set(["UPLOADING", "EXTRACTING", "CHUNKING", "EMBEDDING"]);
const POLL_INTERVAL_MS = 2500;

export function useSources(notebookId: string) {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    const data = await api.sources.list(notebookId);
    setSources(data);
    return data;
  }, [notebookId]);

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  // Poll while any source is still indexing, so status dots update live
  // without the user having to refresh the page.
  useEffect(() => {
    const hasInProgress = sources.some((s) => IN_PROGRESS.has(s.status));
    if (hasInProgress && !pollRef.current) {
      pollRef.current = setInterval(refresh, POLL_INTERVAL_MS);
    }
    if (!hasInProgress && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [sources, refresh]);

  const addSource = useCallback((source: Source) => {
    setSources((prev) => [source, ...prev]);
  }, []);

  const removeSource = useCallback(
    async (id: string) => {
      await api.sources.remove(id);
      setSources((prev) => prev.filter((s) => s.id !== id));
    },
    []
  );

  const reindexSource = useCallback(async (id: string) => {
    const updated = await api.sources.reindex(id);
    setSources((prev) => prev.map((s) => (s.id === id ? updated : s)));
  }, []);

  return { sources, loading, refresh, addSource, removeSource, reindexSource };
}

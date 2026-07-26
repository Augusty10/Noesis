"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Notebook } from "@/lib/types";

export function useNotebooks() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.notebooks.list();
      setNotebooks(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (title: string) => {
      const notebook = await api.notebooks.create(title);
      setNotebooks((prev) => [notebook, ...prev]);
      return notebook;
    },
    []
  );

  const rename = useCallback(async (id: string, title: string) => {
    const updated = await api.notebooks.rename(id, title);
    setNotebooks((prev) => prev.map((n) => (n.id === id ? updated : n)));
  }, []);

  const remove = useCallback(async (id: string) => {
    await api.notebooks.remove(id);
    setNotebooks((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return { notebooks, loading, error, refresh, create, rename, remove };
}

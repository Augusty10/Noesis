import type { Notebook, Source, SourceType, SourceViewPayload } from "./types";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ---------- Notebooks ----------
export const api = {
  notebooks: {
    list: () => request<Notebook[]>("/api/notebooks"),
    create: (title: string) =>
      request<Notebook>("/api/notebooks", { method: "POST", body: JSON.stringify({ title }) }),
    rename: (id: string, title: string) =>
      request<Notebook>(`/api/notebooks/${id}`, { method: "PATCH", body: JSON.stringify({ title }) }),
    remove: (id: string) => request<void>(`/api/notebooks/${id}`, { method: "DELETE" }),
    get: (id: string) => request<Notebook & { sources: Source[] }>(`/api/notebooks/${id}`),
  },

  // ---------- Sources ----------
  sources: {
    list: (notebookId: string) =>
      request<Source[]>(`/api/notebooks/${notebookId}/sources`),

    createText: (notebookId: string, title: string, content: string) =>
      request<Source>("/api/sources", {
        method: "POST",
        body: JSON.stringify({ notebookId, type: "TEXT", title, content }),
      }),

    createUrl: (notebookId: string, url: string) =>
      request<Source>("/api/sources", {
        method: "POST",
        body: JSON.stringify({ notebookId, type: "URL", url }),
      }),

    createYoutube: (notebookId: string, url: string) =>
      request<Source>("/api/sources", {
        method: "POST",
        body: JSON.stringify({ notebookId, type: "YOUTUBE", url }),
      }),

    createFile: async (notebookId: string, type: SourceType, file: File) => {
      const form = new FormData();
      form.append("notebookId", notebookId);
      form.append("type", type);
      form.append("file", file);
      const res = await fetch("/api/sources", { method: "POST", body: form });
      if (!res.ok) throw new Error("Upload failed");
      return res.json() as Promise<Source>;
    },

    get: (id: string) => request<Source>(`/api/sources/${id}`),
    remove: (id: string) => request<void>(`/api/sources/${id}`, { method: "DELETE" }),
    reindex: (id: string) => request<Source>(`/api/sources/${id}/reindex`, { method: "POST" }),
    view: (id: string, chunkId?: string) =>
      request<SourceViewPayload>(
        `/api/sources/${id}/view${chunkId ? `?chunkId=${chunkId}` : ""}`
      ),
  },
};

/**
 * Streams a RAG query response from /api/query.
 * Calls onToken for each streamed text chunk, and onDone once the full
 * response (including parsed citations) is available.
 */
export async function streamQuery(
  notebookId: string,
  question: string,
  onToken: (token: string) => void,
  onDone: (citations: import("./types").Citation[]) => void,
  onError: (err: Error) => void
) {
  try {
    const res = await fetch("/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notebookId, question }),
    });
    if (!res.ok || !res.body) throw new Error("Query failed");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Server sends newline-delimited JSON events: {type: "token"|"citations", data}
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        const event = JSON.parse(line);
        if (event.type === "token") onToken(event.data);
        if (event.type === "citations") onDone(event.data);
      }
    }
  } catch (err) {
    onError(err as Error);
  }
}

"use client";

import { useCallback, useState } from "react";
import { streamQuery } from "@/lib/api";
import type { ChatMessage, Citation } from "@/lib/types";

let messageCounter = 0;
function tempId() {
  messageCounter += 1;
  return `temp-${Date.now()}-${messageCounter}`;
}

export function useChat(notebookId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = useCallback(
    (question: string) => {
      setError(null);
      const userMessage: ChatMessage = {
        id: tempId(),
        notebookId,
        role: "user",
        content: question,
        createdAt: new Date().toISOString(),
      };
      const assistantId = tempId();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        notebookId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setIsStreaming(true);

      streamQuery(
        notebookId,
        question,
        (token) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + token } : m))
          );
        },
        (citations: Citation[]) => {
          setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, citations } : m)));
          setIsStreaming(false);
        },
        (err) => {
          setError(err.message || "Something went wrong answering that question.");
          setIsStreaming(false);
        }
      );
    },
    [notebookId]
  );

  return { messages, ask, isStreaming, error };
}

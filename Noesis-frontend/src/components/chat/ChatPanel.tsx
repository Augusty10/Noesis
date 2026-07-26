"use client";

import { useEffect, useRef } from "react";
import { MessageSquareText } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import MessageBubble from "./MessageBubble";
import QueryInput from "./QueryInput";
import EmptyState from "@/components/ui/EmptyState";
import type { Citation } from "@/lib/types";

interface ChatPanelProps {
  notebookId: string;
  hasReadySources: boolean;
  onCitationClick: (citation: Citation) => void;
}

export default function ChatPanel({ notebookId, hasReadySources, onCitationClick }: ChatPanelProps) {
  const { messages, ask, isStreaming, error } = useChat(notebookId);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-auto px-6 py-5 flex flex-col gap-4">
        {messages.length === 0 ? (
          <EmptyState
            icon={<MessageSquareText size={20} />}
            title={hasReadySources ? "Ask your first question" : "Add a source to get started"}
            description={
              hasReadySources
                ? "Answers are grounded in your notebook's sources, with a citation for every claim."
                : "Once a source finishes indexing (green dot), you can start asking questions grounded in it."
            }
          />
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} onCitationClick={onCitationClick} />
          ))
        )}
        {error && (
          <div className="self-start rounded-md border border-danger/40 bg-danger/10 px-3.5 py-2.5 text-xs text-danger max-w-[78%]">
            {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <QueryInput onSubmit={ask} disabled={isStreaming || !hasReadySources} />
    </div>
  );
}

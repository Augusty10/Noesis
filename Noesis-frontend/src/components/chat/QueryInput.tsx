"use client";

import { useState, KeyboardEvent } from "react";
import { ArrowUp } from "lucide-react";

interface QueryInputProps {
  onSubmit: (question: string) => void;
  disabled?: boolean;
}

export default function QueryInput({ onSubmit, disabled }: QueryInputProps) {
  const [value, setValue] = useState("");

  function handleSubmit() {
    if (!value.trim() || disabled) return;
    onSubmit(value.trim());
    setValue("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex items-end gap-2 px-5 py-4 border-t border-border bg-surface1">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        placeholder="Ask a question about your sources..."
        disabled={disabled}
        className="flex-1 resize-none max-h-32 rounded-md bg-surface2 border border-border px-3.5 py-2.5 text-sm text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-greenBright"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className="w-9 h-9 shrink-0 rounded-md bg-greenMid border border-greenBright text-greenBright flex items-center justify-center disabled:opacity-40 hover:bg-greenBright hover:text-[#04150E] transition-colors"
        aria-label="Send question"
      >
        <ArrowUp size={16} />
      </button>
    </div>
  );
}

import ReactMarkdown from "react-markdown";
import clsx from "clsx";
import type { ChatMessage, Citation } from "@/lib/types";
import CitationBadge from "./CitationBadge";

interface MessageBubbleProps {
  message: ChatMessage;
  onCitationClick: (citation: Citation) => void;
}

/**
 * The backend embeds citation markers as [S1], [S2], etc. in the raw answer
 * text. We rewrite those into markdown link syntax pointing at a fake
 * "citation:" scheme, then intercept that scheme in the `a` renderer below
 * to render an interactive badge instead of a normal link. This lets us
 * keep full markdown formatting (bold, lists, code) while still having
 * clickable inline citations.
 */
function toMarkdownWithCitationLinks(content: string) {
  return content.replace(/\[S(\d+)\]/g, (_, n) => `[${n}](citation:S${n})`);
}

export default function MessageBubble({ message, onCitationClick }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const citationByMarker = new Map((message.citations ?? []).map((c) => [c.marker, c]));

  return (
    <div
      className={clsx(
        "text-sm leading-relaxed max-w-[78%]",
        isUser
          ? "self-end bg-greenDeep border border-greenMid rounded-lg rounded-br-sm px-3.5 py-2.5"
          : "self-start bg-surface1 border border-border rounded-lg rounded-bl-sm px-3.5 py-3"
      )}
    >
      {isUser ? (
        <p>{message.content}</p>
      ) : (
        <div className="prose-noesis">
          <ReactMarkdown
            components={{
              a: ({ href, children }) => {
                if (href?.startsWith("citation:")) {
                  const marker = href.replace("citation:", "");
                  const citation = citationByMarker.get(marker);
                  return (
                    <CitationBadge
                      index={Number(children)}
                      onClick={() => citation && onCitationClick(citation)}
                    />
                  );
                }
                return (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-greenBright underline">
                    {children}
                  </a>
                );
              },
            }}
          >
            {toMarkdownWithCitationLinks(message.content)}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}

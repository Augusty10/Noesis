import { ExternalLink } from "lucide-react";

interface WebPreviewProps {
  url: string;
  highlightText?: string;
  extractedText?: string;
}

export default function WebPreview({ url, highlightText, extractedText }: WebPreviewProps) {
  // Split the extracted article text around the cited excerpt so the
  // matched sentence(s) can be visually highlighted, same idea as the
  // text/VTT viewers below.
  const parts =
    extractedText && highlightText ? extractedText.split(highlightText) : [extractedText ?? ""];

  return (
    <div className="flex flex-col h-full">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs text-greenBright hover:underline px-4 pt-3"
      >
        Open original page <ExternalLink size={12} />
      </a>
      <div className="flex-1 overflow-auto p-4 text-xs leading-relaxed text-textSecondary">
        {parts.length > 1 ? (
          <>
            {parts[0]}
            <mark className="bg-greenDeep text-textPrimary border-l-2 border-greenBright px-1 rounded-sm">
              {highlightText}
            </mark>
            {parts[1]}
          </>
        ) : (
          extractedText || "No preview available for this page."
        )}
      </div>
    </div>
  );
}

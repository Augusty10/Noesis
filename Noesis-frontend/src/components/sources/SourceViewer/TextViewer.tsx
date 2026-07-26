interface TextViewerProps {
  fullText?: string;
  highlightText?: string;
}

export default function TextViewer({ fullText, highlightText }: TextViewerProps) {
  const parts = fullText && highlightText ? fullText.split(highlightText) : [fullText ?? ""];

  return (
    <div className="p-4 text-xs leading-relaxed text-textSecondary overflow-auto h-full whitespace-pre-wrap">
      {parts.length > 1 ? (
        <>
          {parts[0]}
          <mark className="bg-greenDeep text-textPrimary border-l-2 border-greenBright px-1 rounded-sm">
            {highlightText}
          </mark>
          {parts[1]}
        </>
      ) : (
        fullText || "No content available."
      )}
    </div>
  );
}

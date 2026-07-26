interface CitationBadgeProps {
  index: number;
  onClick: () => void;
}

export default function CitationBadge({ index, onClick }: CitationBadgeProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center w-4 h-4 text-[9.5px] rounded bg-greenMid text-greenBright border border-greenBright mx-0.5 align-middle hover:bg-greenBright hover:text-[#04150E] transition-colors"
      aria-label={`View source ${index}`}
    >
      {index}
    </button>
  );
}

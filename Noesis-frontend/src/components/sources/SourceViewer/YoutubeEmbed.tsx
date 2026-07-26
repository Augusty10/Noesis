interface YoutubeEmbedProps {
  videoId: string;
  startTime?: number;
}

function formatTimestamp(seconds = 0) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function YoutubeEmbed({ videoId, startTime = 0 }: YoutubeEmbedProps) {
  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="aspect-video w-full rounded-md overflow-hidden border border-border">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?start=${Math.floor(startTime)}`}
          title="Cited YouTube source"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <span className="inline-block w-fit text-[10px] bg-surface2 border border-borderStrong text-greenBright px-2 py-0.5 rounded">
        Cited at {formatTimestamp(startTime)}
      </span>
    </div>
  );
}

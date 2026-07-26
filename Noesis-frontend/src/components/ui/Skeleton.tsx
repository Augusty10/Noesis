import clsx from "clsx";

export default function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-md bg-surface2 border border-border",
        className
      )}
    />
  );
}

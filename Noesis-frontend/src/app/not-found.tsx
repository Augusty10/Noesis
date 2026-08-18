import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg text-textPrimary p-4 text-center">
      <h1 className="text-4xl font-bold text-greenBright mb-2">404</h1>
      <p className="text-textMuted mb-6">Page not found</p>
      <Link
        href="/notebooks"
        className="px-4 py-2 bg-surface2 hover:bg-surface3 text-textPrimary text-sm font-medium rounded-md transition-colors"
      >
        Go to Notebooks
      </Link>
    </div>
  );
}

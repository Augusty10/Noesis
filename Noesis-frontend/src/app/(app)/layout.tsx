import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <header className="flex items-center justify-between px-6 h-14 border-b border-border bg-surface1">
        <Link href="/notebooks" className="flex items-center gap-2 text-greenBright font-semibold text-sm tracking-wide">
          <span className="w-4 h-4 rounded-[4px] bg-greenMid border border-greenBright inline-block" />
          Provenance
        </Link>
        <UserButton afterSignOutUrl="/" />
      </header>
      <main className="flex-1 flex flex-col min-h-0">{children}</main>
    </div>
  );
}

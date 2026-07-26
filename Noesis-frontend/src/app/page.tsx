import Link from "next/link";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg text-center px-6">
      <img src="/logo.png" alt="Noesis Logo" className="w-16 h-16 object-contain mb-6" />
      <h1 className="text-2xl font-semibold text-textPrimary mb-3">Noesis</h1>
      <p className="text-sm text-textMuted max-w-md mb-8">
        Upload PDFs, articles, YouTube videos, and transcripts into isolated notebooks.
        Ask questions grounded in your sources — every answer comes with a citation
        you can click to see exactly where it came from.
      </p>

      <SignedOut>
        <SignInButton mode="modal">
          <button className="h-10 px-5 rounded-md bg-greenMid border border-greenBright text-greenBright text-sm font-medium hover:bg-greenBright hover:text-[#04150E] transition-colors">
            Sign in to get started
          </button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <Link
          href="/notebooks"
          className="h-10 px-5 rounded-md bg-greenMid border border-greenBright text-greenBright text-sm font-medium hover:bg-greenBright hover:text-[#04150E] transition-colors flex items-center"
        >
          Go to your notebooks
        </Link>
      </SignedIn>
    </div>
  );
}

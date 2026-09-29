import type { Metadata } from "next";
import { Newsreader, Manrope } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import "./landing.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Noesis — Turn your knowledge into intelligent, grounded answers",
  description: "Upload PDFs, articles, YouTube videos and transcripts into isolated notebooks. Ask questions grounded in your sources, and click any citation to see exactly where the answer came from.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#4fae7c",
          colorBackground: "#131611",
          colorText: "#f3f4ef",
          colorInputBackground: "#191d17",
          colorInputText: "#f3f4ef",
        },
      }}
    >
      <html lang="en" className={`${newsreader.variable} ${manrope.variable}`}>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}

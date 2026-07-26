import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Provenance — AI Research Assistant",
  description: "Ask questions grounded in your own sources, with citations for every answer.",
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
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Weavy Clone - AI Workflow Builder",
  description: "Visual node-based workflow builder for LLM pipelines",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`${inter.variable} font-sans`} suppressHydrationWarning>
          {/* Auth Header */}
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              zIndex: 1000,
              padding: "13px 16px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <SignedOut>
              <SignInButton mode="modal">
                <button className="btn btn-primary" style={{ padding: "6px 14px", fontSize: 13 }}>
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: { width: 32, height: 32 },
                  },
                }}
              />
            </SignedIn>
          </div>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}

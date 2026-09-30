import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// SEO metadata — tells search engines and social previews what this app is
export const metadata: Metadata = {
  title: "Career Intelligence & Personal Brand Autopilot",
  description: "AI-powered automation system for career intelligence, content generation, and LinkedIn personal brand management.",
  keywords: ["career intelligence", "personal brand", "linkedin automation", "content generation"],
};

import { LenisProvider } from "@/components/lenis-provider";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LenisProvider>
          {children}
        </LenisProvider>
      </body>
    </html>
  );
}

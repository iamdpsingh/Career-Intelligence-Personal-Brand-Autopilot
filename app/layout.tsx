import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { AnimatedBackground } from "@/components/animated-background";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Career Intelligence & Personal Brand Autopilot",
  description: "AI-powered automation system for career intelligence, content generation, and LinkedIn personal brand management.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
      <body className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 overflow-x-hidden selection:bg-orange-500/30 selection:text-orange-900 dark:selection:text-orange-100">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AnimatedBackground />
          <div className="flex min-h-screen w-full relative z-10 pb-20 md:pb-0">
            {/* Desktop: sticky sidebar */}
            <div className="hidden md:block sticky top-0 h-screen shrink-0 z-50">
              <Sidebar />
            </div>
            {/* Mobile: Top header is now handled by Sidebar component, but we need it fixed top and bottom nav fixed bottom */}
            <div className="md:hidden block absolute top-0 w-full z-50">
              <Sidebar />
            </div>
            <main className="flex-1 p-4 md:p-10 min-w-0 mt-16 md:mt-0">
              <div className="max-w-6xl mx-auto w-full">
                {children}
              </div>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, FileText, Settings, BarChart3, Sparkles } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Overview", icon: LayoutDashboard },
    { href: "/github", label: "GitHub Intelligence", icon: Sparkles },
    { href: "/opportunities", label: "Content Ideas", icon: Sparkles },
    { href: "/queue", label: "Queue", icon: FileText },
    { href: "/jobs", label: "Job Intelligence", icon: Briefcase },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 h-full bg-white/60 dark:bg-white/5 backdrop-blur-2xl border-r border-zinc-200 dark:border-white/10 flex-col shrink-0 transition-all duration-300">
        <div className="p-6 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-lime-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight leading-tight">
              Career Intel<br /><span className="text-orange-500 dark:text-orange-400">Autopilot</span>
            </h1>
          </div>
          <ThemeToggle />
        </div>
        <nav className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? "bg-white dark:bg-white/10 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-white/10" 
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                }`}
              >
                <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-orange-500 dark:text-orange-400" : "text-zinc-400 dark:text-zinc-500"}`} />
                <span className="font-medium">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-white/10 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-lime-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight leading-tight">
            Career Intel
          </h1>
        </div>
        <ThemeToggle />
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-200 dark:border-white/10 flex items-center justify-around px-2 pb-safe z-50">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                isActive ? "text-orange-500 dark:text-orange-400" : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold">{link.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

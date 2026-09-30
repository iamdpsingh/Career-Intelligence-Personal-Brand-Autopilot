"use client";

import { markJobVisited } from "@/app/jobs/actions";

export function JobActionButton({ jobId, jobUrl }: { jobId: string, jobUrl: string }) {
  return (
    <a
      href={jobUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => markJobVisited(jobId)}
      className="inline-flex items-center text-sm text-white font-bold bg-orange-500 dark:bg-orange-600 hover:bg-orange-600 dark:hover:bg-orange-500 px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-orange-500/30"
    >
      View Job <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
    </a>
  );
}

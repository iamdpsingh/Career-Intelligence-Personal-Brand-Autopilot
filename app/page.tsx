import Link from "next/link";
import { db } from "@/providers/db";
import { contentCandidates, contentDrafts, jobs } from "@/providers/db/schema";
import { count, eq } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  let pendingOpportunitiesCount = 0;
  let pendingReviewsCount = 0;
  let discoveredJobsCount = 0;

  try {
    const pendingOpportunities = await db.select({ count: count() })
      .from(contentCandidates)
      .where(eq(contentCandidates.status, "IDEA"));
    pendingOpportunitiesCount = pendingOpportunities[0].count;

    const pendingReviews = await db.select({ count: count() })
      .from(contentDrafts)
      .where(eq(contentDrafts.status, "HUMAN_REVIEW"));
    pendingReviewsCount = pendingReviews[0].count;

    const discoveredJobsResult = await db.select({ count: count() }).from(jobs);
    discoveredJobsCount = discoveredJobsResult[0].count;
  } catch (_error) {
    console.warn("Database connection failed, using default counts");
  }

  return (
    <div className="space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      <header>
        <h2 className="text-3xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tight">Today&apos;s Intelligence</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 md:mt-3 text-base md:text-lg font-medium">Your daily digest of career and content opportunities.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* Job Intelligence Card */}
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-2xl p-6 md:p-8 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-xl hover:bg-white dark:hover:bg-white/10 transition-all duration-500 hover:-translate-y-1 group flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-lime-800 dark:text-lime-400 uppercase tracking-widest mb-4">
              Job Intelligence
            </h3>
            <div className="flex items-end gap-3 mb-6 md:mb-8">
              <span className="text-6xl md:text-7xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">{discoveredJobsCount}</span>
              <span className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 mb-1 font-medium">matching jobs</span>
            </div>
          </div>
          <div>
            <Link href="/jobs" className="inline-flex items-center text-sm font-semibold bg-lime-500/10 hover:bg-lime-500/20 text-lime-700 dark:text-lime-300 px-5 py-2.5 rounded-full transition-all">
              Review jobs <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>

        {/* Content Opportunities Card */}
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-2xl p-6 md:p-8 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-xl hover:bg-white dark:hover:bg-white/10 transition-all duration-500 hover:-translate-y-1 group flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase tracking-widest mb-4">
              Content Ideas
            </h3>
          <div className="flex items-end gap-3 mb-6 md:mb-8">
            <span className="text-6xl md:text-7xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">{pendingOpportunitiesCount}</span>
            <span className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 mb-1 font-medium">new stories</span>
          </div>
          </div>
          <div>
            <Link href="/opportunities" className="inline-flex items-center text-sm font-semibold bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/20 text-zinc-700 dark:text-white px-5 py-2.5 rounded-full transition-all">
              Review ideas <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>

        {/* Drafts Awaiting Review Card */}
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-2xl p-6 md:p-8 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-xl hover:bg-white dark:hover:bg-white/10 transition-all duration-500 hover:-translate-y-1 group flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-4">
              Action Required
            </h3>
            <div className="flex items-end gap-3 mb-6 md:mb-8">
              <span className="text-6xl md:text-7xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">{pendingReviewsCount}</span>
              <span className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 mb-1 font-medium">drafts to approve</span>
            </div>
          </div>
          <div>
            <Link href="/queue" className="inline-flex items-center text-sm font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 px-5 py-2.5 rounded-full transition-all">
              Review drafts <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>

        {/* Publishing Calendar Card */}
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-2xl p-6 md:p-8 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-xl hover:bg-white dark:hover:bg-white/10 transition-all duration-500 hover:-translate-y-1">
          <h3 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-4">
            Publishing Queue
          </h3>
          <div className="mt-4 md:mt-6 space-y-4">
            <div>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs md:text-sm font-medium">Next post</p>
              <p className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight mt-1">Thursday 19:00</p>
            </div>
            <div className="h-px w-full bg-zinc-200 dark:bg-white/10" />
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">2 posts scheduled this week.</p>
          </div>
        </div>

      </div>
    </div>
  );
}

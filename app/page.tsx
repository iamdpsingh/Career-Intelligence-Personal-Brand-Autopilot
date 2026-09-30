import Link from "next/link";
import { db } from "@/providers/db";
import { contentCandidates, contentDrafts } from "@/providers/db/schema";
import { count, eq } from "drizzle-orm";

// ----------------------------------------------------------------------
// DASHBOARD OVERVIEW (Rule 51)
// ----------------------------------------------------------------------
// A simple control center to view the state of the intelligence engines.
// ----------------------------------------------------------------------

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  // In a real app, we'd get the user ID from the session (Auth.js)
  // For V1 UI scaffolding, we bypass auth.

  // Fetch quick metrics for the dashboard
  let pendingOpportunitiesCount = 0;
  let pendingReviewsCount = 0;

  try {
    const pendingOpportunities = await db.select({ count: count() })
      .from(contentCandidates)
      .where(eq(contentCandidates.status, "IDEA"));
    pendingOpportunitiesCount = pendingOpportunities[0].count;

    const pendingReviews = await db.select({ count: count() })
      .from(contentDrafts)
      .where(eq(contentDrafts.status, "HUMAN_REVIEW"));
    pendingReviewsCount = pendingReviews[0].count;
  } catch (_error) {
    console.warn("Database connection failed, using default counts for local monkey testing");
  }

  return (
    <div className="flex h-screen bg-zinc-50 text-zinc-900">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-zinc-900 text-zinc-300 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-white tracking-tight leading-tight">
            Career Intelligence <br /> Autopilot
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Link href="/" className="block px-4 py-2 bg-zinc-800 text-white rounded-md font-medium">
            Overview
          </Link>
          <Link href="/opportunities" className="block px-4 py-2 hover:bg-zinc-800 hover:text-white rounded-md">
            Opportunities
            {pendingOpportunitiesCount > 0 && (
              <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingOpportunitiesCount}
              </span>
            )}
          </Link>
          <Link href="/queue" className="block px-4 py-2 hover:bg-zinc-800 hover:text-white rounded-md">
            Queue
            {pendingReviewsCount > 0 && (
              <span className="ml-2 bg-amber-500 text-zinc-900 text-xs px-2 py-0.5 rounded-full font-semibold">
                {pendingReviewsCount}
              </span>
            )}
          </Link>
          <Link href="/jobs" className="block px-4 py-2 hover:bg-zinc-800 hover:text-white rounded-md text-zinc-400">
            Jobs (V2)
          </Link>
          <Link href="/analytics" className="block px-4 py-2 hover:bg-zinc-800 hover:text-white rounded-md text-zinc-400">
            Analytics (V3)
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8">
          <h2 className="text-3xl font-semibold text-zinc-900">Today&apos;s Intelligence</h2>
          <p className="text-zinc-500 mt-1">Your daily digest of career and content opportunities.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* GitHub Opportunities Card */}
          <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              GitHub Intelligence
            </h3>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-zinc-900">{pendingOpportunitiesCount}</span>
              <span className="text-sm text-zinc-500 mb-1">new stories</span>
            </div>
            <div className="mt-4">
              <Link href="/opportunities" className="text-sm text-blue-700 hover:underline font-medium">
                Review opportunities →
              </Link>
            </div>
          </div>

          {/* Drafts Awaiting Review Card */}
          <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Action Required
            </h3>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-amber-500">{pendingReviewsCount}</span>
              <span className="text-sm text-zinc-500 mb-1">drafts to approve</span>
            </div>
            <div className="mt-4">
              <Link href="/queue" className="text-sm text-amber-700 hover:underline font-medium">
                Review drafts →
              </Link>
            </div>
          </div>

          {/* Publishing Calendar Card */}
          <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Publishing Queue
            </h3>
            <p className="text-zinc-600 mt-2">
              Next post: <strong className="text-zinc-900">Thursday 19:00</strong>
            </p>
            <p className="text-zinc-500 text-sm mt-1">2 posts scheduled this week.</p>
          </div>

        </div>
      </main>
    </div>
  );
}

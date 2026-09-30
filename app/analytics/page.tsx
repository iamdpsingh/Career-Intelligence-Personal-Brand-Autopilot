import Link from "next/link";
import { db } from "@/providers/db";
import { automationRuns, contentDrafts, contentCandidates, publishedPosts } from "@/providers/db/schema";
import { count, desc } from "drizzle-orm";

// ----------------------------------------------------------------------
// ANALYTICS PAGE (Spec Point 24, 50)
// ----------------------------------------------------------------------
// WHY THIS EXISTS:
// You need to see what the automation is actually doing. This page shows:
// - Recent automation runs (success/failure/partial)
// - Content pipeline metrics (candidates → drafts → published)
// - API usage patterns
//
// WHY server-side rendering?
// Because these metrics are read directly from SQLite (or Postgres on
// Vercel). No JavaScript framework needed. The page loads fast and
// always shows the latest data because of force-dynamic.
// ----------------------------------------------------------------------

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  // Initialize metrics with defaults for when DB is empty
  let recentRuns: any[] = [];
  let totalCandidates = 0;
  let totalDrafts = 0;
  let totalPublished = 0;
  let totalRuns = 0;
  let successRate = 0;

  try {
    // Fetch recent automation runs
    recentRuns = await db
      .select()
      .from(automationRuns)
      .orderBy(desc(automationRuns.startedAt))
      .limit(20);

    // Calculate aggregate metrics
    const candidateCount = await db.select({ count: count() }).from(contentCandidates);
    totalCandidates = candidateCount[0]?.count || 0;

    const draftCount = await db.select({ count: count() }).from(contentDrafts);
    totalDrafts = draftCount[0]?.count || 0;

    const publishedCount = await db.select({ count: count() }).from(publishedPosts);
    totalPublished = publishedCount[0]?.count || 0;

    totalRuns = recentRuns.length;
    const successfulRuns = recentRuns.filter(r => r.status === "success").length;
    successRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0;
  } catch (_error) {
    console.warn("Database connection failed for analytics page");
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <header className="mb-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-zinc-900">Analytics</h2>
            <p className="text-zinc-500 mt-1">
              Automation run history and content pipeline metrics.
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-800 font-medium"
          >
            ← Back to Overview
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto">
        {/* Pipeline Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Candidates
            </h3>
            <span className="text-3xl font-bold text-zinc-900">{totalCandidates}</span>
            <p className="text-xs text-zinc-400 mt-1">Ideas discovered</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Drafts
            </h3>
            <span className="text-3xl font-bold text-zinc-900">{totalDrafts}</span>
            <p className="text-xs text-zinc-400 mt-1">Content generated</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Published
            </h3>
            <span className="text-3xl font-bold text-emerald-600">{totalPublished}</span>
            <p className="text-xs text-zinc-400 mt-1">Posts live on LinkedIn</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Success Rate
            </h3>
            <span className={`text-3xl font-bold ${successRate >= 80 ? "text-emerald-600" : successRate >= 50 ? "text-amber-500" : "text-red-500"}`}>
              {successRate}%
            </span>
            <p className="text-xs text-zinc-400 mt-1">Automation reliability</p>
          </div>
        </div>

        {/* Recent Runs Table */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200">
            <h3 className="font-semibold text-zinc-900">Recent Automation Runs</h3>
          </div>

          {recentRuns.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              No automation runs recorded yet. Run the daemon or trigger /api/cron/daily.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-zinc-600 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left">Run ID</th>
                  <th className="px-6 py-3 text-left">Trigger</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Started</th>
                  <th className="px-6 py-3 text-right">Errors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {recentRuns.map((run) => {
                  const statusColor =
                    run.status === "success"
                      ? "bg-emerald-100 text-emerald-700"
                      : run.status === "partial"
                      ? "bg-amber-100 text-amber-700"
                      : run.status === "running"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-red-100 text-red-700";

                  return (
                    <tr key={run.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-3 font-mono text-xs text-zinc-500">
                        {run.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-3">{run.trigger}</td>
                      <td className="px-6 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${statusColor}`}>
                          {run.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-zinc-500">
                        {run.startedAt ? new Date(run.startedAt).toLocaleString() : "—"}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className={run.errorsCount > 0 ? "text-red-500 font-semibold" : "text-zinc-400"}>
                          {run.errorsCount || 0}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

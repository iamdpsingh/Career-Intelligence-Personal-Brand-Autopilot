import { db } from "@/providers/db";
import { automationRuns, contentDrafts, contentCandidates, publishedPosts } from "@/providers/db/schema";
import { count, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  // Initialize metrics with defaults for when DB is empty
  let recentRuns: any[] = [];
  let recentCandidates: any[] = [];
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

    // Fetch recent candidates (ideas)
    recentCandidates = await db
      .select()
      .from(contentCandidates)
      .orderBy(desc(contentCandidates.createdAt))
      .limit(10);

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
    <div className="space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      <header>
        <h2 className="text-3xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tight">Analytics</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 md:mt-3 text-base md:text-lg font-medium">
          Automation run history and content pipeline metrics.
        </p>
      </header>

      <div className="space-y-6 md:space-y-8">
        {/* Pipeline Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-2xl p-6 md:p-8 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-xl hover:bg-white dark:hover:bg-white/10 transition-all duration-300">
            <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-4">
              Candidates
            </h3>
            <span className="text-5xl md:text-6xl font-black text-zinc-900 dark:text-white">{totalCandidates}</span>
            <p className="text-sm text-zinc-500 font-medium mt-2">Ideas discovered</p>
          </div>

          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-2xl p-6 md:p-8 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-xl hover:bg-white dark:hover:bg-white/10 transition-all duration-300">
            <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-4">
              Drafts
            </h3>
            <span className="text-5xl md:text-6xl font-black text-zinc-900 dark:text-white">{totalDrafts}</span>
            <p className="text-sm text-zinc-500 font-medium mt-2">Content generated</p>
          </div>

          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-2xl p-6 md:p-8 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-xl hover:bg-white dark:hover:bg-white/10 transition-all duration-300">
            <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-4">
              Published
            </h3>
            <span className="text-5xl md:text-6xl font-black text-lime-600 dark:text-lime-400">{totalPublished}</span>
            <p className="text-sm text-zinc-500 font-medium mt-2">Posts live on LinkedIn</p>
          </div>

          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-2xl p-6 md:p-8 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-xl hover:bg-white dark:hover:bg-white/10 transition-all duration-300">
            <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-4">
              Success Rate
            </h3>
            <span className={`text-5xl md:text-6xl font-black ${successRate >= 80 ? "text-lime-600 dark:text-lime-400" : successRate >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
              {successRate}%
            </span>
            <p className="text-sm text-zinc-500 font-medium mt-2">Automation reliability</p>
          </div>
        </div>

        {/* Recent Runs Table */}
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-2xl rounded-3xl border border-zinc-200 dark:border-white/10 shadow-xl overflow-hidden">
          <div className="px-6 md:px-8 py-5 md:py-6 border-b border-zinc-200 dark:border-white/10 bg-white/40 dark:bg-white/5">
            <h3 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white">Recent Automation Runs</h3>
          </div>

          {recentRuns.length === 0 ? (
            <div className="p-8 md:p-12 text-center">
              <p className="text-zinc-500 dark:text-zinc-400 font-medium">No automation runs recorded yet. Run the daemon to trigger a scan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-zinc-50 dark:bg-black/20 text-zinc-500 dark:text-zinc-400 uppercase text-xs font-bold tracking-wider">
                  <tr>
                    <th className="px-6 md:px-8 py-4">Run ID</th>
                    <th className="px-6 md:px-8 py-4">Trigger</th>
                    <th className="px-6 md:px-8 py-4">Status</th>
                    <th className="px-6 md:px-8 py-4">Started</th>
                    <th className="px-6 md:px-8 py-4 text-right">Errors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
                  {recentRuns.map((run) => {
                    const statusColor =
                      run.status === "success"
                        ? "bg-lime-500/10 dark:bg-lime-500/20 text-lime-700 dark:text-lime-300 border border-lime-500/20 dark:border-lime-500/30"
                        : run.status === "partial"
                        ? "bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 dark:border-amber-500/30"
                        : run.status === "running"
                        ? "bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/20 dark:border-blue-500/30"
                        : "bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/20 dark:border-red-500/30";

                    return (
                      <tr key={run.id} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-6 md:px-8 py-4 font-mono text-xs text-zinc-500 font-medium">
                          {run.id.substring(0, 8)}...
                        </td>
                        <td className="px-6 md:px-8 py-4 text-zinc-700 dark:text-zinc-300 font-medium">{run.trigger}</td>
                        <td className="px-6 md:px-8 py-4">
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-full shadow-sm ${statusColor}`}>
                            {run.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 md:px-8 py-4 text-zinc-500 dark:text-zinc-400 font-medium">
                          {run.startedAt ? new Date(run.startedAt).toLocaleString() : "—"}
                        </td>
                        <td className="px-6 md:px-8 py-4 text-right">
                          <span className={run.errorsCount > 0 ? "text-red-600 dark:text-red-400 font-bold" : "text-zinc-400 dark:text-zinc-500 font-medium"}>
                            {run.errorsCount || 0}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Ideas / Candidates Table */}
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-2xl rounded-3xl border border-zinc-200 dark:border-white/10 shadow-xl overflow-hidden mt-8">
          <div className="px-6 md:px-8 py-5 md:py-6 border-b border-zinc-200 dark:border-white/10 bg-white/40 dark:bg-white/5">
            <h3 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white">Recently Discovered Ideas</h3>
          </div>

          {recentCandidates.length === 0 ? (
            <div className="p-8 md:p-12 text-center">
              <p className="text-zinc-500 dark:text-zinc-400 font-medium">No ideas discovered yet. Ensure GitHub or Tech Intelligence is finding content.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-zinc-50 dark:bg-black/20 text-zinc-500 dark:text-zinc-400 uppercase text-xs font-bold tracking-wider">
                  <tr>
                    <th className="px-6 md:px-8 py-4">Title / Topic</th>
                    <th className="px-6 md:px-8 py-4">Source</th>
                    <th className="px-6 md:px-8 py-4">Status</th>
                    <th className="px-6 md:px-8 py-4 text-right">Discovered</th>
                    <th className="px-6 md:px-8 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
                  {recentCandidates.map((candidate) => {
                    const statusColor =
                      candidate.status === "DRAFTING" || candidate.status === "DRAFTED"
                        ? "bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/20 dark:border-blue-500/30"
                        : candidate.status === "REJECTED"
                        ? "bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/20 dark:border-red-500/30"
                        : "bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 dark:border-amber-500/30";

                    return (
                      <tr key={candidate.id} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-6 md:px-8 py-4 font-bold text-zinc-900 dark:text-white truncate max-w-xs md:max-w-md">
                          {candidate.title}
                        </td>
                        <td className="px-6 md:px-8 py-4 text-zinc-700 dark:text-zinc-300 font-medium uppercase text-xs tracking-wider">
                          {candidate.sourceType}
                        </td>
                        <td className="px-6 md:px-8 py-4">
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-full shadow-sm ${statusColor}`}>
                            {candidate.status}
                          </span>
                        </td>
                        <td className="px-6 md:px-8 py-4 text-right text-zinc-500 dark:text-zinc-400 font-medium">
                          {candidate.createdAt ? Math.max(0, Math.floor((new Date().getTime() - new Date(candidate.createdAt).getTime()) / (1000 * 60 * 60 * 24))) + " days ago" : "—"}
                        </td>
                        <td className="px-6 md:px-8 py-4 text-right">
                          {(candidate.status === "DRAFTED" || candidate.status === "DRAFTING") ? (
                            <a href="/queue" className="text-blue-600 dark:text-blue-400 font-bold hover:underline text-xs">View Draft →</a>
                          ) : (
                            <span className="text-zinc-400 dark:text-zinc-600 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

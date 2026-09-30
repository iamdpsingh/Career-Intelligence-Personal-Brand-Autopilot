import { db } from "@/providers/db";
import { contentCandidates } from "@/providers/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  let candidates: any[] = [];

  try {
    candidates = await db
      .select({
        id: contentCandidates.id,
        title: contentCandidates.title,
        sourceType: contentCandidates.sourceType,
        scoreEvidence: contentCandidates.scoreEvidence,
        scoreRelevance: contentCandidates.scoreRelevance,
        scoreFreshness: contentCandidates.scoreFreshness,
        status: contentCandidates.status,
        createdAt: contentCandidates.createdAt,
      })
      .from(contentCandidates)
      .where(eq(contentCandidates.status, "IDEA"))
      .orderBy(desc(contentCandidates.createdAt))
      .limit(50);
  } catch (_error) {
    console.warn("Database connection failed, showing empty opportunities");
  }

  return (
    <div className="space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      <header>
        <h2 className="text-3xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tight">Content Ideas</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 md:mt-3 text-base md:text-lg font-medium">
          Content opportunities discovered by the intelligence engines.
        </p>
      </header>

      <div>
        {candidates.length === 0 ? (
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-2xl p-8 md:p-12 text-center rounded-3xl border border-zinc-200 dark:border-white/10 shadow-xl">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">No opportunities yet</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
              The intelligence engines haven&apos;t found any content opportunities.
              Run the automation daemon to trigger a scan.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {candidates.map((candidate) => {
              // Calculate a combined score for visual display
              const avgScore = Math.round(
                ((candidate.scoreEvidence || 0) +
                  (candidate.scoreRelevance || 0) +
                  (candidate.scoreFreshness || 0)) /
                  3
              );

              // Color coding based on combined score
              const scoreColor =
                avgScore >= 80
                  ? "text-lime-700 dark:text-lime-300 border-lime-500/20 dark:border-lime-500/30 bg-lime-500/10 dark:bg-lime-500/20"
                  : avgScore >= 60
                  ? "text-amber-700 dark:text-amber-300 border-amber-500/20 dark:border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/20"
                  : "text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/20 bg-zinc-100 dark:bg-white/10";

              // Source type badge color
              const sourceBadge =
                candidate.sourceType === "github"
                  ? "bg-orange-500/10 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/20 dark:border-orange-500/30"
                  : candidate.sourceType === "TECH_NEWS"
                  ? "bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/20 dark:border-blue-500/30"
                  : candidate.sourceType === "JOB_POSTING"
                  ? "bg-lime-500/10 dark:bg-lime-500/20 text-lime-700 dark:text-lime-300 border-lime-500/20 dark:border-lime-500/30"
                  : "bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-white/20";

              return (
                <div
                  key={candidate.id}
                  className="bg-white/60 dark:bg-white/5 backdrop-blur-2xl rounded-3xl border border-zinc-200 dark:border-white/10 shadow-xl p-6 md:p-8 hover:bg-white dark:hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 group"
                >
                  <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full border uppercase tracking-wider shadow-sm shrink-0 ${sourceBadge}`}
                        >
                          {candidate.sourceType}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-500 font-medium">
                          {candidate.createdAt
                            ? Math.max(0, Math.floor((new Date().getTime() - new Date(candidate.createdAt).getTime()) / (1000 * 60 * 60 * 24))) + " days ago"
                            : ""}
                        </span>
                      </div>
                      <h3 className="font-bold text-zinc-900 dark:text-white text-lg md:text-xl">
                        {candidate.title}
                      </h3>
                    </div>

                    {/* Score Breakdown */}
                    <div className="flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-2 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t border-zinc-200 dark:border-white/10 md:border-none">
                      <span
                        className={`text-xl font-black px-4 py-1.5 rounded-xl border shadow-sm ${scoreColor}`}
                      >
                        {avgScore}
                      </span>
                      <div className="flex flex-row md:flex-col gap-3 md:gap-1 text-xs text-zinc-500 dark:text-zinc-400 md:text-right font-medium">
                        <div className="flex items-center gap-1">Evidence <span className="text-zinc-900 dark:text-white font-bold">{candidate.scoreEvidence || 0}</span></div>
                        <div className="flex items-center gap-1">Relevance <span className="text-zinc-900 dark:text-white font-bold">{candidate.scoreRelevance || 0}</span></div>
                        <div className="flex items-center gap-1">Freshness <span className="text-zinc-900 dark:text-white font-bold">{candidate.scoreFreshness || 0}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

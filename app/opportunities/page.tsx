import Link from "next/link";
import { db } from "@/providers/db";
import { contentCandidates } from "@/providers/db/schema";
import { eq, desc } from "drizzle-orm";

// ----------------------------------------------------------------------
// OPPORTUNITIES PAGE (Spec Point 51)
// ----------------------------------------------------------------------
// WHY THIS EXISTS:
// This page shows all content candidates (IDEAs) that the intelligence
// pipelines have discovered. The user can browse them, see the evidence
// behind each one, and decide which to promote to a draft.
// ----------------------------------------------------------------------

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
    <div className="min-h-screen bg-zinc-50 p-8">
      <header className="mb-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-zinc-900">Opportunities</h2>
            <p className="text-zinc-500 mt-1">
              Content ideas discovered by the intelligence engines.
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
        {candidates.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-zinc-200">
            <h3 className="text-lg font-medium text-zinc-900">No opportunities yet</h3>
            <p className="text-zinc-500 mt-2">
              The intelligence engines haven&apos;t found any content opportunities.
              Run the automation daemon or visit /api/cron/daily to trigger a scan.
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
                  ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                  : avgScore >= 60
                  ? "text-amber-600 bg-amber-50 border-amber-200"
                  : "text-zinc-600 bg-zinc-50 border-zinc-200";

              // Source type badge color
              const sourceBadge =
                candidate.sourceType === "github"
                  ? "bg-purple-100 text-purple-700"
                  : candidate.sourceType === "TECH_NEWS"
                  ? "bg-blue-100 text-blue-700"
                  : candidate.sourceType === "JOB_POSTING"
                  ? "bg-green-100 text-green-700"
                  : "bg-zinc-100 text-zinc-700";

              return (
                <div
                  key={candidate.id}
                  className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded uppercase tracking-wider ${sourceBadge}`}
                        >
                          {candidate.sourceType}
                        </span>
                        <span className="text-xs text-zinc-400">
                          {candidate.createdAt
                            ? new Date(candidate.createdAt).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                      <h3 className="font-medium text-zinc-900 text-lg">
                        {candidate.title}
                      </h3>
                    </div>

                    {/* Score Breakdown */}
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-lg font-bold px-3 py-1 rounded border ${scoreColor}`}
                      >
                        {avgScore}
                      </span>
                      <div className="text-xs text-zinc-400 text-right">
                        <div>Evidence: {candidate.scoreEvidence || 0}</div>
                        <div>Relevance: {candidate.scoreRelevance || 0}</div>
                        <div>Freshness: {candidate.scoreFreshness || 0}</div>
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

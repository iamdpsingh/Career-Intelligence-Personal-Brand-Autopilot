import { db } from "@/providers/db";
import { githubEvidence, repositories, githubActivity } from "@/providers/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function GithubIntelligencePage() {
  let evidenceList: any[] = [];

  try {
    // Fetch GitHub evidence joined with repository and activity info
    evidenceList = await db
      .select({
        id: githubEvidence.id,
        claim: githubEvidence.claim,
        evidenceType: githubEvidence.evidenceType,
        fileReferences: githubEvidence.fileReferences,
        createdAt: githubEvidence.createdAt,
        repositoryName: repositories.name,
        activityDate: githubActivity.activityDate,
        message: githubActivity.message,
        url: githubActivity.url,
      })
      .from(githubEvidence)
      .leftJoin(repositories, eq(githubEvidence.repositoryId, repositories.id))
      .leftJoin(githubActivity, eq(githubEvidence.activityId, githubActivity.id))
      .orderBy(desc(githubEvidence.createdAt))
      .limit(100);
  } catch (_error) {
    console.warn("Database connection failed, showing empty GitHub evidence");
  }

  return (
    <div className="space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      <header>
        <h2 className="text-3xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tight">GitHub Intelligence</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 md:mt-3 text-base md:text-lg font-medium">
          Verified evidence extracted from your codebase and commits.
        </p>
      </header>

      <div>
        {evidenceList.length === 0 ? (
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-2xl p-8 md:p-12 text-center rounded-3xl border border-zinc-200 dark:border-white/10 shadow-xl">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">No evidence found yet</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
              The GitHub Intelligence Engine hasn&apos;t extracted any evidence.
              Make sure your repositories are configured and run a scan.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {evidenceList.map((evidence) => (
              <div
                key={evidence.id}
                className="bg-white/60 dark:bg-white/5 backdrop-blur-2xl rounded-3xl border border-zinc-200 dark:border-white/10 shadow-xl p-6 md:p-8 hover:bg-white dark:hover:bg-white/10 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-4 gap-4">
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-white text-lg md:text-xl">
                      {evidence.claim}
                    </h3>
                    <p className="text-orange-600 dark:text-orange-400 font-semibold mt-1 flex items-center gap-2">
                      <span className="text-xl">🐙</span> {evidence.repositoryName}
                    </p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full border shadow-sm shrink-0 bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/20 dark:border-blue-500/30 uppercase tracking-wider">
                    {evidence.evidenceType}
                  </span>
                </div>

                {evidence.message && (
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 font-medium bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-white/5">
                    {evidence.message}
                  </div>
                )}

                {evidence.fileReferences && (evidence.fileReferences as string[]).length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {(evidence.fileReferences as string[]).map((file: string) => (
                      <span
                        key={file}
                        className="bg-white dark:bg-white/10 border border-zinc-200 dark:border-white/5 text-zinc-700 dark:text-zinc-300 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm dark:shadow-inner font-mono truncate max-w-[200px]"
                        title={file}
                      >
                        {file}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">
                      Generated {Math.max(0, Math.floor((new Date().getTime() - new Date(evidence.createdAt).getTime()) / (1000 * 60 * 60 * 24)))} days ago
                    </span>
                    {evidence.activityDate && (
                      <>
                        <span>•</span>
                        <span>
                          Commit: {Math.max(0, Math.floor((new Date().getTime() - new Date(evidence.activityDate).getTime()) / (1000 * 60 * 60 * 24)))} days ago
                        </span>
                      </>
                    )}
                  </div>
                  {evidence.url && (
                    <a
                      href={evidence.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-zinc-900 dark:text-white hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                    >
                      View Source ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

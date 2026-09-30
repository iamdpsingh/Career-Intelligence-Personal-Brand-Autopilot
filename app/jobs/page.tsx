import Link from "next/link";
import { db } from "@/providers/db";
import { jobs } from "@/providers/db/schema";
import { desc } from "drizzle-orm";

// ----------------------------------------------------------------------
// JOBS INTELLIGENCE PAGE (Spec Point 13, 14)
// ----------------------------------------------------------------------
// WHY THIS EXISTS:
// Shows all jobs discovered by the Job Intelligence Engine. The user can
// see which companies are hiring for their target roles, which skills are
// in demand, and which jobs triggered content candidates.
//
// FUTURE (V3):
// - Match score against user profile
// - One-click "Apply" that pre-fills applications
// - Salary trend charts
// ----------------------------------------------------------------------

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  let discoveredJobs: any[] = [];

  try {
    discoveredJobs = await db
      .select()
      .from(jobs)
      .orderBy(desc(jobs.createdAt))
      .limit(50);
  } catch (_error) {
    console.warn("Database connection failed, showing empty jobs page");
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <header className="mb-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-zinc-900">Job Intelligence</h2>
            <p className="text-zinc-500 mt-1">
              Jobs discovered by the intelligence engine matching your profile.
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
        {discoveredJobs.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-zinc-200">
            <h3 className="text-lg font-medium text-zinc-900">No jobs found yet</h3>
            <p className="text-zinc-500 mt-2">
              The Job Intelligence Engine hasn&apos;t discovered any matching positions.
              Set up your profile and run a scan.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {discoveredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-zinc-900 text-lg">{job.jobTitle}</h3>
                    <p className="text-zinc-600 font-medium">{job.company}</p>
                  </div>
                  {job.remoteType && (
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${
                        job.remoteType === "REMOTE"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {job.remoteType}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-zinc-500 mb-3">
                  {job.location && <span>📍 {job.location}</span>}
                  {job.salary && job.salary !== "UNKNOWN" && (
                    <span className="text-emerald-600 font-medium">💰 {job.salary}</span>
                  )}
                </div>

                {/* Skills Tags */}
                {job.skills && (job.skills as string[]).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(job.skills as string[]).map((skill: string) => (
                      <span
                        key={skill}
                        className="bg-zinc-100 text-zinc-600 text-xs px-2 py-0.5 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {job.jobUrl && (
                  <a
                    href={job.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline font-medium"
                  >
                    View Job →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

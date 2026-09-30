import { db } from "@/providers/db";
import { jobs, profiles, users } from "@/providers/db/schema";
import { desc, eq } from "drizzle-orm";
import { JobsClient } from "./jobs-client";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  let discoveredJobs: any[] = [];
  let userProfile: any = null;

  try {
    const user = await db.query.users.findFirst();
    
    if (user) {
      userProfile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, user.id)
      });
    }

    discoveredJobs = await db
      .select()
      .from(jobs)
      .orderBy(desc(jobs.createdAt))
      .limit(50);
  } catch (_error) {
    console.warn("Database connection failed, showing empty jobs page");
  }

  return (
    <div className="space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      <header>
        <h2 className="text-3xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tight">Job Intelligence</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 md:mt-3 text-base md:text-lg font-medium">
          Jobs discovered by the intelligence engine matching your profile.
        </p>
      </header>

      <JobsClient jobs={discoveredJobs} profile={userProfile} />
    </div>
  );
}

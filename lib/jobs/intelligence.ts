import { db } from "@/providers/db";
import { jobs, profiles, contentCandidates } from "@/providers/db/schema";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";

// ----------------------------------------------------------------------
// JOB INTELLIGENCE ENGINE (V2)
// ----------------------------------------------------------------------
// Discovers relevant job postings based on the user's profile and converts
// interesting market signals into Content Candidates for the AI to draft
// thought-leadership posts about (e.g., "I'm seeing a trend in roles requiring X...").
// ----------------------------------------------------------------------

export class JobIntelligence {
  /**
   * Scans external sources for jobs matching the user's profile.
   * (In production, this could use Playwright/browser-use or a Job Board API)
   */
  async scanForOpportunities(userId: string) {
    console.log(`[JobIntelligence] Scanning for new job opportunities...`);

    // 1. Fetch user profile to know what to look for
    const userProfile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, userId),
    });

    if (!userProfile) {
      console.log(`[JobIntelligence] No profile found for user ${userId}. Skipping job scan.`);
      return;
    }

    const targetRoles = userProfile.targetRoles || ["Software Engineer"];
    const coreSkills = userProfile.coreSkills || ["TypeScript", "React"];

    // 2. Fetch jobs from an external source (Mocked for V2 MVP)
    // In a real scenario, we'd use the provided Playwright integration to scrape LinkedIn/Indeed
    const discoveredJobs = await this.fetchJobsFromSource(targetRoles[0], coreSkills[0]);

    let newJobsCount = 0;

    // 3. Process and store the jobs
    for (const job of discoveredJobs) {
      try {
        // Insert into the raw jobs table. The unique constraint on jobUrl prevents duplicates.
        const [insertedJob] = await db.insert(jobs).values({
          company: job.company,
          jobTitle: job.title,
          location: job.location,
          remoteType: job.remote ? "REMOTE" : "ONSITE",
          salary: job.salary || "UNKNOWN",
          skills: job.skills,
          jobUrl: job.url,
          description: job.description,
          postedAt: new Date(job.postedAt),
        }).onConflictDoNothing().returning();

        if (insertedJob) {
          newJobsCount++;

          // 4. If it's a high-profile company or matches perfectly, create a Content Candidate
          // This allows the AI to draft a post about market trends.
          if (this.isNotableJob({ company: insertedJob.company, skills: insertedJob.skills ?? undefined })) {
            await db.insert(contentCandidates).values({
              userId,
              sourceType: "JOB_POSTING",
              sourceId: insertedJob.id,
              title: `Market Trend: ${insertedJob.company} hiring ${insertedJob.jobTitle} with ${insertedJob.skills?.[0]}`,
              scoreEvidence: 80, // High because it's a real job posting
              scoreRelevance: 85,
              scoreFreshness: 95,
              status: "IDEA",
            });
            console.log(`[JobIntelligence] Promoted job at ${insertedJob.company} to Content Candidate.`);
          }
        }
      } catch (error) {
        console.error(`[JobIntelligence] Failed to process job ${job.url}:`, error);
      }
    }

    console.log(`[JobIntelligence] Scan complete. Found ${newJobsCount} new jobs.`);
  }

  /**
   * Evaluates if a job is interesting enough to post about.
   */
  private isNotableJob(job: { company: string; skills?: string[] }): boolean {
    const notableCompanies = ["Google", "Meta", "Netflix", "Amazon", "Apple", "Stripe", "Vercel", "OpenAI"];
    return notableCompanies.includes(job.company) || (job.skills ? job.skills.length > 3 : false);
  }

  /**
   * Simulates fetching jobs from an API or scraper.
   */
  private async fetchJobsFromSource(role: string, skill: string) {
    // Mock data representing what a Playwright scraper would return
    return [
      {
        company: "Vercel",
        title: `Senior ${role}`,
        location: "San Francisco, CA",
        remote: true,
        salary: "$180k - $220k",
        skills: [skill, "Next.js", "React", "Rust"],
        url: `https://vercel.com/careers/${crypto.randomBytes(4).toString("hex")}`,
        description: "We are looking for an experienced engineer to build the future of the web.",
        postedAt: new Date().toISOString(),
      },
      {
        company: "Stripe",
        title: `Staff ${role}`,
        location: "Seattle, WA",
        remote: false,
        salary: "UNKNOWN",
        skills: [skill, "Ruby", "PostgreSQL"],
        url: `https://stripe.com/jobs/${crypto.randomBytes(4).toString("hex")}`,
        description: "Join our core payments team.",
        postedAt: new Date().toISOString(),
      }
    ];
  }
}

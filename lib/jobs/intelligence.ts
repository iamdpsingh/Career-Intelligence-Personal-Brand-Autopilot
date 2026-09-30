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
    // We pass the new filters down to the fetcher
    const discoveredJobs = await this.fetchJobsFromSource(
      targetRoles[0], 
      coreSkills[0],
      userProfile.locationFilter?.[0] || "worldwide",
      userProfile.salaryFilter?.[0] || "any",
      userProfile.timeFilter || "any"
    );

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
  private async fetchJobsFromSource(role: string, skill: string, locationFilter: string, salaryFilter: string, timeFilter: string) {
    // Generate a deterministic date based on today so we don't create infinitely many jobs, 
    // but we do show fresh ones on a new day.
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Adjust mock data to visually reflect the user's filters
    const mockLocation = locationFilter !== "worldwide" && locationFilter !== "any" ? locationFilter : "San Francisco, CA";
    const mockSalary = salaryFilter !== "any" ? salaryFilter : "$180k - $220k";

    // Fake data generation removed per user request.
    // In production, integrate with a real Job Board API (e.g. LinkedIn, Greenhouse) here.
    return [];
  }
}


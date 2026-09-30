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
        }
      } catch (error) {
        console.error(`[JobIntelligence] Failed to process job ${job.url}:`, error);
      }
    }

    console.log(`[JobIntelligence] Scan complete. Found ${newJobsCount} new jobs.`);
  }



  /**
   * Fetches real jobs from Remotive's free public API, which focuses on remote jobs.
   */
  private async fetchJobsFromSource(role: string, skill: string, locationFilter: string, salaryFilter: string, timeFilter: string) {
    // Build search query from role and primary skill
    const searchTerms = [];
    if (role) searchTerms.push(role);
    if (skill) searchTerms.push(skill);
    
    const searchParam = searchTerms.join(' ').trim();
    const encodedSearch = encodeURIComponent(searchParam);
    
    // Using Remotive's free public API (No auth required, heavily remote focused)
    const url = `https://remotive.com/api/remote-jobs?category=software-dev&limit=30${encodedSearch ? `&search=${encodedSearch}` : ''}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch from Remotive: ${response.statusText}`);
      }
      
      const data = await response.json();
      const rawJobs = data.jobs || [];
      
      return rawJobs.map((j: any) => ({
        title: j.title,
        company: j.company_name,
        location: j.candidate_required_location || 'Worldwide',
        remote: true, // All jobs on Remotive are remote
        salary: j.salary || "UNKNOWN",
        url: j.url,
        description: j.description || j.title,
        postedAt: j.publication_date || new Date().toISOString(),
        skills: j.tags || []
      }));
    } catch (error) {
      console.error(`[JobIntelligence] Error fetching from free job API:`, error);
      return [];
    }
  }
}


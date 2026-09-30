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

    // 2. Fetch jobs from external sources
    const discoveredJobs = await this.fetchAllJobs(
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

    // 4. Promote interesting market signals into Content Candidates
    if (newJobsCount >= 5) {
      try {
        await db.insert(contentCandidates).values({
          userId,
          sourceType: "job_market",
          sourceId: "jobs_sync",
          title: `Hiring Trend: Surging demand for ${coreSkills && coreSkills.length > 0 ? coreSkills[0] : "Tech Skills"} and ${targetRoles && targetRoles.length > 0 ? targetRoles[0] : "Software Engineers"} (${newJobsCount} new remote roles found).`,
          scoreEvidence: 95,
          scoreRelevance: 80,
          scoreFreshness: 90,
          status: "IDEA",
        });
        console.log(`[JobIntelligence] Promoted job market trend to Content Candidate.`);
      } catch (error) {
         console.error(`[JobIntelligence] Failed to create job market content candidate:`, error);
      }
    }
  }

  /**
   * Aggregates jobs from multiple free APIs.
   */
  private async fetchAllJobs(role: string, skill: string, locationFilter: string, salaryFilter: string, timeFilter: string) {
    const [remotive, himalayas, arbeitnow, google] = await Promise.all([
      this.fetchRemotive(role, skill),
      this.fetchHimalayas(role, skill),
      this.fetchArbeitnow(role, skill),
      this.fetchGoogleJobs(role, skill, locationFilter)
    ]);

    // Combine all jobs
    let allJobs = [...remotive, ...himalayas, ...arbeitnow, ...google];
    console.log(`[JobIntelligence] Fetched total ${allJobs.length} jobs (Remotive: ${remotive.length}, Himalayas: ${himalayas.length}, Arbeitnow: ${arbeitnow.length}, Google: ${google.length})`);
    
    // Sort by date (newest first)
    allJobs.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());

    // Deduplicate by URL
    const seenUrls = new Set();
    allJobs = allJobs.filter(job => {
      if (seenUrls.has(job.url)) return false;
      seenUrls.add(job.url);
      return true;
    });

    return allJobs;
  }



  /**
   * Fetches real jobs from Remotive's free public API, which focuses on remote jobs.
   */
  private async fetchRemotive(role: string, skill: string) {
    const searchTerms = [];
    if (role) searchTerms.push(role);
    if (skill) searchTerms.push(skill);
    
    const searchParam = searchTerms.join(' ').trim();
    const encodedSearch = encodeURIComponent(searchParam);
    
    const url = `https://remotive.com/api/remote-jobs?category=software-dev&limit=30${encodedSearch ? `&search=${encodedSearch}` : ''}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) return [];
      
      const data = await response.json();
      return (data.jobs || []).map((j: any) => ({
        title: j.title,
        company: j.company_name,
        location: j.candidate_required_location || 'Worldwide',
        remote: true,
        salary: j.salary || "UNKNOWN",
        url: j.url,
        description: j.description || j.title,
        postedAt: j.publication_date || new Date().toISOString(),
        skills: j.tags || []
      }));
    } catch (error) {
      console.error(`[JobIntelligence] Error fetching from Remotive:`, error);
      return [];
    }
  }

  /**
   * Fetches real jobs from Himalayas API.
   */
  private async fetchHimalayas(role: string, skill: string) {
    try {
      const response = await fetch("https://himalayas.app/jobs/api?limit=50");
      if (!response.ok) return [];
      
      const data = await response.json();
      
      // Filter locally since API doesn't support search easily
      const searchTerm = `${role || ''} ${skill || ''}`.toLowerCase().trim();
      let jobs = data.jobs || [];
      
      if (searchTerm) {
        jobs = jobs.filter((j: any) => 
          (j.title || '').toLowerCase().includes(role?.toLowerCase() || '') ||
          (j.categories || []).some((c: string) => c.toLowerCase().includes(skill?.toLowerCase() || ''))
        );
      }

      return jobs.map((j: any) => ({
        title: j.title,
        company: j.companyName,
        location: (j.locationRestrictions || []).join(", ") || 'Worldwide',
        remote: true,
        salary: j.minSalary ? `${j.currency || '$'}${j.minSalary} - ${j.maxSalary}` : "UNKNOWN",
        url: j.applicationLink || j.guid,
        description: j.description || j.excerpt,
        postedAt: j.pubDate ? new Date(j.pubDate * 1000).toISOString() : new Date().toISOString(),
        skills: j.categories || []
      }));
    } catch (error) {
      console.error(`[JobIntelligence] Error fetching from Himalayas:`, error);
      return [];
    }
  }

  /**
   * Fetches real jobs from Arbeitnow API.
   */
  private async fetchArbeitnow(role: string, skill: string) {
    try {
      const response = await fetch("https://www.arbeitnow.com/api/job-board-api");
      if (!response.ok) return [];
      
      const data = await response.json();
      let jobs = data.data || [];
      
      const searchTerm = `${role || ''} ${skill || ''}`.toLowerCase().trim();
      if (searchTerm) {
        jobs = jobs.filter((j: any) => 
          (j.title || '').toLowerCase().includes(role?.toLowerCase() || '') ||
          (j.tags || []).some((t: string) => t.toLowerCase().includes(skill?.toLowerCase() || ''))
        );
      }

      return jobs.map((j: any) => ({
        title: j.title,
        company: j.company_name,
        location: j.location,
        remote: j.remote,
        salary: "UNKNOWN", // Arbeitnow doesn't provide structured salary in free tier
        url: j.url,
        description: j.description,
        postedAt: j.created_at ? new Date(j.created_at * 1000).toISOString() : new Date().toISOString(),
        skills: j.tags || []
      }));
    } catch (error) {
      console.error(`[JobIntelligence] Error fetching from Arbeitnow:`, error);
      return [];
    }
  }

  /**
   * Fetches jobs from Google Jobs using SerpApi.
   * Requires SERPAPI_API_KEY in .env
   */
  private async fetchGoogleJobs(role: string, skill: string, location: string) {
    const apiKey = process.env.SERPAPI_API_KEY;
    if (!apiKey) {
      console.log(`[JobIntelligence] Skipping Google Jobs (SERPAPI_API_KEY not found)`);
      return [];
    }

    try {
      const query = encodeURIComponent(`${role} ${skill} remote jobs`);
      const response = await fetch(`https://serpapi.com/search.json?engine=google_jobs&q=${query}&hl=en&api_key=${apiKey}`);
      if (!response.ok) return [];

      const data = await response.json();
      const jobs = data.jobs_results || [];

      return jobs.map((j: any) => ({
        title: j.title,
        company: j.company_name,
        location: j.location || "Remote",
        remote: true,
        salary: j.detected_extensions?.salary || "UNKNOWN",
        url: j.share_link || (j.apply_options && j.apply_options[0]?.link) || "",
        description: j.description || j.title,
        postedAt: new Date().toISOString(), // Google Jobs API often doesn't give precise timestamps
        skills: [] // We don't get explicit skill tags from google jobs snippet
      }));
    } catch (error) {
      console.error(`[JobIntelligence] Error fetching from Google Jobs (SerpApi):`, error);
      return [];
    }
  }
}


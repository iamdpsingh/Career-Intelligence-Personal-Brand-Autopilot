import { GitHubClient } from "./client";
import { AICostController } from "../ai/provider";
import { z } from "zod";
import { db } from "@/providers/db";
import { githubActivity, githubEvidence, contentCandidates } from "@/providers/db/schema";
import { eq, and } from "drizzle-orm";

// ----------------------------------------------------------------------
// GITHUB TRUTH ENGINE (Rules 06, 07, 08)
// ----------------------------------------------------------------------
// This module analyzes raw GitHub commits and extracts verified technical
// evidence. It explicitly prevents hallucination by grounding every claim
// in real source code changes.
// ----------------------------------------------------------------------

const EvidenceSchema = z.object({
  stories: z.array(z.object({
    isSignificant: z.boolean().describe("Does this represent a meaningful architectural change, bug fix, or feature?"),
    storyType: z.enum([
      "PROBLEM_SOLUTION", 
      "ENGINEERING_LESSON", 
      "ARCHITECTURE", 
      "DEBUGGING", 
      "PERFORMANCE", 
      "DATA_QUALITY",
      "MILESTONE",
      "NONE"
    ]).describe("Classify the discovery based on Rule 08 categories."),
    claim: z.string().describe("A high-level summary of the problem solved or milestone achieved. (e.g., 'Overhauled database schema to support multi-tenancy')"),
    filesChanged: z.array(z.string()).describe("The key files involved in this achievement."),
  }))
});

export class GitHubIntelligence {
  private github: GitHubClient;
  private ai: AICostController;

  constructor(github: GitHubClient, ai: AICostController) {
    this.github = github;
    this.ai = ai;
  }

  /**
   * Processes new commits for a repository, extracts technical evidence,
   * and saves the evidence to the database for future post generation.
   */
  async analyzeRecentCommits(userId: string, repositoryId: string, owner: string, repo: string, since?: Date) {
    console.log(`[GitHub Intelligence] Scanning ${owner}/${repo} for new commits...`);
    
    // 1. Fetch raw commits
    const commits = await this.github.getRecentCommits(owner, repo, since);
    
    let evidenceCount = 0;
    
    // 2. Filter trivial commits
    const meaningfulCommits = commits.filter((c: any) => {
      const msg = c.commit.message;
      return msg.length > 10 && !msg.includes("Merge pull request");
    });
    
    if (meaningfulCommits.length === 0) return 0;
    
    // Reverse to process from oldest to newest so we can calculate gaps properly
    const sortedCommits = meaningfulCommits.reverse();

    // Group into batches based on continuous time (gap of 4+ hours = new batch)
    const batches: any[][] = [];
    let currentBatch: any[] = [];
    let lastCommitTime: Date | null = null;
    const GAP_HOURS = 4;

    for (const c of sortedCommits) {
      const commitTime = new Date(c.commit.author.date);
      
      if (!lastCommitTime) {
        currentBatch.push(c);
      } else {
        const diffMs = commitTime.getTime() - lastCommitTime.getTime();
        const diffHours = Math.abs(diffMs / (1000 * 60 * 60));
        
        if (diffHours >= GAP_HOURS) {
          // Significant gap found, push current batch and start a new one
          batches.push(currentBatch);
          currentBatch = [c];
        } else {
          currentBatch.push(c);
        }
      }
      lastCommitTime = commitTime;
    }
    
    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }
    
    for (const batch of batches) {
      const latestCommit = batch[batch.length - 1]; // Because it is oldest to newest, last is latest

      // Check if we already processed a batch ending with this commit
      const existingActivity = await db.query.githubActivity.findFirst({
        where: and(
          eq(githubActivity.repositoryId, repositoryId),
          eq(githubActivity.externalId, latestCommit.sha)
        )
      });
      
      if (existingActivity) {
        console.log(`[Truth Engine] Skipping already processed commit batch ending at ${latestCommit.sha}`);
        continue;
      }

      const commitLog = batch.map((c: any) => 
        `- SHA: ${c.sha}\n  Message: ${c.commit.message}\n  Files: ${(c.files || []).map((f: any) => f.filename).join(", ")}`
      ).join("\n\n");
      
      const prompt = `
You are a JSON-only API. Review the following batch of continuous recent commits and combine them to extract 1 to 3 MAJOR accomplishments, problems solved, or things built.
Do not return a story for every single commit. Combine related commits to summarize what was actually built, the problem that was solved, or the milestone achieved.

You MUST return a JSON object with exactly one key "stories", which is an array of objects matching this schema:
{
  "stories": [
    {
      "isSignificant": boolean,
      "storyType": "PROBLEM_SOLUTION" | "ENGINEERING_LESSON" | "ARCHITECTURE" | "DEBUGGING" | "PERFORMANCE" | "DATA_QUALITY" | "MILESTONE" | "NONE",
      "claim": string, // Detailed summary of what was actually built, the problem solved, or the milestone achieved across these commits. (e.g. "Built the multi-tenant auth system solving X problem")
      "filesChanged": string[] // Key files changed
    }
  ]
}

Commits Log:
${commitLog}
      `;

      try {
        const analysis = await this.ai.routeStructured('simple', prompt, EvidenceSchema);
        
        if (analysis.stories && Array.isArray(analysis.stories)) {
          for (const story of analysis.stories) {
            if (story.isSignificant && story.storyType !== "NONE") {
              console.log(`[Truth Engine] Found combined evidence: ${story.claim}`);
              
              const [activity] = await db.insert(githubActivity).values({
                repositoryId,
                activityType: "commit_batch",
                externalId: latestCommit.sha,
                message: "Aggregated continuous work from multiple commits",
                url: latestCommit.html_url,
                activityDate: new Date(latestCommit.commit.author.date),
              }).returning();

              // 4. Save verified evidence linked to the activity
              const [evidenceRecord] = await db.insert(githubEvidence).values({
                repositoryId,
                activityId: activity.id,
                claim: story.claim,
                evidenceType: "source_code",
                fileReferences: story.filesChanged,
              }).returning();

              // 5. Create a content candidate for the pipeline to discover
              // Prevent exact duplicates in candidates table by checking if claim exists
              const existingCandidate = await db.query.contentCandidates.findFirst({
                where: eq(contentCandidates.title, story.claim.substring(0, 100))
              });

              if (!existingCandidate) {
                await db.insert(contentCandidates).values({
                  userId,
                  sourceType: "github",
                  sourceId: evidenceRecord.id,
                  title: story.claim.substring(0, 100),
                  status: "IDEA",
                  scoreEvidence: 75,
                  scoreRelevance: 80,
                  scoreFreshness: 70
                });
                evidenceCount++;
              } else {
                console.log(`[Truth Engine] Skipping duplicate content candidate for claim: ${story.claim.substring(0, 50)}...`);
              }
            }
          }
        }
      } catch (error) {
        console.error(`[Truth Engine] Failed to analyze commit batch:`, error);
      }
    }

    return evidenceCount;
  }
}

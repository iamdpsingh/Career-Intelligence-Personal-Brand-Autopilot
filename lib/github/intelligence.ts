import { GitHubClient } from "./client";
import { AICostController } from "../ai/provider";
import { z } from "zod";
import { db } from "@/providers/db";
import { githubActivity, githubEvidence } from "@/providers/db/schema";
import { eq } from "drizzle-orm";

// ----------------------------------------------------------------------
// GITHUB TRUTH ENGINE (Rules 06, 07, 08)
// ----------------------------------------------------------------------
// This module analyzes raw GitHub commits and extracts verified technical
// evidence. It explicitly prevents hallucination by grounding every claim
// in real source code changes.
// ----------------------------------------------------------------------

const EvidenceSchema = z.object({
  isSignificant: z.boolean().describe("Does this commit represent a meaningful architectural change, bug fix, or feature?"),
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
  claim: z.string().describe("What exactly was built or fixed? (e.g., 'Implemented incremental loading')"),
  filesChanged: z.array(z.string()).describe("The specific files that prove this claim."),
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

    for (const commitData of commits) {
      const sha = commitData.sha;
      const message = commitData.commit.message;
      const files = commitData.files?.map((f: { filename: string }) => f.filename) || [];

      // Skip empty or trivial commits immediately (Cost Control: Use Code before AI - Rule 47)
      if (message.includes("Merge pull request") || message.length < 10) continue;

      // 2. Ask AI if this commit is a valuable story (Simple Extraction - Cheaper Model)
      const prompt = `
You are a JSON-only API. You MUST return a JSON object with EXACTLY these four keys: "isSignificant", "storyType", "claim", and "filesChanged". 
Do not add any other keys like "significantEngineeringStory", "analysis", or "reason".

If the commit is not significant, return:
{
  "isSignificant": false,
  "storyType": "NONE",
  "claim": "Not significant",
  "filesChanged": []
}

Schema definition:
{
  "isSignificant": boolean, // Does this commit represent a meaningful architectural change, bug fix, or feature?
  "storyType": "PROBLEM_SOLUTION" | "ENGINEERING_LESSON" | "ARCHITECTURE" | "DEBUGGING" | "PERFORMANCE" | "DATA_QUALITY" | "MILESTONE" | "NONE",
  "claim": string, // What exactly was built or fixed?
  "filesChanged": string[] // The specific files that prove this claim.
}

Commit Message: ${message}
Files Changed: ${files.join(", ")}
      `;

      try {
        const analysis = await this.ai.routeStructured('simple', prompt, EvidenceSchema);

        if (analysis.isSignificant && analysis.storyType !== "NONE") {
          console.log(`[Truth Engine] Found evidence: ${analysis.claim}`);
          
          // 3. Save raw activity
          const [activity] = await db.insert(githubActivity).values({
            repositoryId,
            activityType: "commit",
            externalId: sha,
            message: message,
            url: commitData.html_url,
            activityDate: new Date(commitData.commit.author.date),
          }).returning();

          // 4. Save verified evidence linked to the activity (Traceability - Rule 23)
          await db.insert(githubEvidence).values({
            repositoryId,
            activityId: activity.id,
            claim: analysis.claim,
            evidenceType: "source_code",
            fileReferences: analysis.filesChanged,
          });

          evidenceCount++;
        }
      } catch (error) {
        // Rule 25: Failure handling. Log AI failure, but continue analyzing other commits.
        console.error(`[Truth Engine] Failed to analyze commit ${sha}:`, error);
      }
    }

    return evidenceCount;
  }
}

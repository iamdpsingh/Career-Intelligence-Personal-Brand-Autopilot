import { GitHubClient } from "./client";
import { AICostController } from "../ai/provider";
import { z } from "zod";
import { db } from "@/providers/db";
import { githubActivity, githubEvidence, contentCandidates } from "@/providers/db/schema";
import { eq, and } from "drizzle-orm";

// ----------------------------------------------------------------------
// GITHUB TRUTH ENGINE — ONE DAILY SUMMARY PER REPO
// ----------------------------------------------------------------------
// Fetches ALL commits since lastSyncAt and produces ONE summary per repo
// per day. If the whole project is done, produces a full project summary.
// Does NOT split into per-commit or per-batch entries.
// ----------------------------------------------------------------------

const DailySummarySchema = z.object({
  isSignificant: z.boolean(),
  storyType: z.enum([
    "PROBLEM_SOLUTION",
    "ENGINEERING_LESSON",
    "ARCHITECTURE",
    "DEBUGGING",
    "PERFORMANCE",
    "DATA_QUALITY",
    "MILESTONE",
    "PROJECT_COMPLETE",
    "NONE",
  ]),
  // ONE headline claim summarising today's entire body of work
  claim: z.string().describe("Single sentence: what was built/solved TODAY across all commits."),
  // Narrative for LinkedIn post angle — the human story behind the work
  narrative: z.string().describe("2-3 sentence narrative suitable for a LinkedIn post about today's work."),
  keyFiles: z.array(z.string()).describe("Most important files changed."),
  isProjectComplete: z.boolean().describe("True if commits indicate the project/feature reached a finished state today."),
});

export class GitHubIntelligence {
  private github: GitHubClient;
  private ai: AICostController;

  constructor(github: GitHubClient, ai: AICostController) {
    this.github = github;
    this.ai = ai;
  }

  /**
   * Fetches all commits since lastSyncAt for a repo and creates ONE daily summary.
   * If the repo has never been synced, fetches the last 7 days.
   */
  async analyzeRecentCommits(
    userId: string,
    repositoryId: string,
    owner: string,
    repo: string,
    since?: Date
  ): Promise<number> {
    console.log(`[GitHub Intelligence] Scanning ${owner}/${repo} for today's work...`);

    // If no since date, look back 7 days on first run
    const sinceDate = since ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const commits = await this.github.getRecentCommits(owner, repo, sinceDate);

    const meaningfulCommits = commits.filter((c: any) => {
      const msg = c.commit.message;
      return (
        msg.length > 10 &&
        !msg.startsWith("Merge pull request") &&
        !msg.startsWith("Merge branch")
      );
    });

    if (meaningfulCommits.length === 0) {
      console.log(`[GitHub Intelligence] No meaningful commits since last sync.`);
      return 0;
    }

    console.log(`[GitHub Intelligence] Found ${meaningfulCommits.length} commits — generating daily summary...`);

    // Build a combined commit log (all commits = one story)
    const latestCommit = meaningfulCommits[0]; // GitHub returns newest first
    const commitLog = meaningfulCommits
      .map((c: any) =>
        `• ${c.commit.message.split("\n")[0]} (${(c.files || []).map((f: any) => f.filename).join(", ")})`
      )
      .join("\n");

    const today = new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });

    const prompt = `You are a technical writer creating a SINGLE daily summary for a developer's LinkedIn audience.

Repository: ${owner}/${repo}
Date: ${today}
Total commits: ${meaningfulCommits.length}

ALL commits from today's work session:
${commitLog}

Analyse ALL commits together and produce ONE cohesive summary of what was built today.
If commits span a feature that's now complete, say so (isProjectComplete: true).
Return JSON only, no markdown.`;

    try {
      const summary = await this.ai.routeStructured("simple", prompt, DailySummarySchema);

      if (!summary.isSignificant || summary.storyType === "NONE") {
        console.log(`[GitHub Intelligence] Work was not significant enough to report.`);
        return 0;
      }

      // Dedup — don't create a second candidate if we already processed this latest commit
      const existing = await db.query.githubActivity.findFirst({
        where: and(
          eq(githubActivity.repositoryId, repositoryId),
          eq(githubActivity.externalId, latestCommit.sha)
        ),
      });

      if (existing) {
        console.log(`[GitHub Intelligence] Today's summary already recorded.`);
        return 0;
      }

      // Persist activity
      const [activity] = await db
        .insert(githubActivity)
        .values({
          repositoryId,
          activityType: "daily_summary",
          externalId: latestCommit.sha,
          message: summary.claim,
          url: latestCommit.html_url,
          activityDate: new Date(latestCommit.commit.author.date),
        })
        .returning();

      // Persist evidence
      const [evidence] = await db
        .insert(githubEvidence)
        .values({
          repositoryId,
          activityId: activity.id,
          claim: summary.narrative,
          evidenceType: "source_code",
          fileReferences: summary.keyFiles,
        })
        .returning();

      // Create content candidate so the content pipeline can draft a post
      const candidateTitle = summary.isProjectComplete
        ? `Project complete: ${summary.claim}`.substring(0, 200)
        : `Today's build: ${summary.claim}`.substring(0, 200);

      const alreadyExists = await db.query.contentCandidates.findFirst({
        where: eq(contentCandidates.title, candidateTitle),
      });

      if (!alreadyExists) {
        await db.insert(contentCandidates).values({
          userId,
          sourceType: "github",
          sourceId: evidence.id,
          title: candidateTitle,
          status: "IDEA",
          scoreEvidence: summary.isProjectComplete ? 95 : 80,
          scoreRelevance: 85,
          scoreFreshness: 95,
        });
        console.log(`[GitHub Intelligence] Daily summary created: "${candidateTitle}"`);
        return 1;
      }

      return 0;
    } catch (error) {
      console.error(`[GitHub Intelligence] Failed to generate daily summary:`, error);
      return 0;
    }
  }
}

import { db } from "@/providers/db";
import { automationRuns, repositories, users } from "@/providers/db/schema";
import { eq } from "drizzle-orm";
import { GitHubClient } from "../github/client";
import { GitHubIntelligence } from "../github/intelligence";
import { JobIntelligence } from "../jobs/intelligence";
import { TechIntelligence } from "../tech/intelligence";
import { ContentDecisionEngine } from "../content/decision";
import { ContentGenerator } from "../content/generator";
import { AICostController, type AIProvider } from "../ai/provider";


// ----------------------------------------------------------------------
// SHARED ORCHESTRATOR (Spec Point 45)
// ----------------------------------------------------------------------
// WHY THIS EXISTS:
// Both the local daemon AND the Vercel cron route need to run the same
// intelligence pipelines. Instead of duplicating that logic, we put it
// here. The daemon calls `runFullCycle()`, the Vercel cron calls
// `runFullCycle()` — same code, different triggers.
//
// ARCHITECTURE (Spec Point 45):
//   daily-orchestrator
//   ├── job-discovery
//   ├── github-sync
//   ├── tech-discovery
//   ├── opportunity-engine (content decision)
//   ├── content-generation
//   └── run-summary
//
// Each pipeline is INDEPENDENTLY FAULT TOLERANT (Spec Point 25):
// If GitHub API fails, we still run tech discovery and job scanning.
// We never let one broken pipeline crash the entire automation cycle.
// ----------------------------------------------------------------------

/**
 * A simple stub AI provider for when no real API keys are configured.
 * This lets the system boot and run pipelines without crashing,
 * even if you haven't set up OpenAI/Gemini keys yet.
 */
class StubAIProvider implements AIProvider {
  name = "stub-ai";

  async generateStructured<T>(prompt: string, schema: any): Promise<T> {
    console.log(`[StubAI] Would process prompt (${prompt.length} chars). Returning default.`);
    // Return a safe default that won't crash downstream code
    return {} as T;
  }

  async generateText(prompt: string): Promise<string> {
    console.log(`[StubAI] Would generate text for prompt (${prompt.length} chars).`);
    return "[AI generation skipped — no API key configured]";
  }
}

export interface CycleResult {
  runId: string;
  trigger: string;
  status: "success" | "partial" | "failed";
  duration: number;
  results: {
    github: { success: boolean; evidenceFound: number; error?: string };
    tech: { success: boolean; trendsFound: number; error?: string };
    jobs: { success: boolean; jobsFound: number; error?: string };
    content: { success: boolean; drafted: number; error?: string };
  };
}

export async function runFullCycle(trigger: "local-daemon" | "vercel-cron" | "manual"): Promise<CycleResult> {
  const startTime = Date.now();
  console.log(`\n${"=".repeat(60)}`);
  console.log(`[Orchestrator] Starting full intelligence cycle (trigger: ${trigger})`);
  console.log(`${"=".repeat(60)}\n`);

  // 1. Log the run in the database (Spec Point 24)
  const [run] = await db.insert(automationRuns).values({
    trigger,
    status: "running",
  }).returning();

  // Initialize results tracker
  const results: CycleResult["results"] = {
    github: { success: false, evidenceFound: 0 },
    tech: { success: false, trendsFound: 0 },
    jobs: { success: false, jobsFound: 0 },
    content: { success: false, drafted: 0 },
  };

  // Find the first user (single-user system for V1)
  const user = await db.query.users.findFirst();
  const userId = user?.id || "system";

  let aiProvider: AIProvider;
  if (process.env.GROQ_API_KEY) {
    const { GroqProvider } = require("../ai/groq");
    aiProvider = new GroqProvider(process.env.GROQ_API_KEY);
  } else if (process.env.OPENAI_API_KEY) {
    const { OpenAIProvider } = require("../ai/openai");
    aiProvider = new OpenAIProvider(process.env.OPENAI_API_KEY);
  } else {
    aiProvider = new StubAIProvider();
  }
  const aiController = new AICostController(aiProvider, aiProvider);

  // --- PIPELINE 1: GITHUB INTELLIGENCE (Spec Point 6) ---
  try {
    console.log(`\n[Orchestrator] ▶ Pipeline 1: GitHub Intelligence`);
    const githubClient = new GitHubClient(userId);
    const githubIntel = new GitHubIntelligence(githubClient, aiController);

    // Fetch all tracked repositories for this user
    let repos = await db.query.repositories.findMany({
      where: eq(repositories.userId, userId),
    });

    if (repos.length === 0) {
      console.log(`[Orchestrator] Auto-tracking iamdpsingh/Career-Intelligence-Personal-Brand-Autopilot...`);
      // Ensure user exists for foreign key constraint
      const existingUser = await db.query.users.findFirst({ where: eq(users.id, userId) });
      if (!existingUser) {
        await db.insert(users).values({ id: userId, email: "system@localhost" });
      }
      const [newRepo] = await db.insert(repositories).values({
        userId,
        name: "iamdpsingh/Career-Intelligence-Personal-Brand-Autopilot",
        description: "Default repository",
      }).returning();
      repos = [newRepo];
    }

    let totalEvidence = 0;
    for (const repo of repos) {
      try {
        const [owner, repoName] = repo.name.split("/");
        if (!owner || !repoName) continue;

        const evidenceCount = await githubIntel.analyzeRecentCommits(
          userId, repo.id, owner, repoName, repo.lastSyncAt || undefined
        );
        totalEvidence += evidenceCount;
      } catch (repoError) {
        // Spec Point 25: One repo failing doesn't kill the whole pipeline
        console.error(`[Orchestrator] Failed to scan repo ${repo.name}:`, repoError);
      }
    }

    results.github = { success: true, evidenceFound: totalEvidence };
    console.log(`[Orchestrator] ✓ GitHub: Found ${totalEvidence} new evidence items`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    results.github = { success: false, evidenceFound: 0, error: msg };
    console.error(`[Orchestrator] ✗ GitHub pipeline failed:`, msg);
    // Spec Point 25: Continue to the next pipeline
  }

  // --- PIPELINE 2: TECH INTELLIGENCE (Spec Point 9) ---
  try {
    console.log(`\n[Orchestrator] ▶ Pipeline 2: Tech Intelligence`);
    const techIntel = new TechIntelligence();
    await techIntel.scanForTrends(userId);
    results.tech = { success: true, trendsFound: 0 }; // TechIntel logs its own count
    console.log(`[Orchestrator] ✓ Tech Intelligence complete`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    results.tech = { success: false, trendsFound: 0, error: msg };
    console.error(`[Orchestrator] ✗ Tech pipeline failed:`, msg);
  }

  // --- PIPELINE 3: JOB INTELLIGENCE (Spec Point 13) ---
  try {
    console.log(`\n[Orchestrator] ▶ Pipeline 3: Job Intelligence`);
    const jobIntel = new JobIntelligence();
    await jobIntel.scanForOpportunities(userId);
    results.jobs = { success: true, jobsFound: 0 };
    console.log(`[Orchestrator] ✓ Job Intelligence complete`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    results.jobs = { success: false, jobsFound: 0, error: msg };
    console.error(`[Orchestrator] ✗ Job pipeline failed:`, msg);
  }

  // --- PIPELINE 4: CONTENT GENERATION (Spec Point 18) ---
  try {
    console.log(`\n[Orchestrator] ▶ Pipeline 4: Content Decision + Generation`);
    const decisionEngine = new ContentDecisionEngine();
    const contentGenerator = new ContentGenerator(aiController);

    // Should we draft anything today?
    const shouldDraft = await decisionEngine.shouldDraftNewContent(userId);

    if (shouldDraft) {
      const bestCandidate = await decisionEngine.getNextBestCandidate(userId);
      if (bestCandidate) {
        try {
          await contentGenerator.generateFromCandidate(bestCandidate.id, userId);
          results.content = { success: true, drafted: 1 };
          console.log(`[Orchestrator] ✓ Drafted content for: ${bestCandidate.title}`);
        } catch (genError) {
          console.error(`[Orchestrator] Content generation failed for candidate:`, genError);
          results.content = { success: false, drafted: 0, error: String(genError) };
        }
      } else {
        console.log(`[Orchestrator] No viable candidates to draft.`);
        results.content = { success: true, drafted: 0 };
      }
    } else {
      console.log(`[Orchestrator] Decision Engine says: No drafting needed today.`);
      results.content = { success: true, drafted: 0 };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    results.content = { success: false, drafted: 0, error: msg };
    console.error(`[Orchestrator] ✗ Content pipeline failed:`, msg);
  }

  // --- FINALIZE RUN (Spec Point 24) ---
  const duration = Date.now() - startTime;
  const hasFailures = Object.values(results).some(r => !r.success);
  const allFailed = Object.values(results).every(r => !r.success);
  const finalStatus = allFailed ? "failed" : hasFailures ? "partial" : "success";

  await db.update(automationRuns)
    .set({
      status: finalStatus,
      finishedAt: new Date(),
      errorsCount: Object.values(results).filter(r => !r.success).length,
    })
    .where(eq(automationRuns.id, run.id));

  console.log(`\n${"=".repeat(60)}`);
  console.log(`[Orchestrator] Cycle complete in ${duration}ms — Status: ${finalStatus.toUpperCase()}`);
  console.log(`${"=".repeat(60)}\n`);

  return {
    runId: run.id,
    trigger,
    status: finalStatus,
    duration,
    results,
  };
}

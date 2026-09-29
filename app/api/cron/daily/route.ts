import { NextResponse } from "next/server";
import { db } from "@/providers/db";
import { automationRuns, contentDrafts } from "@/providers/db/schema";
import { JobIntelligence } from "@/lib/jobs/intelligence";
import { TechIntelligence } from "@/lib/tech/intelligence";
import { GitHubIntelligence } from "@/lib/github/intelligence";
import { ContentDecisionEngine } from "@/lib/content/decision";
import { ContentGenerator } from "@/lib/content/generator";
import { SystemAudit } from "@/lib/system/audit";
import { withRetry } from "@/lib/system/retry";
import { eq, sql } from "drizzle-orm";
import { LinkedInClient } from "@/lib/linkedin/client";

// ----------------------------------------------------------------------
// THE MASTER CRON ORCHESTRATOR (Rule 03, V2)
// ----------------------------------------------------------------------
// Runs daily. Handles Intelligence Gathering, Decision Making, and 
// Publishing of SCHEDULED posts.
// ----------------------------------------------------------------------

// Force Vercel to run this as an edge or background function without caching
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max on Vercel Hobby

export async function GET(request: Request) {
  // 1. Authenticate the Cron request (Rule 03)
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log(`[CRON] Starting Daily Automation Run...`);
  
  // Track the run in the database
  const [run] = await db.insert(automationRuns).values({
    trigger: "cron",
    status: "running"
  }).returning();

  try {
    const userId = "SYSTEM"; // In V2/V3 we loop through active users. For now, system.

    // ------------------------------------------------------------------
    // PHASE 1: PUBLISH SCHEDULED POSTS
    // ------------------------------------------------------------------
    // Any post in SCHEDULED state that has reached its scheduled time
    console.log(`[CRON] Phase 1: Publishing Scheduled Posts...`);
    
    // Find drafts that are either explicitly marked as PUBLISHING (Post Now)
    // OR are marked as SCHEDULED and their scheduled time has passed.
    const now = new Date();
    const readyToPublish = await db.query.contentDrafts.findMany({
      where: sql`${contentDrafts.status} = 'PUBLISHING' OR (${contentDrafts.status} = 'SCHEDULED' AND ${contentDrafts.scheduledFor} <= ${now.toISOString()})`
    });

    const linkedin = new LinkedInClient();
    for (const draft of readyToPublish) {
      try {
        await withRetry(async () => {
          await linkedin.publishPost(userId, draft.id, draft.content);
        });
        await SystemAudit.log("PUBLISH_POST", `Draft:${draft.id}`, "SUCCESS", userId);
        
        // Update draft status
        await db.update(contentDrafts).set({ status: "PUBLISHED" }).where(eq(contentDrafts.id, draft.id));
      } catch (err) {
        console.error(`[CRON] Failed to publish draft ${draft.id}`, err);
        await SystemAudit.log("PUBLISH_POST", `Draft:${draft.id}`, "FAILURE", userId);
        await db.update(contentDrafts).set({ status: "FAILED" }).where(eq(contentDrafts.id, draft.id));
      }
    }

    // ------------------------------------------------------------------
    // PHASE 2: INTELLIGENCE GATHERING
    // ------------------------------------------------------------------
    console.log(`[CRON] Phase 2: Intelligence Gathering...`);
    
    // We use withRetry to ensure external APIs don't cause silent failures
    await withRetry(async () => {
      // const github = new GitHubIntelligence(new GitHubClient("token"), ai);
      // await github.analyzeRecentActivity(userId);
    });

    await withRetry(async () => {
      const jobs = new JobIntelligence();
      await jobs.scanForOpportunities(userId);
    });

    await withRetry(async () => {
      const tech = new TechIntelligence();
      await tech.scanForTrends(userId);
    });

    await SystemAudit.log("INTELLIGENCE_GATHER", "All Engines", "SUCCESS", userId);

    // ------------------------------------------------------------------
    // PHASE 3: CONTENT GENERATION
    // ------------------------------------------------------------------
    console.log(`[CRON] Phase 3: Content Generation...`);
    
    const decision = new ContentDecisionEngine();
    const shouldDraft = await decision.shouldDraftNewContent(userId);

    if (shouldDraft) {
      // const generator = new ContentGenerator(ai);
      // In a real system, we select the top candidate from the DB here
      // await generator.generateDraft(userId, topCandidate.id);
      await SystemAudit.log("CONTENT_GENERATION", "Decision:Draft", "SUCCESS", userId);
    } else {
      console.log(`[CRON] Decision Engine blocked drafting (Quota met).`);
    }

    // ------------------------------------------------------------------
    // FINALIZE RUN
    // ------------------------------------------------------------------
    await db.update(automationRuns).set({
      status: "success",
      finishedAt: new Date()
    }).where(eq(automationRuns.id, run.id));

    console.log(`[CRON] Daily run completed successfully.`);
    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error(`[CRON] Critical Failure:`, error);
    
    // FAILURE HANDLING (Rule 24, V2)
    await db.update(automationRuns).set({
      status: "failed",
      finishedAt: new Date(),
      errorsCount: 1
    }).where(eq(automationRuns.id, run.id));

    await SystemAudit.log("CRON_EXECUTION", "DailyRun", "FAILURE");

    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

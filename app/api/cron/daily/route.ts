import { NextResponse } from "next/server";
import { runFullCycle } from "@/lib/system/orchestrator";

// ----------------------------------------------------------------------
// DAILY CRON ROUTE (Spec Point 42, 45)
// ----------------------------------------------------------------------
// WHY THIS EXISTS:
// This is the Vercel Cron entry point. When deployed to Vercel, the cron
// scheduler hits this endpoint once per day (free tier limit).
// It calls the SAME orchestrator that the local daemon uses.
//
// Vercel cron config (in vercel.json):
//   { "path": "/api/cron/daily", "schedule": "0 6 * * *" }
//
// SECURITY:
// We verify the CRON_SECRET header to prevent random people from triggering
// your automation by visiting this URL. Vercel sends this header automatically.
// In development, we skip the check so you can test by visiting the URL.
// ----------------------------------------------------------------------

// Force Vercel to run this without caching
export const dynamic = "force-dynamic";

// Allow up to 5 minutes for the full pipeline to run (Vercel Hobby max)
export const maxDuration = 300;

export async function GET(request: Request) {
  // Security: Only Vercel's cron scheduler (or someone with the secret) can trigger this
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // In production, require the secret. In dev, allow direct access for testing.
  if (
    process.env.NODE_ENV === "production" &&
    cronSecret &&
    authHeader !== `Bearer ${cronSecret}`
  ) {
    console.warn("[Cron] Unauthorized cron trigger attempt.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Run the full intelligence cycle using the shared orchestrator
    // Same code path as the local daemon — no duplication
    const result = await runFullCycle("vercel-cron");

    return NextResponse.json({
      success: true,
      runId: result.runId,
      status: result.status,
      duration: `${result.duration}ms`,
      pipelines: {
        github: result.results.github,
        tech: result.results.tech,
        jobs: result.results.jobs,
        content: result.results.content,
      },
    });
  } catch (error) {
    console.error("[Cron] Fatal error in daily cron:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

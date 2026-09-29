import { NextResponse } from "next/server";
import { db } from "@/providers/db";
import { automationRuns } from "@/providers/db/schema";
import { desc } from "drizzle-orm";

// ----------------------------------------------------------------------
// HEALTH CHECK ENDPOINT (Spec Point 50)
// ----------------------------------------------------------------------
// WHY THIS EXISTS:
// A simple endpoint that tells you:
// 1. Is the server alive?
// 2. Can we connect to the database?
// 3. When was the last automation run?
//
// Useful for monitoring services (UptimeRobot, Vercel dashboard) and
// for the daemon to verify the API server is responding.
//
// ROUTE: GET /api/health
// RESPONSE: { status: "ok", database: "connected", lastRun: {...} }
// ----------------------------------------------------------------------

// Don't cache health checks — they need to reflect real-time state
export const dynamic = "force-dynamic";

export async function GET() {
  const health: {
    status: "ok" | "degraded" | "down";
    timestamp: string;
    uptime: number;
    database: "connected" | "error";
    lastAutomationRun: {
      id: string;
      trigger: string;
      status: string;
      startedAt: Date;
    } | null;
  } = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: "connected",
    lastAutomationRun: null,
  };

  // Test database connectivity
  try {
    const lastRun = await db.query.automationRuns.findFirst({
      orderBy: [desc(automationRuns.startedAt)],
    });

    if (lastRun) {
      health.lastAutomationRun = {
        id: lastRun.id,
        trigger: lastRun.trigger,
        status: lastRun.status,
        startedAt: lastRun.startedAt,
      };
    }
  } catch (error) {
    health.database = "error";
    health.status = "degraded";
    console.error("[Health] Database check failed:", error);
  }

  const statusCode = health.status === "ok" ? 200 : 503;
  return NextResponse.json(health, { status: statusCode });
}

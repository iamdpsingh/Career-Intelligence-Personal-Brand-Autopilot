import { NextResponse } from "next/server";
import { PublishingEngine } from "@/lib/publishing/engine";

// ----------------------------------------------------------------------
// SCHEDULE DRAFT ENDPOINT (Spec Point 12, 61)
// ----------------------------------------------------------------------
// WHY THIS EXISTS:
// After approving a draft, the user picks a specific date and time to
// publish it. The daemon or Vercel cron will then auto-publish it when
// the scheduled time arrives.
//
// WHY not auto-schedule?
// Because the user knows their audience better than an algorithm.
// Tuesday morning vs Friday afternoon matters for LinkedIn engagement.
//
// ROUTE: POST /api/content/[id]/schedule
// BODY:  { userId: string, scheduledFor: string (ISO 8601) }
// ----------------------------------------------------------------------

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: draftId } = await params;
    const body = await request.json();
    const userId = body.userId;
    const scheduledFor = body.scheduledFor;

    if (!userId || !scheduledFor) {
      return NextResponse.json(
        { error: "userId and scheduledFor (ISO 8601 date) are required" },
        { status: 400 }
      );
    }

    // Validate the date format
    const scheduledDate = new Date(scheduledFor);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format. Use ISO 8601 (e.g., 2024-01-15T09:00:00Z)" },
        { status: 400 }
      );
    }

    // Don't allow scheduling in the past
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: "Cannot schedule a post in the past." },
        { status: 400 }
      );
    }

    const engine = new PublishingEngine();
    await engine.scheduleDraft(draftId, userId, scheduledDate);

    return NextResponse.json({
      success: true,
      draftId,
      status: "SCHEDULED",
      scheduledFor: scheduledDate.toISOString(),
      message: `Draft scheduled for ${scheduledDate.toLocaleString()}.`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[API] Schedule failed:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

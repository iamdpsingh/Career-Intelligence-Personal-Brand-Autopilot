import { NextResponse } from "next/server";
import { PublishingEngine } from "@/lib/publishing/engine";

// ----------------------------------------------------------------------
// REJECT DRAFT ENDPOINT (Spec Point 29, 61)
// ----------------------------------------------------------------------
// WHY THIS EXISTS:
// Sometimes the AI generates garbage — factually wrong, bad tone, or just
// not something you want to post. This endpoint lets the human reject it.
//
// Two modes:
// 1. REJECT — The draft is dead. It goes to REJECTED and stays there.
// 2. REWORK — Send it back to the AI for revision (e.g., "fix the tone").
//
// ROUTE: POST /api/content/[id]/reject
// BODY:  { userId: string, sendToRework?: boolean }
// ----------------------------------------------------------------------

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: draftId } = await params;
    const body = await request.json();
    const userId = body.userId;
    const sendToRework = body.sendToRework || false;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const engine = new PublishingEngine();
    await engine.rejectDraft(draftId, userId, sendToRework);

    return NextResponse.json({
      success: true,
      draftId,
      status: sendToRework ? "REWORK" : "REJECTED",
      message: sendToRework
        ? "Draft sent back for AI revision."
        : "Draft permanently rejected.",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[API] Reject failed:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

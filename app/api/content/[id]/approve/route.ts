import { NextResponse } from "next/server";
import { PublishingEngine } from "@/lib/publishing/engine";

// ----------------------------------------------------------------------
// APPROVE DRAFT ENDPOINT (Spec Point 29, 61)
// ----------------------------------------------------------------------
// WHY THIS EXISTS:
// This is the human-in-the-loop approval gate. A draft MUST be explicitly
// approved by a real user before it can be published. We transition the
// draft's state from HUMAN_REVIEW → APPROVED.
//
// ROUTE: POST /api/content/[id]/approve
// BODY:  { userId: string }
//
// WHY POST instead of PATCH?
// Because this is an ACTION (approve something), not a generic update.
// RESTful APIs should use descriptive verbs in the path for actions that
// go beyond simple CRUD. It's clearer than PATCH /api/content/[id] with
// a body of { status: "APPROVED" }.
// ----------------------------------------------------------------------

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: draftId } = await params;
    const body = await request.json();
    const userId = body.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const engine = new PublishingEngine();
    await engine.approveDraft(draftId, userId);

    return NextResponse.json({
      success: true,
      draftId,
      status: "APPROVED",
      message: "Draft approved and ready for scheduling or publishing.",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[API] Approve failed:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

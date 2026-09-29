import { NextResponse } from "next/server";
import { PublishingEngine } from "@/lib/publishing/engine";

// ----------------------------------------------------------------------
// PUBLISH NOW ENDPOINT (Spec Point 29, 30, 61)
// ----------------------------------------------------------------------
// WHY THIS EXISTS:
// This is the "I want this live RIGHT NOW" button. It bypasses scheduling
// and immediately pushes an APPROVED draft to LinkedIn.
//
// SAFETY (Spec Point 29):
// The PublishingEngine has 5 internal safety checks that run before
// anything actually hits the LinkedIn API. See publishing/engine.ts.
//
// WHY is this a separate endpoint from /schedule?
// Because "post now" is an irreversible action (content goes public),
// while "schedule" is reversible (you can unschedule). Different risk
// levels deserve different API endpoints for clear intent.
//
// ROUTE: POST /api/content/publish
// BODY:  { draftId: string, userId: string }
// ----------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { draftId, userId } = body;

    if (!draftId || !userId) {
      return NextResponse.json(
        { error: "draftId and userId are required" },
        { status: 400 }
      );
    }

    const engine = new PublishingEngine();
    const result = await engine.publishDraft(draftId, userId);

    return NextResponse.json({
      success: true,
      draftId,
      status: "PUBLISHED",
      linkedInPostId: result.postId,
      linkedInPostUrl: result.postUrl,
      message: "Post published to LinkedIn successfully.",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[API] Publish failed:", msg);
    // Return 400 for business logic errors (unapproved, already published, etc.)
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

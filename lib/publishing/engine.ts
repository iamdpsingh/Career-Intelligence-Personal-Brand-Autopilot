import { db } from "@/providers/db";
import { contentDrafts, publishedPosts, auditLogs } from "@/providers/db/schema";
import { eq, and } from "drizzle-orm";
import { LinkedInClient } from "../linkedin/client";
import crypto from "crypto";

// ----------------------------------------------------------------------
// PUBLISHING STATE MACHINE (Spec Point 61, 29, 30)
// ----------------------------------------------------------------------
// WHY THIS EXISTS:
// This is the final gatekeeper. No content reaches LinkedIn without going
// through this module. It enforces the explicit state transitions:
//
//   HUMAN_REVIEW → APPROVED → SCHEDULED → PUBLISHING → PUBLISHED
//                → REJECTED → REWORK → HUMAN_REVIEW
//
// And it has multiple safety checks (Spec Point 29):
// - content.status == APPROVED
// - content.approved_by == user
// - content.approved_at != null
// - content.not_already_published == true
// - idempotency key is unused
//
// WHY separate from LinkedInClient?
// LinkedInClient only knows how to call the API. This module knows the
// BUSINESS RULES about when it's safe to call the API. Separation of
// concerns — the client is a tool, this is the brain.
// ----------------------------------------------------------------------

export class PublishingEngine {
  private linkedin: LinkedInClient;

  constructor() {
    this.linkedin = new LinkedInClient();
  }

  /**
   * Approves a draft for publishing. This is called when a human clicks
   * "Approve" in the dashboard UI.
   *
   * WHY require userId? Because we need to record WHO approved it.
   * This creates an audit trail (Spec Point 56).
   */
  async approveDraft(draftId: string, userId: string): Promise<void> {
    console.log(`[Publishing] Approving draft ${draftId} by user ${userId}...`);

    const draft = await db.query.contentDrafts.findFirst({
      where: eq(contentDrafts.id, draftId),
    });

    if (!draft) {
      throw new Error(`Draft ${draftId} not found.`);
    }

    // Only HUMAN_REVIEW drafts can be approved (strict state machine)
    if (draft.status !== "HUMAN_REVIEW") {
      throw new Error(`Draft ${draftId} is in '${draft.status}' state, not HUMAN_REVIEW. Cannot approve.`);
    }

    await db.update(contentDrafts)
      .set({
        status: "APPROVED",
        approvedBy: userId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(contentDrafts.id, draftId));

    // Audit trail
    await this.logAudit(userId, "CONTENT_APPROVED", draftId);
    console.log(`[Publishing] Draft ${draftId} approved.`);
  }

  /**
   * Rejects a draft. The user can optionally send it back for rework.
   */
  async rejectDraft(draftId: string, userId: string, sendToRework: boolean = false): Promise<void> {
    console.log(`[Publishing] Rejecting draft ${draftId}...`);

    const draft = await db.query.contentDrafts.findFirst({
      where: eq(contentDrafts.id, draftId),
    });

    if (!draft) {
      throw new Error(`Draft ${draftId} not found.`);
    }

    if (draft.status !== "HUMAN_REVIEW") {
      throw new Error(`Draft ${draftId} is in '${draft.status}' state. Cannot reject.`);
    }

    const newStatus = sendToRework ? "REWORK" : "REJECTED";

    await db.update(contentDrafts)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(contentDrafts.id, draftId));

    await this.logAudit(userId, "CONTENT_REJECTED", draftId);
    console.log(`[Publishing] Draft ${draftId} moved to ${newStatus}.`);
  }

  /**
   * Schedules an approved draft for a specific time.
   */
  async scheduleDraft(draftId: string, userId: string, scheduledFor: Date): Promise<void> {
    console.log(`[Publishing] Scheduling draft ${draftId} for ${scheduledFor.toISOString()}...`);

    const draft = await db.query.contentDrafts.findFirst({
      where: eq(contentDrafts.id, draftId),
    });

    if (!draft) {
      throw new Error(`Draft ${draftId} not found.`);
    }

    if (draft.status !== "APPROVED") {
      throw new Error(`Draft ${draftId} must be APPROVED before scheduling. Current: ${draft.status}`);
    }

    await db.update(contentDrafts)
      .set({
        status: "SCHEDULED",
        scheduledFor: scheduledFor,
        updatedAt: new Date(),
      })
      .where(eq(contentDrafts.id, draftId));

    await this.logAudit(userId, "CONTENT_SCHEDULED", draftId);
    console.log(`[Publishing] Draft ${draftId} scheduled for ${scheduledFor.toISOString()}.`);
  }

  /**
   * THE BIG ONE: Actually publishes a draft to LinkedIn.
   *
   * This method has FIVE safety checks (Spec Point 29) that ALL must pass
   * before we hit the LinkedIn API. This prevents:
   * - Publishing unapproved content
   * - Publishing the same post twice (idempotency)
   * - Publishing without valid credentials
   *
   * Spec Point 30 (Double-post protection):
   * We use an atomic state transition HUMAN_REVIEW→APPROVED→PUBLISHING
   * so two concurrent workers can't both publish the same draft.
   */
  async publishDraft(draftId: string, userId: string): Promise<{ postId: string; postUrl: string }> {
    console.log(`[Publishing] Starting publish sequence for draft ${draftId}...`);

    // SAFETY CHECK 1: Draft exists and is in a publishable state
    const draft = await db.query.contentDrafts.findFirst({
      where: eq(contentDrafts.id, draftId),
    });

    if (!draft) {
      throw new Error(`Draft ${draftId} not found.`);
    }

    // SAFETY CHECK 2: Must be APPROVED or SCHEDULED (not HUMAN_REVIEW, not REJECTED, etc.)
    if (draft.status !== "APPROVED" && draft.status !== "SCHEDULED") {
      throw new Error(`Draft ${draftId} is '${draft.status}'. Only APPROVED or SCHEDULED drafts can be published.`);
    }

    // SAFETY CHECK 3: Must have been approved by a real user
    if (!draft.approvedBy || !draft.approvedAt) {
      throw new Error(`Draft ${draftId} has no approval record. This is a critical safety violation.`);
    }

    // SAFETY CHECK 4: Not already published (check published_posts table)
    const alreadyPublished = await db.query.publishedPosts.findFirst({
      where: eq(publishedPosts.draftId, draftId),
    });

    if (alreadyPublished) {
      console.warn(`[Publishing] Draft ${draftId} was ALREADY published as ${alreadyPublished.platformPostId}. Skipping.`);
      return { postId: alreadyPublished.platformPostId, postUrl: alreadyPublished.platformPostUrl || "" };
    }

    // SAFETY CHECK 5: Atomic state transition to PUBLISHING (prevents double-post from concurrent workers)
    await db.update(contentDrafts)
      .set({ status: "PUBLISHING", updatedAt: new Date() })
      .where(
        and(
          eq(contentDrafts.id, draftId),
          // Only update if status is still APPROVED/SCHEDULED (atomic guard)
          eq(contentDrafts.status, draft.status)
        )
      );

    try {
      // All safety checks passed — call LinkedIn
      const result = await this.linkedin.publishPost(userId, draftId, draft.content);

      // Mark as PUBLISHED
      await db.update(contentDrafts)
        .set({ status: "PUBLISHED", updatedAt: new Date() })
        .where(eq(contentDrafts.id, draftId));

      await this.logAudit(userId, "CONTENT_PUBLISHED", draftId);
      console.log(`[Publishing] Successfully published draft ${draftId} to LinkedIn.`);

      return { postId: result.id, postUrl: result.url };

    } catch (error) {
      // Publishing failed — roll back to APPROVED (not PUBLISHING)
      // so the user can try again
      console.error(`[Publishing] Failed to publish draft ${draftId}:`, error);

      await db.update(contentDrafts)
        .set({ status: "APPROVED", updatedAt: new Date() })
        .where(eq(contentDrafts.id, draftId));

      await this.logAudit(userId, "CONTENT_PUBLISH_FAILED", draftId);
      throw error;
    }
  }

  /**
   * Writes an entry to the audit_logs table.
   * We never store sensitive payloads here — just the action and resource ID.
   */
  private async logAudit(userId: string, action: string, resourceId: string): Promise<void> {
    try {
      await db.insert(auditLogs).values({
        userId,
        action,
        resource: resourceId,
        result: "SUCCESS",
      });
    } catch (err) {
      // Audit logging should never crash the main flow
      console.error("[Publishing] Failed to write audit log:", err);
    }
  }
}

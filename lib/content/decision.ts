import { db } from "@/providers/db";
import { contentCandidates, contentDrafts, publishedPosts } from "@/providers/db/schema";
import { eq, and, isNull, gte, sql } from "drizzle-orm";
import { startOfWeek, subWeeks } from "date-fns";

// ----------------------------------------------------------------------
// CONTENT DECISION ENGINE (Rule 04, 05, 11)
// ----------------------------------------------------------------------
// This engine evaluates discoveries and determines if they warrant a post.
// It also enforces the strict "minimum posting rule" (Rule 05) where it 
// NEVER forces a post if there is no good evidence, but tries to maintain
// a minimum cadence if high-quality candidates exist.
// ----------------------------------------------------------------------

export class ContentDecisionEngine {
  private MIN_POSTS_PER_WEEK = 2;

  /**
   * Evaluates the current state of the queue and recent publications to decide
   * if we should pull a new Idea from the backlog and draft it.
   */
  async shouldDraftNewContent(userId: string): Promise<boolean> {
    console.log(`[Decision Engine] Evaluating whether to draft new content...`);

    // 1. Check how many posts went out this week.
    const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
    
    // We need to look at both PUBLISHED posts and SCHEDULED drafts for this week
    // Simplified for V1: Just looking at drafts that are approved/scheduled/published recently.
    const recentActivity = await db.query.contentDrafts.findMany({
      where: and(
        gte(contentDrafts.updatedAt, startOfCurrentWeek),
        sql`${contentDrafts.status} IN ('APPROVED', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED')`
      )
    });

    console.log(`[Decision Engine] Found ${recentActivity.length} active/published posts this week.`);

    if (recentActivity.length >= this.MIN_POSTS_PER_WEEK) {
      console.log(`[Decision Engine] We have met the minimum weekly quota. Holding off on drafting unless an exceptional opportunity exists.`);
      // If we met the quota, we only draft if we have an exceptionally high-scoring candidate.
      return this.hasExceptionalCandidate(userId);
    }

    console.log(`[Decision Engine] We are below the weekly quota. Searching for good candidates...`);
    return this.hasGoodCandidate(userId);
  }

  /**
   * Checks if there's a candidate with a very high score (e.g., > 90).
   * Rule 12: Exceptional opportunities can trigger morning/evening posts regardless of quota.
   */
  private async hasExceptionalCandidate(userId: string): Promise<boolean> {
    const candidates = await db.query.contentCandidates.findMany({
      where: and(
        eq(contentCandidates.userId, userId),
        eq(contentCandidates.status, "IDEA"),
        gte(contentCandidates.scoreEvidence, 90)
      ),
      limit: 1
    });
    return candidates.length > 0;
  }

  /**
   * Checks if there's any viable candidate (e.g., > 60 score).
   */
  private async hasGoodCandidate(userId: string): Promise<boolean> {
    const candidates = await db.query.contentCandidates.findMany({
      where: and(
        eq(contentCandidates.userId, userId),
        eq(contentCandidates.status, "IDEA"),
        gte(contentCandidates.scoreEvidence, 60)
      ),
      limit: 1
    });
    return candidates.length > 0;
  }

  /**
   * Picks the best available candidate from the IDEA backlog to turn into a draft.
   */
  async getNextBestCandidate(userId: string) {
    // Select the IDEA with the highest combined score
    const bestCandidate = await db.query.contentCandidates.findFirst({
      where: and(
        eq(contentCandidates.userId, userId),
        eq(contentCandidates.status, "IDEA")
      ),
      orderBy: (candidates, { desc }) => [desc(candidates.scoreEvidence)]
    });

    return bestCandidate;
  }
}

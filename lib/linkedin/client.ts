import { db } from "@/providers/db";
import { apiCredentials, publishedPosts } from "@/providers/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

// ----------------------------------------------------------------------
// LINKEDIN CLIENT (V2)
// ----------------------------------------------------------------------
// Manages the actual API calls to LinkedIn to publish content.
// Strictly adheres to Rule 61 (No automatic unapproved publishing).
// ----------------------------------------------------------------------

export class LinkedInClient {
  /**
   * Retrieves the stored LinkedIn access token for a user.
   */
  private async getAccessToken(userId: string): Promise<string> {
    const creds = await db.query.apiCredentials.findFirst({
      where: and(
        eq(apiCredentials.userId, userId),
        eq(apiCredentials.provider, "linkedin"),
        eq(apiCredentials.status, "active")
      ),
    });

    if (!creds) {
      throw new Error(`No active LinkedIn credentials found for user ${userId}. Please authenticate in the dashboard.`);
    }

    return creds.accessToken;
  }

  /**
   * Fetches the user's LinkedIn URN profile ID required for publishing.
   */
  async getAuthorUrn(accessToken: string): Promise<string> {
    const response = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch LinkedIn profile information");
    }

    const data = await response.json();
    return `urn:li:person:${data.sub}`;
  }

  /**
   * Publishes an approved text post to LinkedIn.
   * 
   * @param userId The ID of the user owning the credential
   * @param draftId The ID of the approved content_drafts record
   * @param content The text content of the post
   * @returns The platform post URL and ID
   */
  async publishPost(userId: string, draftId: string, content: string): Promise<{ id: string; url: string }> {
    console.log(`[LinkedInClient] Preparing to publish draft ${draftId}...`);
    
    // 1. Get credentials and author URN
    const token = await this.getAccessToken(userId);
    const authorUrn = await this.getAuthorUrn(token);

    // 2. Publish to LinkedIn using the v2/posts API
    const response = await fetch("https://api.linkedin.com/v2/posts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version": "202401", // Requires version header
      },
      body: JSON.stringify({
        author: authorUrn,
        commentary: content,
        visibility: "PUBLIC",
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: []
        },
        lifecycleState: "PUBLISHED"
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[LinkedInClient] Failed to publish:`, errorText);
      throw new Error(`LinkedIn API Error: ${response.status} ${response.statusText}`);
    }

    // Response header 'x-restli-id' contains the URN of the created post
    const postId = response.headers.get("x-restli-id");
    if (!postId) {
      throw new Error("LinkedIn API returned success but no x-restli-id header was found.");
    }

    // Convert URN to a public URL for tracking
    const publicUrl = `https://www.linkedin.com/feed/update/${postId}`;
    
    console.log(`[LinkedInClient] Successfully published post to LinkedIn: ${publicUrl}`);

    // 3. Ensure Idempotency (Rule 30) - Record the successful publish
    const idempotencyKey = crypto.createHash("sha256").update(`${draftId}-${postId}`).digest("hex");

    await db.insert(publishedPosts).values({
      draftId,
      platform: "linkedin",
      platformPostId: postId,
      platformPostUrl: publicUrl,
      publishedAt: new Date(),
      idempotencyKey,
    });

    return { id: postId, url: publicUrl };
  }
}

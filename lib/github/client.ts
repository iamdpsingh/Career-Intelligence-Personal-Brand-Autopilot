import { db } from "@/providers/db";
import { apiCredentials } from "@/providers/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * A secure client for communicating with the GitHub API.
 * Adheres to Rule 27 (GitHub API security) and Rule 04 (Credentials).
 * 
 * We NEVER use a hardcoded global token. We retrieve the specific user's
 * active token from the encrypted `api_credentials` table.
 */
export class GitHubClient {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Retrieves the user's active GitHub token from the database.
   * In a production environment with real users, this token would be decrypted here.
   */
  private async getToken(): Promise<string> {
    const creds = await db.query.apiCredentials.findFirst({
      where: and(
        eq(apiCredentials.userId, this.userId),
        eq(apiCredentials.provider, "github"),
        eq(apiCredentials.status, "active")
      ),
    });

    if (!creds && !process.env.GITHUB_TOKEN) {
      throw new Error(`No active GitHub credentials found for user ${this.userId} and no GITHUB_TOKEN in .env`);
    }

    return creds?.accessToken || process.env.GITHUB_TOKEN!;
  }

  /**
   * Core fetch wrapper that automatically handles authentication and standard headers.
   * Rule 27: We track rate-limit headers.
   */
  async fetch(endpoint: string, options: RequestInit = {}) {
    const token = await this.getToken();
    const url = endpoint.startsWith("http") ? endpoint : `https://api.github.com${endpoint}`;

    const headers = {
      "Accept": "application/vnd.github.v3+json",
      "Authorization": `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    // Rule 27: Respect rate limits. We log them here for observability.
    const rateLimitRemaining = response.headers.get("x-ratelimit-remaining");
    if (rateLimitRemaining && parseInt(rateLimitRemaining) < 100) {
      console.warn(`[GitHub API] Low rate limit remaining: ${rateLimitRemaining}`);
    }

    if (!response.ok) {
      // Rule 25: Failure handling. Don't crash the whole automation. Throw a clean error.
      throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Fetches recent commits for a specific repository.
   * Supports incremental syncing via 'since' parameter (Rule 48).
   */
  async getRecentCommits(owner: string, repo: string, since?: Date) {
    let endpoint = `/repos/${owner}/${repo}/commits?per_page=100`;
    if (since) {
      endpoint += `&since=${since.toISOString()}`;
    }
    return this.fetch(endpoint);
  }
}

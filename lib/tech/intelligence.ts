import { db } from "@/providers/db";
import { techTopics, contentCandidates } from "@/providers/db/schema";
import crypto from "crypto";

// ----------------------------------------------------------------------
// TECH INTELLIGENCE ENGINE (V2)
// ----------------------------------------------------------------------
// Discovers trending technology topics (e.g., from HackerNews, Dev.to)
// and converts them into Content Candidates for thought leadership.
// ----------------------------------------------------------------------

export class TechIntelligence {
  /**
   * Scans tech news sources for trending topics.
   */
  async scanForTrends(userId: string) {
    console.log(`[TechIntelligence] Scanning for new tech trends...`);

    // 1. Fetch trends (Mocked for V2 MVP - would use HackerNews API or RSS)
    const trends = await this.fetchHackerNewsTopStories();

    let newTrendsCount = 0;

    // 2. Process and store
    for (const trend of trends) {
      try {
        // We ensure idempotency by checking if the URL already exists.
        // Drizzle doesn't have a built-in findOrCreate easily without a unique constraint,
        // so we check first (since sourceUrl isn't unique in schema by default).
        const existing = await db.query.techTopics.findFirst({
          where: (techTopics, { eq }) => eq(techTopics.sourceUrl, trend.url)
        });

        if (!existing) {
          const [insertedTopic] = await db.insert(techTopics).values({
            title: trend.title,
            sourceUrl: trend.url,
            sourceDomain: "news.ycombinator.com",
            tier: 3, // Community tier
            publishedAt: new Date(trend.time * 1000),
          }).returning();

          newTrendsCount++;

          // 3. Promote highly rated trends to Content Candidates
          if (trend.score > 200) {
            await db.insert(contentCandidates).values({
              userId,
              sourceType: "TECH_NEWS",
              sourceId: insertedTopic.id,
              title: `Tech Trend: ${trend.title}`,
              scoreEvidence: 70, 
              scoreRelevance: 75,
              scoreFreshness: 90,
              status: "IDEA",
            });
            console.log(`[TechIntelligence] Promoted HN trend to Content Candidate: ${trend.title}`);
          }
        }
      } catch (error) {
        console.error(`[TechIntelligence] Failed to process trend ${trend.url}:`, error);
      }
    }

    console.log(`[TechIntelligence] Scan complete. Found ${newTrendsCount} new trends.`);
  }

  /**
   * Fetches top stories from the HackerNews Firebase API.
   */
  private async fetchHackerNewsTopStories() {
    try {
      // Fetch top 10 stories
      const response = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
      const ids: number[] = await response.json();
      const top10Ids = ids.slice(0, 10);

      const stories = await Promise.all(
        top10Ids.map(async (id) => {
          const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
          return res.json();
        })
      );

      // Filter out jobs/polls and ensure it has a URL
      return stories.filter(s => s && s.type === "story" && s.url && s.score);
    } catch (error) {
      console.error("[TechIntelligence] Failed to fetch HN API", error);
      return [];
    }
  }
}

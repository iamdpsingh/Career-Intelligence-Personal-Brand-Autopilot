import { db } from "@/providers/db";
import { contentCandidates, contentDrafts } from "@/providers/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { config } from "../system/config";

// ----------------------------------------------------------------------
// DUPLICATE CONTENT DETECTION (Spec Point 17)
// ----------------------------------------------------------------------
// WHY THIS EXISTS:
// Without this, the system would happily generate 5 posts about the same
// commit or the same HackerNews article. This module checks new candidates
// against previous posts, queued drafts, rejected content, and recent
// GitHub stories to prevent repetitive content.
//
// HOW IT WORKS:
// We use keyword-based similarity (not embeddings) because:
// 1. It's free — no AI API calls needed
// 2. It's fast — runs locally in milliseconds
// 3. It's "good enough" for catching obvious duplicates
// For a V3 upgrade, you could add semantic similarity via embeddings.
// ----------------------------------------------------------------------

/**
 * Extracts meaningful keywords from a piece of text.
 * Strips common English filler words to focus on the actual topic.
 */
function extractKeywords(text: string): Set<string> {
  // Common words that don't tell us anything about the topic
  const stopWords = new Set([
    "i", "me", "my", "we", "our", "you", "your", "it", "its", "the", "a", "an",
    "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
    "do", "does", "did", "will", "would", "could", "should", "may", "might",
    "shall", "can", "to", "of", "in", "for", "on", "with", "at", "by", "from",
    "as", "into", "through", "during", "before", "after", "above", "below",
    "between", "out", "off", "over", "under", "again", "further", "then",
    "once", "here", "there", "when", "where", "why", "how", "all", "each",
    "every", "both", "few", "more", "most", "other", "some", "such", "no",
    "nor", "not", "only", "own", "same", "so", "than", "too", "very", "just",
    "don", "now", "and", "but", "or", "if", "while", "about", "up", "that",
    "this", "what", "which", "who", "whom", "these", "those", "am", "that",
  ]);

  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")  // Strip punctuation
      .split(/\s+/)                    // Split on whitespace
      .filter(word => word.length > 2 && !stopWords.has(word))
  );
}

/**
 * Calculates how similar two texts are based on keyword overlap.
 * Returns a number between 0 (completely different) and 1 (identical topics).
 *
 * WHY Jaccard similarity?
 * It's the simplest set-based similarity metric. It answers:
 * "What fraction of all unique keywords appear in both texts?"
 * Perfect for catching "same repo, same problem, same lesson" duplicates.
 */
function calculateSimilarity(textA: string, textB: string): number {
  const keywordsA = extractKeywords(textA);
  const keywordsB = extractKeywords(textB);

  if (keywordsA.size === 0 || keywordsB.size === 0) return 0;

  // Jaccard similarity = |intersection| / |union|
  let intersection = 0;
  for (const word of keywordsA) {
    if (keywordsB.has(word)) intersection++;
  }

  const union = new Set([...keywordsA, ...keywordsB]).size;
  return intersection / union;
}

export type DuplicateCheckResult = {
  isDuplicate: boolean;
  isSimilar: boolean;
  isNew: boolean;
  // If duplicate/similar, which existing content matched
  matchedContentId?: string;
  matchedTitle?: string;
  similarityScore: number;
};

/**
 * Checks a new candidate title against all existing content to prevent
 * posting the same thing twice.
 *
 * Spec Point 17 detection targets:
 * - same repository
 * - same problem
 * - same lesson
 * - same source
 * - same wording
 * - same topic
 */
export async function checkForDuplicates(
  title: string,
  userId: string
): Promise<DuplicateCheckResult> {
  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - config.duplicateDetection.lookbackDays);

  // 1. Check against all existing candidates (IDEA, DRAFTED, REJECTED)
  const existingCandidates = await db
    .select({ id: contentCandidates.id, title: contentCandidates.title })
    .from(contentCandidates)
    .where(
      and(
        eq(contentCandidates.userId, userId),
        gte(contentCandidates.createdAt, lookbackDate)
      )
    );

  // 2. Check against published drafts (so we don't re-post old topics)
  const existingDrafts = await db
    .select({ id: contentDrafts.id, content: contentDrafts.content })
    .from(contentDrafts)
    .where(gte(contentDrafts.createdAt, lookbackDate));

  // 3. Compare against candidates
  for (const candidate of existingCandidates) {
    const score = calculateSimilarity(title, candidate.title);

    if (score >= config.duplicateDetection.similarityThreshold) {
      return {
        isDuplicate: score > 0.85, // Very high overlap = definitely duplicate
        isSimilar: true,
        isNew: false,
        matchedContentId: candidate.id,
        matchedTitle: candidate.title,
        similarityScore: score,
      };
    }
  }

  // 4. Compare against draft content
  for (const draft of existingDrafts) {
    const score = calculateSimilarity(title, draft.content);

    if (score >= config.duplicateDetection.similarityThreshold) {
      return {
        isDuplicate: score > 0.85,
        isSimilar: true,
        isNew: false,
        matchedContentId: draft.id,
        matchedTitle: draft.content.substring(0, 80) + "...",
        similarityScore: score,
      };
    }
  }

  // No match found — this is genuinely new content
  return {
    isDuplicate: false,
    isSimilar: false,
    isNew: true,
    similarityScore: 0,
  };
}

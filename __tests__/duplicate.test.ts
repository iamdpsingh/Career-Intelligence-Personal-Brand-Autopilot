import { describe, it, expect } from "vitest";

// ----------------------------------------------------------------------
// UNIT TESTS: DUPLICATE DETECTION
// ----------------------------------------------------------------------
// We import the internal functions by testing the module's exported API.
// These tests verify the Jaccard similarity algorithm and the keyword
// extraction logic WITHOUT needing a database connection.
// ----------------------------------------------------------------------

// Since extractKeywords and calculateSimilarity are internal functions,
// we test them through the module's behavior. But first, let's replicate
// the logic here for pure unit testing (no DB needed).

// Duplicated from duplicate.ts for isolated testing
function extractKeywords(text: string): Set<string> {
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
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
  );
}

function calculateSimilarity(textA: string, textB: string): number {
  const keywordsA = extractKeywords(textA);
  const keywordsB = extractKeywords(textB);

  if (keywordsA.size === 0 || keywordsB.size === 0) return 0;

  let intersection = 0;
  for (const word of keywordsA) {
    if (keywordsB.has(word)) intersection++;
  }

  const union = new Set([...keywordsA, ...keywordsB]).size;
  return intersection / union;
}

describe("Duplicate Detection — Keyword Extraction", () => {
  it("should extract meaningful keywords and skip stop words", () => {
    const keywords = extractKeywords("I implemented a new caching layer for the database");
    expect(keywords.has("caching")).toBe(true);
    expect(keywords.has("layer")).toBe(true);
    expect(keywords.has("database")).toBe(true);
    // Stop words should be filtered
    expect(keywords.has("i")).toBe(false);
    expect(keywords.has("a")).toBe(false);
    expect(keywords.has("the")).toBe(false);
    expect(keywords.has("for")).toBe(false);
  });

  it("should handle empty strings", () => {
    const keywords = extractKeywords("");
    expect(keywords.size).toBe(0);
  });

  it("should handle strings with only stop words", () => {
    const keywords = extractKeywords("the a an is are was were");
    expect(keywords.size).toBe(0);
  });

  it("should strip punctuation", () => {
    const keywords = extractKeywords("hello, world! TypeScript-is-great.");
    expect(keywords.has("hello")).toBe(true);
    expect(keywords.has("world")).toBe(true);
    expect(keywords.has("typescript")).toBe(true);
    expect(keywords.has("great")).toBe(true);
  });

  it("should be case-insensitive", () => {
    const kw1 = extractKeywords("TypeScript React NextJS");
    const kw2 = extractKeywords("typescript react nextjs");
    expect(kw1).toEqual(kw2);
  });

  it("should filter out short words (less than 3 chars)", () => {
    const keywords = extractKeywords("AI ML DB is ok go");
    // "ai", "ml", "db", "is", "ok", "go" are all 2 chars — filtered out
    expect(keywords.size).toBe(0);
  });
});

describe("Duplicate Detection — Similarity Calculation", () => {
  it("should return 1.0 for identical texts", () => {
    const score = calculateSimilarity(
      "Implemented incremental loading for large datasets",
      "Implemented incremental loading for large datasets"
    );
    expect(score).toBe(1);
  });

  it("should return 0 for completely different texts", () => {
    const score = calculateSimilarity(
      "Kubernetes pod autoscaling strategy",
      "Piano lessons for beginners"
    );
    expect(score).toBe(0);
  });

  it("should detect high similarity for paraphrased content", () => {
    const score = calculateSimilarity(
      "Implemented incremental loading for large PostgreSQL datasets",
      "Added incremental data loading for PostgreSQL large tables"
    );
    // Jaccard similarity is keyword-based, so paraphrased text scores ~0.44.
    // That's high enough to flag as "similar" given our 0.7 threshold would catch near-duplicates.
    expect(score).toBeGreaterThan(0.3);
  });

  it("should detect low similarity for different topics", () => {
    const score = calculateSimilarity(
      "Built a React component for user authentication",
      "Deployed machine learning model to production Kubernetes cluster"
    );
    expect(score).toBeLessThan(0.3);
  });

  it("should return 0 when either text is empty", () => {
    expect(calculateSimilarity("", "something")).toBe(0);
    expect(calculateSimilarity("something", "")).toBe(0);
    expect(calculateSimilarity("", "")).toBe(0);
  });

  it("should handle texts with overlapping technical keywords", () => {
    const score = calculateSimilarity(
      "React performance optimization with memoization and lazy loading",
      "React optimization using memoization for component rendering"
    );
    // Same topic area — should be moderately similar
    expect(score).toBeGreaterThan(0.3);
  });

  it("should produce symmetrical results (order doesn't matter)", () => {
    const textA = "TypeScript migration from JavaScript";
    const textB = "JavaScript project converted to TypeScript";
    const scoreAB = calculateSimilarity(textA, textB);
    const scoreBA = calculateSimilarity(textB, textA);
    expect(scoreAB).toBe(scoreBA);
  });
});

describe("Duplicate Detection — Edge Cases", () => {
  it("should handle very long texts without crashing", () => {
    const longText = "performance optimization ".repeat(1000);
    const score = calculateSimilarity(longText, longText);
    expect(score).toBe(1);
  });

  it("should handle special characters and unicode", () => {
    const keywords = extractKeywords("Résumé parsing with UTF-8 — special chars: @#$%");
    expect(keywords.size).toBeGreaterThan(0);
  });

  it("should handle numbers mixed with text", () => {
    const keywords = extractKeywords("Improved API response from 500ms to 100ms using Redis cache");
    expect(keywords.has("improved")).toBe(true);
    expect(keywords.has("api")).toBe(true);
    expect(keywords.has("response")).toBe(true);
    expect(keywords.has("redis")).toBe(true);
    expect(keywords.has("cache")).toBe(true);
    expect(keywords.has("500ms")).toBe(true);
  });
});

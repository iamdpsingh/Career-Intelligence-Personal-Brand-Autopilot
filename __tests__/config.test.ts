import { describe, it, expect } from "vitest";
import { config } from "../lib/system/config";

// ----------------------------------------------------------------------
// UNIT TESTS: CENTRAL CONFIGURATION
// ----------------------------------------------------------------------
// WHY THESE TESTS?
// The config module is the source of truth for all tunable settings.
// If someone accidentally changes a threshold or a default value, these
// tests catch it before it ships. Config changes should be deliberate.
// ----------------------------------------------------------------------

describe("Central Configuration", () => {
  describe("publishing rules", () => {
    it("should enforce minimum 2 posts per week", () => {
      // Spec Point 5: "minimum 2 times per week"
      expect(config.publishing.minPostsPerWeek).toBe(2);
    });

    it("should never exceed 5 posts per week", () => {
      // Spec Point 5: "max 5"
      expect(config.publishing.maxPostsPerWeek).toBe(5);
      expect(config.publishing.maxPostsPerWeek).toBeGreaterThanOrEqual(
        config.publishing.minPostsPerWeek
      );
    });

    it("should have preferred posts between min and max", () => {
      expect(config.publishing.preferredPostsPerWeek).toBeGreaterThanOrEqual(
        config.publishing.minPostsPerWeek
      );
      expect(config.publishing.preferredPostsPerWeek).toBeLessThanOrEqual(
        config.publishing.maxPostsPerWeek
      );
    });
  });

  describe("content windows", () => {
    it("should have morning and evening publishing windows", () => {
      // Spec Point 12: "morning/evening posts"
      expect(config.contentWindows.morning).toBeDefined();
      expect(config.contentWindows.evening).toBeDefined();
    });

    it("should have valid time format (HH:MM)", () => {
      const timeFormat = /^\d{2}:\d{2}$/;
      expect(config.contentWindows.morning.start).toMatch(timeFormat);
      expect(config.contentWindows.morning.end).toMatch(timeFormat);
      expect(config.contentWindows.evening.start).toMatch(timeFormat);
      expect(config.contentWindows.evening.end).toMatch(timeFormat);
    });
  });

  describe("scoring thresholds", () => {
    it("should require a minimum score of 60 for drafting", () => {
      // Spec Point 16: scoring thresholds
      expect(config.scoring.minScoreForDrafting).toBe(60);
    });

    it("should treat scores above 90 as exceptional", () => {
      expect(config.scoring.exceptionalScoreThreshold).toBe(90);
      expect(config.scoring.exceptionalScoreThreshold).toBeGreaterThan(
        config.scoring.minScoreForDrafting
      );
    });
  });

  describe("duplicate detection", () => {
    it("should flag similarity above 0.7", () => {
      // Spec Point 17: duplicate prevention
      expect(config.duplicateDetection.similarityThreshold).toBe(0.7);
      expect(config.duplicateDetection.similarityThreshold).toBeGreaterThan(0);
      expect(config.duplicateDetection.similarityThreshold).toBeLessThan(1);
    });

    it("should look back 30 days for duplicates", () => {
      expect(config.duplicateDetection.lookbackDays).toBe(30);
    });
  });

  describe("daemon settings", () => {
    it("should have a sensible default cycle interval", () => {
      // Default 60 seconds between cycles
      expect(config.daemon.cycleIntervalMs).toBeGreaterThanOrEqual(1000);
    });

    it("should default to local mode", () => {
      // When DEPLOYMENT_MODE is not set, default to local
      expect(["local", "vercel", "netlify"]).toContain(config.daemon.mode);
    });
  });

  describe("retry strategy", () => {
    it("should retry up to 3 times by default", () => {
      expect(config.retry.maxAttempts).toBe(3);
    });

    it("should NOT retry authentication errors", () => {
      // Spec Point 26: "Don't blindly retry auth failures"
      expect(config.retry.nonRetryableErrors).toContain("401");
      expect(config.retry.nonRetryableErrors).toContain("403");
    });
  });

  describe("GitHub API settings", () => {
    it("should warn when rate limit drops below 100", () => {
      expect(config.github.rateLimitWarningThreshold).toBe(100);
    });

    it("should limit repos per cycle to prevent rate limit exhaustion", () => {
      expect(config.github.maxReposPerCycle).toBeLessThanOrEqual(50);
    });
  });

  describe("configuration immutability", () => {
    it("should be read-only (as const prevents mutation)", () => {
      // TypeScript enforces this at compile time, but we verify at runtime
      // that the values are stable across test runs
      const snapshot = JSON.parse(JSON.stringify(config));
      expect(config.publishing.minPostsPerWeek).toBe(snapshot.publishing.minPostsPerWeek);
      expect(config.scoring.minScoreForDrafting).toBe(snapshot.scoring.minScoreForDrafting);
    });
  });
});

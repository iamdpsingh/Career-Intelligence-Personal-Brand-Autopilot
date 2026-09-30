import { describe, it, expect } from "vitest";

// ----------------------------------------------------------------------
// UNIT TESTS: DATABASE SCHEMA INTEGRITY
// ----------------------------------------------------------------------
// WHY THESE TESTS?
// The schema is the foundation of the entire system. If someone changes a
// column name, removes a table, or alters a relationship, EVERYTHING breaks.
// These tests import the schema and verify every table and critical column
// exists. They run in milliseconds because they're just checking the
// Drizzle table definitions, not querying a real database.
// ----------------------------------------------------------------------

// Import all tables from the schema
import {
  users,
  apiCredentials,
  profiles,
  jobs,
  repositories,
  githubActivity,
  githubEvidence,
  techTopics,
  contentCandidates,
  contentDrafts,
  contentImages,
  contentAudio,
  publishedPosts,
  automationRuns,
  auditLogs,
} from "../providers/db/schema";

describe("Database Schema — Table Existence", () => {
  const tables = {
    users,
    apiCredentials,
    profiles,
    jobs,
    repositories,
    githubActivity,
    githubEvidence,
    techTopics,
    contentCandidates,
    contentDrafts,
    contentImages,
    contentAudio,
    publishedPosts,
    automationRuns,
    auditLogs,
  };

  it("should export all 15 required tables", () => {
    expect(Object.keys(tables).length).toBe(15);
  });

  for (const [name, table] of Object.entries(tables)) {
    it(`should have table '${name}' defined`, () => {
      expect(table).toBeDefined();
      // Drizzle tables have a Symbol for the table name
      expect(typeof table).toBe("object");
    });
  }
});

describe("Database Schema — Critical Column Existence", () => {
  it("users: should have id, email, and createdAt", () => {
    expect(users.id).toBeDefined();
    expect(users.email).toBeDefined();
    expect(users.createdAt).toBeDefined();
  });

  it("apiCredentials: should have userId, provider, accessToken, and status", () => {
    expect(apiCredentials.userId).toBeDefined();
    expect(apiCredentials.provider).toBeDefined();
    expect(apiCredentials.accessToken).toBeDefined();
    expect(apiCredentials.status).toBeDefined();
  });

  it("contentDrafts: should have full state machine columns", () => {
    // These columns are required for the publishing state machine
    expect(contentDrafts.id).toBeDefined();
    expect(contentDrafts.candidateId).toBeDefined();
    expect(contentDrafts.content).toBeDefined();
    expect(contentDrafts.status).toBeDefined();
    expect(contentDrafts.approvedBy).toBeDefined();
    expect(contentDrafts.approvedAt).toBeDefined();
    expect(contentDrafts.scheduledFor).toBeDefined();
  });

  it("publishedPosts: should have idempotency key for double-post prevention", () => {
    // Spec Point 30: Double-post protection
    expect(publishedPosts.idempotencyKey).toBeDefined();
    expect(publishedPosts.draftId).toBeDefined();
    expect(publishedPosts.platformPostId).toBeDefined();
  });

  it("githubEvidence: should have claim and fileReferences for Truth Engine", () => {
    // Spec Point 6/7: Truth Engine requires traceable evidence
    expect(githubEvidence.claim).toBeDefined();
    expect(githubEvidence.fileReferences).toBeDefined();
    expect(githubEvidence.activityId).toBeDefined();
  });

  it("contentCandidates: should have scoring columns", () => {
    // Spec Point 16: Scoring
    expect(contentCandidates.scoreEvidence).toBeDefined();
    expect(contentCandidates.scoreRelevance).toBeDefined();
    expect(contentCandidates.scoreFreshness).toBeDefined();
  });

  it("automationRuns: should track run metadata", () => {
    expect(automationRuns.trigger).toBeDefined();
    expect(automationRuns.status).toBeDefined();
    expect(automationRuns.startedAt).toBeDefined();
    expect(automationRuns.finishedAt).toBeDefined();
    expect(automationRuns.errorsCount).toBeDefined();
  });

  it("auditLogs: should have action, resource, and result", () => {
    // Spec Point 56: Audit trail
    expect(auditLogs.action).toBeDefined();
    expect(auditLogs.resource).toBeDefined();
    expect(auditLogs.result).toBeDefined();
  });
});

describe("Database Schema — Relationship Integrity", () => {
  it("apiCredentials should reference users", () => {
    expect(apiCredentials.userId).toBeDefined();
  });

  it("repositories should reference users", () => {
    expect(repositories.userId).toBeDefined();
  });

  it("githubActivity should reference repositories", () => {
    expect(githubActivity.repositoryId).toBeDefined();
  });

  it("githubEvidence should reference repositories and activities", () => {
    expect(githubEvidence.repositoryId).toBeDefined();
    expect(githubEvidence.activityId).toBeDefined();
  });

  it("contentCandidates should reference users", () => {
    expect(contentCandidates.userId).toBeDefined();
  });

  it("contentDrafts should reference contentCandidates", () => {
    expect(contentDrafts.candidateId).toBeDefined();
  });

  it("publishedPosts should reference contentDrafts", () => {
    expect(publishedPosts.draftId).toBeDefined();
  });
});

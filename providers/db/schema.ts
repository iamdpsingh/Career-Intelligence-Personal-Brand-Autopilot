import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  integer,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ----------------------------------------------------------------------
// SYSTEM & AUTHENTICATION
// ----------------------------------------------------------------------

/**
 * Stores the core user identity. This is required for NextAuth and
 * associates all data with a specific owner.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Stores OAuth credentials (GitHub, LinkedIn) securely.
 * This satisfies Rule 31 (API credential architecture) and Rule 04 (Credentials).
 * Never expose these fields to the frontend.
 */
export const apiCredentials = pgTable("api_credentials", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  provider: text("provider").notNull(), // 'github', 'linkedin'
  type: text("type").notNull(), // 'oauth', 'pat'
  accessToken: text("access_token").notNull(), // Should be encrypted at rest in production
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at", { mode: "date" }),
  status: text("status").notNull().default("active"), // 'active', 'expired', 'revoked'
  lastUsedAt: timestamp("last_used_at", { mode: "date" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ----------------------------------------------------------------------
// DOMAIN: PROFILE & JOBS (Job Intelligence Pipeline)
// ----------------------------------------------------------------------

/**
 * Structured data representation of the user's professional profile.
 * Used for scoring job relevance without sending entire resumes to an LLM.
 */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  targetRoles: jsonb("target_roles").$type<string[]>(),
  coreSkills: jsonb("core_skills").$type<string[]>(),
  cloudSkills: jsonb("cloud_skills").$type<string[]>(),
  targetExperience: jsonb("target_experience").$type<string[]>(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  company: text("company").notNull(),
  jobTitle: text("job_title").notNull(),
  location: text("location"),
  remoteType: text("remote_type"),
  salary: text("salary"), // 'UNKNOWN' if missing (Rule 20)
  skills: jsonb("skills").$type<string[]>(),
  jobUrl: text("job_url").notNull().unique(),
  postedAt: timestamp("posted_at", { mode: "date" }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ----------------------------------------------------------------------
// DOMAIN: GITHUB (GitHub Intelligence Pipeline)
// ----------------------------------------------------------------------

/**
 * Tracks repositories we are monitoring.
 */
export const repositories = pgTable("repositories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(), // e.g., "owner/repo"
  description: text("description"),
  language: text("language"),
  isPrivate: boolean("is_private").default(false),
  lastSyncAt: timestamp("last_sync_at", { mode: "date" }), // Used for incremental sync (Rule 48)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Raw activity data pulled from GitHub (commits, PRs).
 */
export const githubActivity = pgTable("github_activity", {
  id: uuid("id").primaryKey().defaultRandom(),
  repositoryId: uuid("repository_id")
    .references(() => repositories.id, { onDelete: "cascade" })
    .notNull(),
  activityType: text("activity_type").notNull(), // 'commit', 'pr', 'issue'
  externalId: text("external_id").notNull(), // sha or PR number
  message: text("message"),
  url: text("url"),
  activityDate: timestamp("activity_date", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Extracted, verified facts about what the user actually built.
 * This is the core of the "Truth Engine" (Rule 06 & 07).
 */
export const githubEvidence = pgTable("github_evidence", {
  id: uuid("id").primaryKey().defaultRandom(),
  repositoryId: uuid("repository_id")
    .references(() => repositories.id, { onDelete: "cascade" })
    .notNull(),
  activityId: uuid("activity_id")
    .references(() => githubActivity.id, { onDelete: "set null" }),
  claim: text("claim").notNull(), // e.g., "Added schema validation"
  evidenceType: text("evidence_type").notNull(), // e.g., "source_code"
  fileReferences: jsonb("file_references").$type<string[]>(), // e.g., ["src/schema.ts"]
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ----------------------------------------------------------------------
// DOMAIN: TECH NEWS (Tech Intelligence Pipeline)
// ----------------------------------------------------------------------

/**
 * Discovered technology topics from trusted sources.
 */
export const techTopics = pgTable("tech_topics", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  sourceUrl: text("source_url").notNull(),
  sourceDomain: text("source_domain"),
  tier: integer("tier").notNull(), // 1=Official, 2=Major Pub, 3=Community
  publishedAt: timestamp("published_at", { mode: "date" }),
  retrievedAt: timestamp("retrieved_at").defaultNow().notNull(),
});

// ----------------------------------------------------------------------
// DOMAIN: CONTENT LIFECYCLE (The State Machine)
// ----------------------------------------------------------------------

/**
 * Raw ideas generated by the Intelligence Pipelines before drafting.
 */
export const contentCandidates = pgTable("content_candidates", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  sourceType: text("source_type").notNull(), // 'github', 'tech'
  sourceId: uuid("source_id"), // Polymorphic relation to github_evidence or tech_topics
  title: text("title").notNull(), // Internal title for the idea
  
  // Internal scoring (Rule 16)
  scoreEvidence: integer("score_evidence"),
  scoreRelevance: integer("score_relevance"),
  scoreFreshness: integer("score_freshness"),
  
  status: text("status").notNull().default("IDEA"), // IDEA, DRAFTING, REJECTED
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * The actual generated posts (text) tied to a candidate.
 */
export const contentDrafts = pgTable("content_drafts", {
  id: uuid("id").primaryKey().defaultRandom(),
  candidateId: uuid("candidate_id")
    .references(() => contentCandidates.id, { onDelete: "cascade" })
    .notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("AI_REVIEW"), // AI_REVIEW, HUMAN_REVIEW, APPROVED, REWORK, SCHEDULED, PUBLISHING, PUBLISHED, REJECTED (Rule 61)
  
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at", { mode: "date" }),
  scheduledFor: timestamp("scheduled_for", { mode: "date" }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Images associated with drafts. Stored in object storage, this table
 * only holds the metadata and reference URLs (Rule 20 & 21).
 */
export const contentImages = pgTable("content_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  draftId: uuid("draft_id")
    .references(() => contentDrafts.id, { onDelete: "cascade" })
    .notNull(),
  prompt: text("prompt").notNull(),
  provider: text("provider").notNull(),
  storageUrl: text("storage_url").notNull(),
  altText: text("alt_text"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Audio TTS snippets associated with drafts. (Rule 21 additions)
 */
export const contentAudio = pgTable("content_audio", {
  id: uuid("id").primaryKey().defaultRandom(),
  draftId: uuid("draft_id")
    .references(() => contentDrafts.id, { onDelete: "cascade" })
    .notNull(),
  provider: text("provider").notNull(), // e.g., 'kokoro', 'piper'
  storageUrl: text("storage_url").notNull(),
  durationSeconds: integer("duration_seconds"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ----------------------------------------------------------------------
// DOMAIN: PUBLISHING & QUEUE (Publishing Engine)
// ----------------------------------------------------------------------

/**
 * Tracks what has actually gone live on LinkedIn to prevent double posting
 * and to satisfy the traceability requirement (Rule 23).
 */
export const publishedPosts = pgTable("published_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  draftId: uuid("draft_id")
    .references(() => contentDrafts.id, { onDelete: "restrict" }) // Prevent deleting a draft if it's published
    .notNull(),
  platform: text("platform").notNull().default("linkedin"),
  platformPostId: text("platform_post_id").notNull(), // ID returned by LinkedIn
  platformPostUrl: text("platform_post_url"),
  publishedAt: timestamp("published_at", { mode: "date" }).notNull(),
  
  // Idempotency and double-post protection (Rule 30)
  idempotencyKey: text("idempotency_key").notNull().unique(),
});

// ----------------------------------------------------------------------
// DOMAIN: OBSERVABILITY & RUN TRACKING
// ----------------------------------------------------------------------

/**
 * Tracks every run of the Vercel Cron orchestration (Rule 24).
 */
export const automationRuns = pgTable("automation_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  trigger: text("trigger").notNull(), // 'cron', 'manual'
  status: text("status").notNull(), // 'running', 'success', 'failed', 'partial'
  startedAt: timestamp("started_at", { mode: "date" }).defaultNow().notNull(),
  finishedAt: timestamp("finished_at", { mode: "date" }),
  
  // Metrics
  itemsFound: integer("items_found").default(0),
  candidatesGenerated: integer("candidates_generated").default(0),
  apiCalls: integer("api_calls").default(0),
  errorsCount: integer("errors_count").default(0),
});

/**
 * Centralized audit log for security and PII tracking (Rule 56).
 */
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id), // Can be null if system action
  action: text("action").notNull(), // e.g., 'CONTENT_APPROVED', 'CREDENTIAL_REVOKED'
  resource: text("resource").notNull(),
  result: text("result").notNull(), // 'SUCCESS', 'FAILURE'
  timestamp: timestamp("timestamp", { mode: "date" }).defaultNow().notNull(),
  // Do not store PII or sensitive payload data here!
});

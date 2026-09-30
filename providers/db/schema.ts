import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import crypto from "crypto";


// ----------------------------------------------------------------------
// SYSTEM & AUTHENTICATION
// ----------------------------------------------------------------------

/**
 * Stores the core user identity. This is required for NextAuth and
 * associates all data with a specific owner.
 */
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()).notNull(),
});

/**
 * Stores OAuth credentials (GitHub, LinkedIn) securely.
 * This satisfies Rule 31 (API credential architecture) and Rule 04 (Credentials).
 * Never expose these fields to the frontend.
 */
export const apiCredentials = sqliteTable("api_credentials", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  provider: text("provider").notNull(), // 'github', 'linkedin'
  type: text("type").notNull(), // 'oauth', 'pat'
  accessToken: text("access_token").notNull(), // Should be encrypted at rest in production
  refreshToken: text("refresh_token"),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
  status: text("status").notNull().default("active"), // 'active', 'expired', 'revoked'
  lastUsedAt: integer("last_used_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()).notNull(),
});

// ----------------------------------------------------------------------
// DOMAIN: PROFILE & JOBS (Job Intelligence Pipeline)
// ----------------------------------------------------------------------

/**
 * Structured data representation of the user's professional profile.
 * Used for scoring job relevance without sending entire resumes to an LLM.
 */
export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  targetRoles: text("target_roles", { mode: "json" }).$type<string[]>(),
  coreSkills: text("core_skills", { mode: "json" }).$type<string[]>(),
  cloudSkills: text("cloud_skills", { mode: "json" }).$type<string[]>(),
  targetExperience: text("target_experience", { mode: "json" }).$type<string[]>(),
  experienceLevel: text("experience_level", { mode: "json" }).$type<string[]>(),
  timeFilter: text("time_filter"),
  locationFilter: text("location_filter", { mode: "json" }).$type<string[]>(),
  salaryFilter: text("salary_filter", { mode: "json" }).$type<string[]>(),
  currency: text("currency", { mode: "json" }).$type<string[]>(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()).notNull(),
});

export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  company: text("company").notNull(),
  jobTitle: text("job_title").notNull(),
  location: text("location"),
  remoteType: text("remote_type"),
  salary: text("salary"), // 'UNKNOWN' if missing (Rule 20)
  skills: text("skills", { mode: "json" }).$type<string[]>(),
  jobUrl: text("job_url").notNull().unique(),
  postedAt: integer("posted_at", { mode: "timestamp_ms" }),
  description: text("description"),
  visited: integer("visited", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()).notNull(),
});

// ----------------------------------------------------------------------
// DOMAIN: GITHUB (GitHub Intelligence Pipeline)
// ----------------------------------------------------------------------

/**
 * Tracks repositories we are monitoring.
 */
export const repositories = sqliteTable("repositories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(), // e.g., "owner/repo"
  description: text("description"),
  language: text("language"),
  isPrivate: integer("is_private", { mode: "boolean" }).default(false),
  lastSyncAt: integer("last_sync_at", { mode: "timestamp_ms" }), // Used for incremental sync (Rule 48)
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()).notNull(),
});

/**
 * Raw activity data pulled from GitHub (commits, PRs).
 */
export const githubActivity = sqliteTable("github_activity", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  repositoryId: text("repository_id")
    .references(() => repositories.id, { onDelete: "cascade" })
    .notNull(),
  activityType: text("activity_type").notNull(), // 'commit', 'pr', 'issue'
  externalId: text("external_id").notNull(), // sha or PR number
  message: text("message"),
  url: text("url"),
  activityDate: integer("activity_date", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()).notNull(),
});

/**
 * Extracted, verified facts about what the user actually built.
 * This is the core of the "Truth Engine" (Rule 06 & 07).
 */
export const githubEvidence = sqliteTable("github_evidence", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  repositoryId: text("repository_id")
    .references(() => repositories.id, { onDelete: "cascade" })
    .notNull(),
  activityId: text("activity_id")
    .references(() => githubActivity.id, { onDelete: "set null" }),
  claim: text("claim").notNull(), // e.g., "Added schema validation"
  evidenceType: text("evidence_type").notNull(), // e.g., "source_code"
  fileReferences: text("file_references", { mode: "json" }).$type<string[]>(), // e.g., ["src/schema.ts"]
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()).notNull(),
});

// ----------------------------------------------------------------------
// DOMAIN: TECH NEWS (Tech Intelligence Pipeline)
// ----------------------------------------------------------------------

/**
 * Discovered technology topics from trusted sources.
 */
export const techTopics = sqliteTable("tech_topics", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  sourceUrl: text("source_url").notNull(),
  sourceDomain: text("source_domain"),
  tier: integer("tier").notNull(), // 1=Official, 2=Major Pub, 3=Community
  publishedAt: integer("published_at", { mode: "timestamp_ms" }),
  retrievedAt: integer("retrieved_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()).notNull(),
});

// ----------------------------------------------------------------------
// DOMAIN: CONTENT LIFECYCLE (The State Machine)
// ----------------------------------------------------------------------

/**
 * Raw ideas generated by the Intelligence Pipelines before drafting.
 */
export const contentCandidates = sqliteTable("content_candidates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  sourceType: text("source_type").notNull(), // 'github', 'tech'
  sourceId: text("source_id"), // Polymorphic relation to github_evidence or tech_topics
  title: text("title").notNull(), // Internal title for the idea
  
  // Internal scoring (Rule 16)
  scoreEvidence: integer("score_evidence"),
  scoreRelevance: integer("score_relevance"),
  scoreFreshness: integer("score_freshness"),
  
  status: text("status").notNull().default("IDEA"), // IDEA, DRAFTING, REJECTED
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()).notNull(),
});

/**
 * The actual generated posts (text) tied to a candidate.
 */
export const contentDrafts = sqliteTable("content_drafts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  candidateId: text("candidate_id")
    .references(() => contentCandidates.id, { onDelete: "cascade" })
    .notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("AI_REVIEW"), // AI_REVIEW, HUMAN_REVIEW, APPROVED, REWORK, SCHEDULED, PUBLISHING, PUBLISHED, REJECTED (Rule 61)
  
  approvedBy: text("approved_by").references(() => users.id),
  approvedAt: integer("approved_at", { mode: "timestamp_ms" }),
  scheduledFor: integer("scheduled_for", { mode: "timestamp_ms" }),
  
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()).notNull(),
});

/**
 * Images associated with drafts. Stored in object storage, this table
 * only holds the metadata and reference URLs (Rule 20 & 21).
 */
export const contentImages = sqliteTable("content_images", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  draftId: text("draft_id")
    .references(() => contentDrafts.id, { onDelete: "cascade" })
    .notNull(),
  prompt: text("prompt").notNull(),
  provider: text("provider").notNull(),
  storageUrl: text("storage_url").notNull(),
  altText: text("alt_text"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()).notNull(),
});

/**
 * Audio TTS snippets associated with drafts. (Rule 21 additions)
 */
export const contentAudio = sqliteTable("content_audio", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  draftId: text("draft_id")
    .references(() => contentDrafts.id, { onDelete: "cascade" })
    .notNull(),
  provider: text("provider").notNull(), // e.g., 'kokoro', 'piper'
  storageUrl: text("storage_url").notNull(),
  durationSeconds: integer("duration_seconds"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()).notNull(),
});

// ----------------------------------------------------------------------
// DOMAIN: PUBLISHING & QUEUE (Publishing Engine)
// ----------------------------------------------------------------------

/**
 * Tracks what has actually gone live on LinkedIn to prevent double posting
 * and to satisfy the traceability requirement (Rule 23).
 */
export const publishedPosts = sqliteTable("published_posts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  draftId: text("draft_id")
    .references(() => contentDrafts.id, { onDelete: "restrict" }) // Prevent deleting a draft if it's published
    .notNull(),
  platform: text("platform").notNull().default("linkedin"),
  platformPostId: text("platform_post_id").notNull(), // ID returned by LinkedIn
  platformPostUrl: text("platform_post_url"),
  publishedAt: integer("published_at", { mode: "timestamp_ms" }).notNull(),
  
  // Idempotency and double-post protection (Rule 30)
  idempotencyKey: text("idempotency_key").notNull().unique(),
});

// ----------------------------------------------------------------------
// DOMAIN: OBSERVABILITY & RUN TRACKING
// ----------------------------------------------------------------------

/**
 * Tracks every run of the Vercel Cron orchestration (Rule 24).
 */
export const automationRuns = sqliteTable("automation_runs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  trigger: text("trigger").notNull(), // 'cron', 'manual'
  status: text("status").notNull(), // 'running', 'success', 'failed', 'partial'
  startedAt: integer("started_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()).notNull(),
  finishedAt: integer("finished_at", { mode: "timestamp_ms" }),
  
  // Metrics
  itemsFound: integer("items_found").default(0),
  candidatesGenerated: integer("candidates_generated").default(0),
  apiCalls: integer("api_calls").default(0),
  errorsCount: integer("errors_count").default(0),
});

/**
 * Centralized audit log for security and PII tracking (Rule 56).
 */
export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id), // Can be null if system action
  action: text("action").notNull(), // e.g., 'CONTENT_APPROVED', 'CREDENTIAL_REVOKED'
  resource: text("resource").notNull(),
  result: text("result").notNull(), // 'SUCCESS', 'FAILURE'
  timestamp: integer("timestamp", { mode: "timestamp_ms" }).$defaultFn(() => new Date()).notNull(),
  // Do not store PII or sensitive payload data here!
});

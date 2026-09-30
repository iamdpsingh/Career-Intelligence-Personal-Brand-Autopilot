# Architecture Documentation

## System Overview

Career Intelligence & Personal Brand Autopilot is an AI-powered automation system
that gathers evidence of your engineering work from GitHub, monitors tech trends,
discovers job opportunities, and generates LinkedIn content — all under human control.

## Core Principle

**"LinkedIn publishing remains human-approved."**

The AI cannot post anything without your explicit approval.

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       DAILY AUTOMATION CYCLE                      │
│   (triggered by Vercel Cron or local daemon via orchestrator.ts)  │
├───────────────┬───────────────┬─────────────┬───────────────────┤
│   GitHub      │   Tech        │   Job       │   Content         │
│   Intelligence│   Intelligence│   Intelligence│   Lab            │
│   Engine      │   Engine      │   Engine    │   Engine           │
│               │               │             │                    │
│ → Scan repos  │ → HN, Reddit  │ → Job boards│ → Score candidates │
│ → Extract     │ → Extract     │ → Match to  │ → Generate drafts  │
│   evidence    │   trends      │   profile   │ → Dedup check      │
│ → Store in    │ → Create      │ → Create    │ → Send to review   │
│   github_     │   tech_topics │   jobs      │                    │
│   evidence    │   table       │   table     │                    │
└───────┬───────┴───────┬───────┴──────┬──────┴────────┬──────────┘
        │               │              │               │
        └───────────────┴──────────────┴───────────────┘
                                │
                    ┌───────────▼───────────┐
                    │  Content Candidates   │
                    │  (IDEA → scored)      │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │  Content Drafts       │
                    │  (AI_REVIEW)          │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │  Human Review Queue   │
                    │  (HUMAN_REVIEW)       │
                    │  [Approve | Reject]   │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │  Publishing Engine    │
                    │  APPROVED → SCHEDULED │
                    │  → PUBLISHING         │
                    │  → PUBLISHED          │
                    └───────────────────────┘
```

## State Machine

Content drafts follow a strict state machine. Illegal transitions are blocked.

```
AI_REVIEW → HUMAN_REVIEW → APPROVED → SCHEDULED → PUBLISHING → PUBLISHED
                         ↘ REJECTED                           ↗ (on failure)
                         ↘ REWORK → HUMAN_REVIEW              APPROVED
```

### Valid Transitions

| From | To | Trigger |
|------|-----|---------|
| AI_REVIEW | HUMAN_REVIEW | Auto (after AI scoring) |
| HUMAN_REVIEW | APPROVED | Human clicks "Approve" |
| HUMAN_REVIEW | REJECTED | Human clicks "Reject" |
| HUMAN_REVIEW | REWORK | Human clicks "Rework" |
| APPROVED | SCHEDULED | Human sets a publish date |
| APPROVED | PUBLISHING | Human clicks "Post Now" |
| REWORK | HUMAN_REVIEW | AI regenerates and resubmits |
| SCHEDULED | PUBLISHING | Daemon triggers at scheduled time |
| PUBLISHING | PUBLISHED | LinkedIn API returns success |
| PUBLISHING | APPROVED | LinkedIn API fails (rollback) |

### Terminal States
- **PUBLISHED**: Content is live. No further transitions.
- **REJECTED**: Permanently dismissed.

## Safety Checks (Publishing Engine)

Before ANY content reaches LinkedIn, the PublishingEngine runs 5 checks:

1. **Existence**: Draft must exist in the database
2. **State**: Draft must be APPROVED or SCHEDULED
3. **Approval Record**: Must have `approvedBy` and `approvedAt` fields set
4. **Idempotency**: Must not already be in `publishedPosts` table
5. **Atomic Lock**: Uses optimistic locking to prevent double-publish

## AI Cost Control

The `AICostController` routes tasks to different models:

- **Simple tasks** (classification, scoring) → cheap model (Gemini Flash)
- **Complex tasks** (content generation, analysis) → capable model (GPT-4)

This minimizes API costs while maintaining quality where it matters.

## Duplicate Detection

Uses Jaccard keyword similarity to prevent content repetition:

1. Extract keywords from text (strip stop words, normalize)
2. Compare keyword sets using Jaccard coefficient
3. Flag if similarity > 0.7 (configurable in `config.ts`)
4. Look back 30 days to prevent repeating old topics

## Database

Uses SQLite (via `better-sqlite3` + `drizzle-orm`) for local mode,
compatible with Postgres on Vercel via connection string swap.

### Key Tables

| Table | Purpose |
|-------|---------|
| `users` | Single user (V1) |
| `apiCredentials` | GitHub/LinkedIn tokens |
| `profiles` | Target roles, skills |
| `repositories` | Tracked GitHub repos |
| `githubActivity` | Commits, PRs, issues |
| `githubEvidence` | Extracted technical claims with file references |
| `techTopics` | Trending tech topics |
| `jobs` | Discovered job postings |
| `contentCandidates` | Scored content ideas |
| `contentDrafts` | Generated posts with status |
| `publishedPosts` | Published LinkedIn posts |
| `automationRuns` | Pipeline execution history |
| `auditLogs` | Security/compliance trail |

## API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/cron/daily` | Trigger daily automation cycle |
| POST | `/api/content/[id]/approve` | Approve a draft |
| POST | `/api/content/[id]/reject` | Reject/rework a draft |
| POST | `/api/content/[id]/schedule` | Schedule for future publishing |
| POST | `/api/content/publish` | Publish immediately to LinkedIn |
| GET | `/api/health` | System health check |

## Deployment Modes

### Local Daemon
```bash
npm run start:daemon
```
Runs `daemon.ts` which calls `runFullCycle()` on a configurable interval.

### Vercel Cron
Configured in `vercel.json` to trigger `/api/cron/daily` at 6 AM UTC.

Both modes use the same `runFullCycle()` orchestrator, ensuring identical behavior.

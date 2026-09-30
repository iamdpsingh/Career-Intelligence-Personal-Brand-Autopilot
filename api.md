# API Contracts

## Internal APIs

### `GET /api/cron/daily`
- **Description**: Triggered by Vercel Cron. Orchestrates the daily pipeline.
- **Auth**: Protected by `CRON_SECRET` via Vercel's `Authorization: Bearer` header.
- **Flow**:
  1. Calls `GitHubIntelligence.analyzeRecentActivity()` to populate `content_candidates`.
  2. Calls `ContentDecisionEngine.shouldDraftNewContent()` to enforce minimum posting rules.
  3. If true, selects top candidate and passes to `ContentGenerator.generateDraft()`.
  4. Saves draft to `content_drafts` as `HUMAN_REVIEW`.

## External APIs

### GitHub API (REST & GraphQL)
- **Authentication**: Bearer token (PAT stored securely in DB).
- **Usage**: Scans user's repository events for significant commits.

### OpenAI API / AI Providers
- **Authentication**: Bearer token (stored in environment variables).
- **Usage**: Multi-stage processing via `AICostController`.
  - Stage 1: Angle Generation
  - Stage 2: Drafting
  - Stage 3: Fact Checking (against original evidence)

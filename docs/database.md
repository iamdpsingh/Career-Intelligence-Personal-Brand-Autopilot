# Database & Schema Documentation

The system uses PostgreSQL managed via Drizzle ORM.

## Core Tables

### 1. `users`
Manages identity and OAuth tokens.
- `id`: UUID (Primary Key)
- `githubToken`: Encrypted storage for GitHub PAT.
- `linkedinToken`: (V2) Encrypted storage for LinkedIn publishing.

### 2. `content_candidates` (The Intelligence Layer)
Stores raw evidence discovered by the cron jobs.
- `id`: UUID
- `userId`: Relation to `users`
- `sourceType`: Enum (`GITHUB_COMMIT`, `JOB_POSTING`, etc.)
- `sourceId`: The external ID (e.g., commit SHA)
- `title` / `description`: Extracted raw metadata.
- `evidenceUrl`: Hard link to the truth (e.g., github.com/user/repo/commit/xxx)
- `score`: AI-assigned priority score (0-100).
- `status`: State machine (`IDEA`, `DRAFTED`, `REJECTED`).

### 3. `content_drafts` (The Generation Layer)
Stores AI-generated content linked to a candidate.
- `id`: UUID
- `candidateId`: Relation to `content_candidates`
- `content`: The drafted post text.
- `status`: State machine (`DRAFT`, `HUMAN_REVIEW`, `APPROVED`, `SCHEDULED`, `PUBLISHING`, `PUBLISHED`, `REJECTED`, `FAILED`).
- `publishedUrl`: Hard link to the live LinkedIn post (populated post-publish).

## Authentication & OAuth Flows
In V1, authentication is bypassed or hardcoded for a single-user system.
In V2, NextAuth.js (Auth.js) will be implemented to handle GitHub and LinkedIn OAuth. Tokens will be stored in the `users` table, specifically isolated so that AI engines only have read-only access to GitHub, and the Publishing engine exclusively owns the LinkedIn tokens.

# Rule 09: Database Rules

## 1. Stack and ORM
- Use **PostgreSQL**.
- Use **Drizzle ORM** for all schema definitions and queries to ensure end-to-end type safety.

## 2. Required Schema Architecture
The database must be comprehensive. Required tables include:
- `users`, `profiles`
- `repositories`, `github_activity`, `github_evidence`
- `jobs`, `job_sources`, `job_matches`
- `tech_topics`, `sources`
- `content_candidates`, `content_evidence`, `content_drafts`, `content_images`, `content_queue`
- `publishing_schedule`, `published_posts`, `post_metrics`
- `automation_runs`, `automation_errors`, `api_credentials`, `audit_logs`

## 3. The Traceability Mandate
The schema must support absolute traceability from a published post back to its raw evidence.
**Relationship Chain:**
`repositories` → `github_evidence` → `content_candidates` → `content_drafts` → `content_queue` → `published_posts`
A user must be able to click a published post and see exactly which GitHub commit or file triggered it.

## 4. Concurrency and Locking
- All critical state transitions (e.g., moving a post from `QUEUED` to `PUBLISHING`) must use database transactions and row-level locks.
- Implement idempotency keys for all external write operations to prevent double-posting if multiple workers execute simultaneously.

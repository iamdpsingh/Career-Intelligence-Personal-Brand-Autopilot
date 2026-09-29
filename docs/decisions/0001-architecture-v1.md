# Architecture Decision Record: V1 Core System

## Context
We need a scalable, automated system that discovers career achievements (via GitHub) and drafts LinkedIn posts, while remaining cost-effective (free tier) and absolutely preventing automated publishing without human approval.

## Decision
1. **Next.js App Router (Server Actions & API Routes)**: Chosen for its seamless integration with Vercel Cron jobs and backend/frontend co-location.
2. **Drizzle ORM + Supabase (PostgreSQL)**: Selected to enforce relational integrity for the State Machine (`IDEA` -> `DRAFT` -> `HUMAN_REVIEW` -> `PUBLISHING`).
3. **The Human Shield Pattern**: The AI is physically disconnected from the publishing APIs. It can only write to the `content_drafts` table with status `HUMAN_REVIEW`. Only a human interacting with the Dashboard UI can update the status to `PUBLISHING`.
4. **The Truth Engine**: AI is not allowed to invent narratives. It MUST receive a hard link to evidence (e.g., GitHub Commit SHA) before it is permitted to generate text.

## Consequences
- **Positive**: Zero risk of rogue AI posting hallucinations to a professional network. Zero cost for idle time (Serverless architecture).
- **Negative**: Requires daily manual approval in the Dashboard UI. Vercel Hobby limits cron jobs to 1 run per day, which dictates our batch-processing design.

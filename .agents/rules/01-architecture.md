# Rule 01: Architecture Rules

## 1. Free-Tier Optimized Architecture
The system must be designed to run continuously on zero-cost or extremely low-cost infrastructure.
- **Frontend & Orchestration:** Vercel (Hobby Tier).
- **Database:** PostgreSQL (Free Tier, e.g., Supabase/Neon).
- **Object Storage:** Free tier S3-compatible storage for generated images.
- **APIs:** GitHub REST API, LinkedIn API, free/low-cost AI Providers.

## 2. Provider Abstractions
To prevent vendor lock-in and manage costs, all external services must be abstracted:
- **`AIProvider`**: Implementations for OpenAI, Gemini, Local, etc. The system must be able to switch providers based on cost, rate limits, or availability.
- **`ImageProvider`**: Abstraction for image generation.
- **`LinkedInProvider`**: Isolates LinkedIn's versioned API logic from the core application.

## 3. The Orchestration Pattern
Do not build monolithic Vercel functions (e.g., a single `/api/run-everything`).
- Vercel functions have timeouts (e.g., 5 minutes on Hobby).
- The daily cron (`/api/cron/daily`) acts strictly as an **Orchestrator**.
- The Orchestrator acquires a distributed lock and dispatches work to separate, isolated service modules (Job Discovery, GitHub Sync, Tech Discovery, Queue Manager).

## 4. The Content State Machine
The posting engine must maintain explicit, strict states:
`IDEA` → `DRAFT` → `AI_REVIEW` → `HUMAN_REVIEW` → `APPROVED` → `SCHEDULED` → `PUBLISHED`
(Alternative paths: `REJECTED`, `REWORK`, `FAILED`).

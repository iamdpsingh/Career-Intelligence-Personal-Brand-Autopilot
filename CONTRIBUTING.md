# Contributing to Career Intelligence Autopilot

Thank you for your interest! Since this is an automated agentic system, we follow strict rules for contributions.

## Architectural Integrity

Before contributing, you **MUST** read the `.agents/rules/` directory. 
This project is governed by strict architectural principles (e.g., The Human Shield, The Truth Engine, Vercel Hobby Limits). Any PR that violates these rules will be rejected.

## Development Setup

1. Copy `.env.example` to `.env` and fill in your values.
2. Ensure you are running PostgreSQL (or Supabase).
3. Run `npm run db:push` to sync the schema.
4. Run `npm run dev` to start the Next.js server.

## Code Standards
- We use **Drizzle ORM** for all database interactions.
- All AI logic must route through `AICostController` (no raw API calls in components).
- Frontend components should use Tailwind CSS and keep client-side state minimal.

## Pull Requests
- Ensure all tests pass.
- Reference any relevant issues.
- Keep the diff focused (do not mix refactors with feature additions).

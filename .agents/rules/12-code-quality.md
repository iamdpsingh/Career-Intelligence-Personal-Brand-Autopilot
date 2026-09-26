# Rule 12: Code Quality & Architecture

## 1. Strict Typing and Validation
- **TypeScript:** Strict mode is mandatory. No `any` types allowed. All API payloads, database models, and internal states must be strongly typed.
- **Zod Validation:** Every external input—whether from a user form, a GitHub API response, a LinkedIn API response, or an AI JSON output—MUST be validated using Zod schemas before entering the business logic layer.

## 2. The AI Generation Pipeline
Never use one giant, brittle prompt to generate content. The generation pipeline must be modular and staged:
1. `Evidence Extraction`
2. `Fact Sheet Generation`
3. `Story Angle Selection`
4. `Drafting`
5. `Technical Review`
6. `Fact Check`
7. `Brand Voice Review`
8. `Duplicate Check`
9. `Final Draft`
10. `Human Approval`

## 3. Separation of Concerns
- Never scatter external API calls (e.g., `fetch('https://api.github.com/...')`) throughout UI components.
- All external calls must exist in dedicated service modules or provider abstractions.
- UI components should only interact with Next.js API routes or Server Actions.

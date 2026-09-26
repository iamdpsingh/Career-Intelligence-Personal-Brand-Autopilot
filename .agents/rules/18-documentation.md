# Rule 18: Documentation & Definition of Done

## 1. The Definition of Done
The project, or any major feature within it, is NOT COMPLETE until the 43-point checklist is satisfied. This includes full documentation of the architecture, database, API contracts, and security flows.

## 2. Module-Level Documentation
Every major module (e.g., Job Engine, Content Decision Engine) MUST include documentation covering:
- Purpose
- Architecture
- Inputs & Outputs
- Dependencies
- Failure Modes
- Security Considerations
- Rate Limits
- Testing Strategy
- Operational Notes

## 3. Architecture Decision Records (ADRs)
All major technical decisions must be recorded in `docs/decisions/` as ADRs.
Examples: `ADR-001-nextjs-vercel.md`, `ADR-002-postgresql.md`, `ADR-008-publishing-idempotency.md`.

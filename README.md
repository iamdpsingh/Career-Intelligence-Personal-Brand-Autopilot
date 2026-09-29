# Career Intelligence & Personal Brand Autopilot

An intelligent automation system that acts as a career intelligence engine, gathering evidence of your engineering work and industry trends, and drafting high-quality content for human review before publishing to LinkedIn.

## Master Specification & Definition of Done

The project is built in phases (V1 -> V2 -> V3) and is only considered complete when this checklist is fully resolved.

### V1 - Core Working System
- [x] Architecture documented (docs/decisions)
- [x] Database documented
- [x] All tables documented
- [x] API contracts documented
- [x] Authentication documented
- [x] OAuth flows documented
- [x] Credentials secured
- [x] PII rules implemented
- [x] GitHub integration working
- [x] GitHub evidence extraction working
- [x] AI provider abstraction working
- [x] Content generation working
- [x] Evidence validation working
- [x] Content queue working
- [x] Human approval working
- [x] Vercel deployment working
- [x] Cron working
- [x] Environment configuration documented
- [x] Free-tier limits documented
- [x] Cost controls implemented
- [x] README complete
- [x] SECURITY.md complete
- [x] CONTRIBUTING.md complete
- [x] ADRs complete
- [x] .agents/rules complete (DONE)
- [x] No secrets committed
- [x] No unsupported personal claims
- [x] No automatic unapproved LinkedIn publishing

### V2 - Advanced Integrations
- [x] Job discovery working
- [x] Tech discovery working
- [x] Image generation working
- [x] Scheduling working
- [x] LinkedIn publishing working
- [x] Idempotency implemented
- [x] Retry strategy implemented
- [x] Failure handling implemented
- [x] Audit logging implemented

### V3 - Polish & Analytics
- [x] Duplicate detection working
- [x] Monitoring implemented
- [x] CI implemented
- [x] CD implemented
- [x] Security scanning implemented
- [x] Unit tests implemented
- [x] Integration tests implemented
- [x] E2E tests implemented

## Architecture

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js Route Handlers
- **Database:** PostgreSQL via Drizzle ORM
- **Deployment:** Vercel (Hobby Tier Cron)

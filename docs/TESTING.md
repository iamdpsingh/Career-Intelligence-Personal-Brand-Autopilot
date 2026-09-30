# Testing Documentation

## Test Strategy

The project follows a multi-layer testing strategy aligned with the Testing Pyramid:

```
                  ┌──────────┐
                  │   E2E    │  Playwright
                  │ (few)    │  (browser-level)
                 ┌┴──────────┴┐
                 │ Integration │  API route tests
                 │ (some)      │  (contract validation)
                ┌┴─────────────┴┐
                │  Unit Tests    │  Vitest
                │  (many)        │  (120+ tests)
                └────────────────┘
```

## Running Tests

```bash
# All unit tests
npm test

# With coverage report
npm run test:coverage

# Watch mode during development
npx vitest

# End-to-end tests
npm run test:e2e
```

## Test Files

| File | Module | Tests | What It Validates |
|------|--------|-------|-------------------|
| `config.test.ts` | Central Config | 14 | Publishing rules, scoring thresholds, retry strategy |
| `duplicate.test.ts` | Duplicate Detection | 17 | Keyword extraction, Jaccard similarity, edge cases |
| `retry.test.ts` | Retry System | 7 | Backoff timing, max retries, error propagation |
| `publishing.test.ts` | Publishing Engine | 18 | State machine transitions, 5 safety checks |
| `api-routes.test.ts` | API Routes | 15 | Input validation, response contracts |
| `schema.test.ts` | Database Schema | 31 | Table existence, column integrity, relationships |
| `ai-provider.test.ts` | AI Cost Control | 8 | Model routing, cost optimization, security |
| `decision.test.ts` | Content Decision | 1 | Weekly quota logic (placeholder) |
| `nvidia-nim.test.ts` | NVIDIA NIM | varies | AI provider integration |

### Total: 120+ unit tests, all passing

## What Each Test Suite Covers

### Config Tests (`config.test.ts`)
- Publishing rules (min 2, max 5 posts/week)
- Content windows (morning/evening format)
- Scoring thresholds (min 60, exceptional 90)
- Duplicate detection settings (0.7 threshold, 30-day lookback)
- Daemon settings (cycle interval, deployment mode)
- Retry strategy (max 3 attempts, skip 401/403)
- GitHub API settings (rate limit warning at 100)
- Configuration immutability

### Duplicate Detection Tests (`duplicate.test.ts`)
- Keyword extraction from text
- Stop word filtering
- Punctuation stripping
- Case insensitivity
- Short word filtering
- Identical text detection (score = 1.0)
- Completely different text (score = 0)
- Paraphrased content detection
- Symmetrical results
- Unicode handling
- Very long text handling

### Retry System Tests (`retry.test.ts`)
- Succeed on first attempt
- Recover after temporary failure
- Fail after max retries exhausted
- Configurable retry count
- Exponential backoff timing
- Error type preservation
- Async operation handling

### Publishing Engine Tests (`publishing.test.ts`)
- All 10 valid state transitions
- 7 invalid transitions (safety-critical blocks)
- Safety Check 1: Draft existence
- Safety Check 2: Correct state requirement
- Safety Check 3: Approval record verification
- Safety Check 4: Idempotency (no double-publish)
- Safety Check 5: Atomic lock (concurrent worker protection)

### API Route Tests (`api-routes.test.ts`)
- Approve endpoint: userId requirement, response shape
- Reject endpoint: sendToRework option, status values
- Schedule endpoint: date validation, past date rejection
- Publish endpoint: required fields, LinkedIn response
- Health endpoint: response shape, degraded status
- Cron endpoint: pipeline result structure

### Schema Tests (`schema.test.ts`)
- All 15 tables exist and are exported
- Critical columns on users, apiCredentials, contentDrafts
- Published posts idempotency key
- GitHub evidence Truth Engine columns
- Content candidate scoring columns
- Automation run tracking columns
- Audit log completeness
- Foreign key relationship integrity

### AI Provider Tests (`ai-provider.test.ts`)
- Provider interface compliance
- Simple task → cheap model routing
- Complex task → expensive model routing
- Multi-call model isolation
- Prompt passthrough verification
- Error propagation from providers
- No API key exposure in interface

## Test Philosophy

1. **No database required**: All unit tests run without SQLite/Postgres
2. **Fast**: Full suite completes in ~1.2 seconds
3. **Deterministic**: No network calls, no randomness
4. **Safety-first**: Publishing engine tests are the most thorough
5. **Contract-based**: API tests verify shapes, not implementation

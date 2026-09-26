# Rule 10: Error Handling & Resilience

## 1. Independent Pipeline Fault Tolerance
Never allow a failure in one intelligence pipeline to crash the entire automation run.
- If the GitHub API fails or rate-limits, the system must log the failure, mark the GitHub stage as failed, and **continue** with Tech Discovery and Job Discovery.
- Each pipeline must catch its own exceptions and return a sanitized status to the Orchestrator.

## 2. Retry Strategy
Implement a robust retry mechanism for transient external API failures:
- `Attempt 1` → `Failure` → `Exponential Backoff` → `Attempt 2` → `Failure` → `Attempt 3` → `Dead-letter / Error state`.
- **CRITICAL:** Do NOT blindly retry authentication failures (401), authorization failures (403), or invalid requests (400). Only retry 5xx errors or network timeouts.

## 3. Publishing Failures
If a post fails to publish to LinkedIn:
- Preserve the draft.
- Preserve the error details in the database.
- Transition the post state to `FAILED`.
- Do not silently retry forever.
- Do not mark the post as `PUBLISHED`.

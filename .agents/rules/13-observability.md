# Rule 13: Observability & Auditing

## 1. Automation Run Tracking
Every execution of the daily orchestrator must be recorded in the `automation_runs` table.
**Required Fields:**
- `run_id`, `started_at`, `finished_at`, `trigger`, `status`, `duration`
- `items_found`, `items_processed`, `items_failed`
- `api_calls`, `tokens_used`, `errors`

## 2. Audit Logging
Every sensitive operation must generate a record in the `audit_logs` table.
**Tracked Actions:** `USER_LOGIN`, `GITHUB_CONNECTED`, `LINKEDIN_CONNECTED`, `CONTENT_CREATED`, `CONTENT_EDITED`, `CONTENT_APPROVED`, `CONTENT_REJECTED`, `CONTENT_SCHEDULED`, `CONTENT_PUBLISHED`, `CREDENTIAL_REFRESHED`, `CREDENTIAL_REVOKED`.
**Record Structure:** `actor`, `timestamp`, `action`, `resource`, `result`, `request_id`.
*Never store sensitive payloads in the audit log.*

## 3. Analytics Dashboard
The UI must include an `/analytics` route displaying:
- Automation health (success/failure rates, average duration).
- Content metrics (candidates generated, approved, rejected, published).
- Job metrics (discovered, deduplicated, relevant, saved).
- API metrics (calls made, rate-limit warnings).

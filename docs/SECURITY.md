# Security Documentation

## Threat Model

This system handles sensitive credentials (GitHub tokens, LinkedIn OAuth tokens)
and publishes content to a professional social network. Security is critical.

### Assets to Protect
1. **API Credentials** (GitHub tokens, LinkedIn OAuth tokens)
2. **User Profile Data** (skills, target roles, career info)
3. **Content Integrity** (prevent unauthorized publishing)
4. **Publishing Control** (prevent auto-posting without approval)

## Security Controls

### 1. Credential Storage

- **API tokens are stored encrypted in the database** (via `apiCredentials` table)
- **Tokens are NEVER returned to the browser** (Settings page only shows provider name + status)
- **Environment variables** hold master keys, never committed to git
- **`.env` is in `.gitignore`** — always verified before committing

### 2. Human-in-the-Loop Publishing

- AI generates content but **cannot publish it**
- Publishing requires explicit human approval (`approvedBy` + `approvedAt`)
- The PublishingEngine runs **5 safety checks** before any LinkedIn API call
- There is no "auto-publish" mode — this is by design, not a limitation

### 3. API Route Security

- **Cron endpoint** (`/api/cron/daily`) validates `CRON_SECRET` in production
- **Content endpoints** require `userId` in the request body
- **Health endpoint** is public but returns no sensitive data

### 4. Audit Trail

Every action is logged to the `auditLogs` table:
- Who did what
- On which resource
- What was the result
- When it happened

### 5. PII Protection

- User email addresses are stored but never included in generated content
- GitHub activity is public data, but we don't expose private repo details
- LinkedIn tokens are OAuth2 scoped to `w_member_social` only

## Rate Limit Awareness

| API | Rate Limit | Our Protection |
|-----|-----------|----------------|
| GitHub | 5000/hour | Check `X-RateLimit-Remaining`, pause at 100 |
| LinkedIn | Per-app limits | Max 5 posts/week, cooldown between posts |
| NVIDIA NIM | 1000/month | Cost routing to minimize calls |
| HackerNews | No auth needed | Simple fetch, no abuse |

## Security Headers (Vercel)

Configured in `vercel.json`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

## Incident Response

If credentials are compromised:

1. **Immediately revoke** the token on GitHub/LinkedIn
2. **Rotate** the credential and update environment variables
3. **Check audit logs** for unauthorized publishing
4. **Review published posts** for any content you didn't approve

## Dependencies

All dependencies are from trusted sources (npm registry).
The project uses `npm audit` in CI to check for known vulnerabilities.

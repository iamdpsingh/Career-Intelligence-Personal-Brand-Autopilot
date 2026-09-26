# Security Rules

1. Never hardcode secrets, API keys, OAuth tokens, passwords, cookies, session identifiers, or private credentials.
2. Never expose secrets through NEXT_PUBLIC_* variables.
3. Secrets must only be accessible from server-side code.
4. Never log credentials or complete authorization headers.
5. Never return credentials through API responses.
6. Validate every external input.
7. Apply least-privilege access to every external integration.
8. Do not grant GitHub write/admin permissions when read-only access is sufficient.
9. All sensitive state changes must be auditable.
10. Authentication and authorization must be checked server-side.
11. Never trust authorization decisions made only in the frontend.
12. Every publishing operation must require an authenticated user and explicit approval state.
13. Use idempotency protection for external write operations.
14. Never disable security controls simply to make a test pass.
15. Never commit .env files or secret material.
16. Security failures must fail closed.

# Credential Rules

Allowed:
- Vercel environment variables
- Secret management systems
- Encrypted credential storage

Forbidden:
- Source code
- Git history
- README files
- screenshots
- frontend bundles
- browser localStorage for long-lived OAuth secrets
- console logs

Credentials must have:
- provider
- credential type
- created_at
- updated_at
- expires_at when applicable
- status
- last_used_at

Never store plaintext secrets when encrypted storage is available.
Tokens must be revocable.
Expired credentials must transition to an explicit expired state.

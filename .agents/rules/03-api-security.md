# API Security Rules

1. Every external API integration must have its own provider module.
2. Never scatter external API calls throughout UI components.
3. Store API versions in configuration.
4. Validate API responses before using them.
5. Respect rate limits.
6. Read and track rate-limit headers when available.
7. Implement bounded retries with exponential backoff.
8. Do not retry authentication failures blindly.
9. Cache read-heavy API responses when appropriate.
10. Use ETags/conditional requests where supported.
11. Apply request timeouts.
12. Record sanitized API errors for observability.
13. Never log request bodies containing secrets or PII.
14. Every external write operation must support idempotency.
15. External API failures must not crash unrelated pipelines.
16. Provider-specific implementation details must remain isolated from business logic.

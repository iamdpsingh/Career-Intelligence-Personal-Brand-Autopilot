# PII Rules

Classify data before processing. PII includes, but is not limited to:
- email addresses
- phone numbers
- physical addresses
- personal identifiers
- OAuth identifiers
- private profile information

Rules:
1. Collect only what the application needs.
2. Do not send unnecessary PII to AI providers.
3. Redact PII before AI processing where possible.
4. Never expose PII in logs.
5. Never expose private job/application information publicly.
6. Do not put secrets or PII into generated LinkedIn posts.
7. Store only the minimum required historical data.
8. Provide deletion capability.
9. Keep audit records sanitized.
10. Never infer private personal information.

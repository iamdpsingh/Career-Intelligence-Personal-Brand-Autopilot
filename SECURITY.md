# Security Policy

## Supported Versions

Currently, this repository is in active development and only the main branch is supported with security updates.

## Reporting a Vulnerability

Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests. 
Instead, please send an email to the project maintainers. We will respond within 48 hours.

## Credentials and Secrets (Rule 33)
This project explicitly **bans** committing secrets, `.env` files, or API keys. 
- Third-party API keys (OpenAI, GitHub PATs) MUST be stored in the database securely or injected via Environment Variables.
- PII and private internal URLs must be scrubbed before passing context to LLMs.

## AI Guardrails (Rule 18, 61)
- The AI is structurally prevented from direct-publishing to LinkedIn or any social network. All outputs are forced into a `HUMAN_REVIEW` queue.
- The AI is bound to a "Truth Engine" rule: it must cite cryptographic/provable evidence (e.g., a GitHub commit SHA) for any claim it drafts.

# Rule 16: Git Workflow & CI/CD

## 1. Automated Workflows (GitHub Actions)
CI/CD must be operational from day one.
- **Pull Request Workflow:** Merge blocked until completion of: `Lint` → `Typecheck` → `Unit Tests` → `Integration Tests` → `Security Checks` → `Build`.
- **Main Branch Workflow:** `Merge` → `CI` → `Build` → `Deploy to Vercel` → `Smoke Test`.

## 2. Code Security in Git
- Implement automated dependency audits and secret scanning in GitHub Actions.
- Ensure `.gitignore` is comprehensive. NEVER allow `.env`, `*.pem`, `*.key`, `credentials.json`, or any token files to be committed.

## 3. Branching Strategy
- Feature branches must be used for all development.
- Commits should be descriptive and trace back to specific feature requirements or ADRs.

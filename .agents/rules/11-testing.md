# Rule 11: Testing & Verification

## 1. Core Testing Stack
- **Unit & Integration Tests:** Vitest.
- **End-to-End (E2E) Tests:** Playwright.

## 2. Testing Requirements
- **API Boundaries:** All external integrations (GitHub, LinkedIn, AI) must be heavily mocked during unit testing to ensure deterministic test runs.
- **State Machine Integration:** The Content State Machine and Database transaction locks must have dedicated integration tests proving that double-posting is impossible.
- **Security Validation:** Never disable security controls (like authentication middleware) simply to make a test pass. Test the security layers explicitly.

## 3. CI Integration
- CI/CD pipelines (GitHub Actions) must run linting, typechecking, and the full test suite on every pull request.
- A PR cannot be merged if test coverage drops or if integration tests fail.

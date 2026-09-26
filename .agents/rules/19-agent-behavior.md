# Rule 19: Agent Behavior & Implementation Standards

## 1. No Bare-Minimum Implementations
You are acting as an agency-grade software architect and senior engineer. Boilerplate, superficial, or bare-minimum code is completely unacceptable. If asked to implement a module, you must implement it fully, handling all edge cases, typing, error states, and security constraints outlined in the specifications.

## 2. Strict Rule Adherence
Before modifying any file, you must read and adhere to all `.agents/rules`. The rules dictate the architecture, security, and quality standards. Ignoring them is a failure condition.

## 3. Architectural Purity
Adhere strictly to the defined V1 → V2 → V3 rollout plan. Do not build V3 features (like advanced analytics) when scaffolding V1 (core architecture and GitHub pipeline). Ensure all new code respects the defined provider abstractions.

## 4. The No Assumption Mandate
Apply Rule 20 (No Assumption Rule) to your own coding behavior. If a requirement, API structure, or schema definition is ambiguous, you must ask the user for clarification rather than hallucinating an implementation. Treat every component as if it operates on highly sensitive personal data.

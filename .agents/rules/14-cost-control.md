# Rule 14: Cost Control & Optimization

## 1. The AI Cost-Control Layer
Before invoking any AI model, the system must evaluate the task through a cost-control decision tree:
1. **Can deterministic code solve this?** (e.g., regex, Zod parsing) → YES: Use code.
2. **Can a smaller model solve it?** (e.g., formatting, basic extraction) → YES: Use small model.
3. **Use Large Model** only for complex reasoning, drafting, and deep technical analysis.

## 2. Request Optimization
- **Caching:** Cache identical requests to prevent redundant AI API calls.
- **Context Truncation:** Never send an entire repository to an LLM. Extract and send only the relevant diffs, README sections, or issue descriptions.
- **Immutability:** Do not regenerate content that has already been generated and remains unchanged.

## 3. GitHub API Optimization
- Do not repeatedly download all repository data.
- Use `last_sync` timestamps to perform incremental syncs (fetch only new commits/PRs).
- Utilize ETag-based conditional requests for GitHub endpoints to save rate limits and bandwidth.

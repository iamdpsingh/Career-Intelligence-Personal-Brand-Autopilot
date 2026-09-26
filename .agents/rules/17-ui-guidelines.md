# Rule 17: UI & Interaction Guidelines

## 1. The Control Center Dashboard
The main dashboard must provide a high-level overview of the automation's health and outputs:
- **Overview:** Summaries of Jobs, GitHub opportunities, Queue length, and Calendar.
- **Today's Intelligence:** Specific metrics (e.g., "3 GitHub opportunities", "42 Relevant jobs", "Next post: Thursday 19:00").

## 2. Opportunity Management
Every Content Opportunity must display:
- Type (GitHub/Tech), Title, Source, Evidence list, Fact Confidence Score, Similarity Score, Image Status, and current state.
- **Action Buttons:** `[EDIT]`, `[APPROVE]`, `[QUEUE]`, `[REJECT]`, `[POST NOW]`.

## 3. The "POST NOW" Semantic
- Clicking `[POST NOW]` does NOT mean the AI bypasses human review.
- It means: The human explicitly confirms the content and instructs the system to bypass the queue and publish immediately.

## 4. Duplicate Content Protection
Before creating a new post, the UI and backend must compare candidates against previous posts, queued posts, rejected posts, and recent stories.
- If DUPLICATE: Do not publish.
- If SIMILAR: Suggest a rewrite/new angle.
- If NEW: Proceed.

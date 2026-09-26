# Rule 00: Project Overview

## 1. System Identity
The system is the "Career Intelligence & Personal Brand Autopilot". It is NOT an uncontrolled auto-posting bot. It is a sophisticated intelligence engine designed to automate the heavy lifting of professional brand management—research, analysis, drafting, ranking, queueing, and scheduling—while strictly enforcing a **Human Approval Layer** before any content goes live on LinkedIn.

## 2. Core Operational Loop
The system operates on a daily cron schedule, executing the following core loop:
1. **JOB INTELLIGENCE:** Find relevant jobs based on structured profile matching.
2. **GITHUB INTELLIGENCE:** Analyze actual engineering work (commits, architectures, problem-solving).
3. **TECH INTELLIGENCE:** Discover high-value, current technology topics from authoritative sources.
4. **CONTENT DECISION ENGINE:** Evaluate discoveries and determine if they warrant a post.
5. **AI CONTENT LAB:** Generate text, images, text-to-speech (TTS) audio, and source links for high-value candidates.
6. **HUMAN REVIEW UI:** Present candidates for human approval, rejection, or queueing.
7. **PUBLISHING:** Execute scheduled or immediate publishing to LinkedIn only after explicit approval.

## 3. The Discovery vs. Publishing Separation
- **Discovery Frequency:** The intelligence pipelines (Job, GitHub, Tech) run **DAILY** (e.g., between 06:00–08:00).
- **Publishing Frequency:** Publishing is bound by configuration rules:
  - `minimum_posts_per_week: 2`
  - `preferred_posts_per_week: 3`
  - `maximum_posts_per_week: 5`
- **Crucial Constraint:** The system must NEVER force a post simply because the calendar is empty. If there is no good GitHub story or interesting Tech topic, the system does nothing. There must be no artificial, fabricated "filler" content.

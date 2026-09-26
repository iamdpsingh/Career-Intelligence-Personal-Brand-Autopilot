# Rule 15: Vercel Deployment Rules

## 1. Ephemeral Infrastructure Awareness
- Vercel functions are ephemeral. Do not rely on in-memory state across requests.
- Never store generated images or assets permanently in the Vercel filesystem. Always upload to Object Storage and store the URL in the database.

## 2. Cron and Timeouts
- Vercel Hobby limits cron jobs to once per day. The architecture is explicitly designed around a single `06:00` daily intelligence run to fit this limit.
- Vercel Functions have strict timeouts (e.g., 5 minutes max on modern Fluid Compute). The daily orchestrator must not block synchronously on long-running tasks if they exceed this limit. It should coordinate work efficiently, potentially fanning out to smaller background jobs if necessary, or processing in optimized batches.

## 3. Environment Variables
- Ensure all provider configurations, database connection strings, and secret keys are managed securely via Vercel Environment Variables.

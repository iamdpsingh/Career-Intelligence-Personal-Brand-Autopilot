# Setup Guide

## Prerequisites

- **Node.js** 20+ (recommended: use `nvm` or `fnm`)
- **npm** 10+ (comes with Node.js)
- **Git** 2.40+

## Quick Start (Local Development)

```bash
# 1. Clone the repository
git clone https://github.com/iamdpsingh/Career-Intelligence-Personal-Brand-Autopilot.git
cd Career-Intelligence-Personal-Brand-Autopilot/career-intelligence-autopilot

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env
# Edit .env with your API keys (see below)

# 4. Initialize the database
npx drizzle-kit push

# 5. Start the development server
npm run dev
# Open http://localhost:3000

# 6. (Optional) Start the local automation daemon
npm run start:daemon
```

## Environment Variables

Create a `.env` file in the project root:

```bash
# Required for GitHub Intelligence Engine
GITHUB_TOKEN=ghp_your_github_personal_access_token

# Required for LinkedIn Publishing
LINKEDIN_CLIENT_ID=your_linkedin_app_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_app_client_secret
LINKEDIN_ACCESS_TOKEN=your_linkedin_oauth_access_token

# Required for AI Content Generation (choose one or more)
NVIDIA_NIM_API_KEY=your_nvidia_nim_key  # Primary (free tier available)
OPENAI_API_KEY=sk-your-openai-key      # Fallback

# Database (SQLite - no config needed for local mode)
DATABASE_URL=file:./data/local.db

# Vercel Cron Security (only needed for Vercel deployment)
CRON_SECRET=your_random_secret_string

# Mode: "local" or "vercel"
DEPLOYMENT_MODE=local
```

### Getting API Keys

#### GitHub Personal Access Token
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `read:user`, `read:org`
4. Copy the token to `GITHUB_TOKEN`

#### LinkedIn OAuth
1. Go to https://www.linkedin.com/developers/
2. Create an app (or use existing one)
3. Under "Auth" tab, get Client ID and Client Secret
4. Under "Products" tab, request access to "Share on LinkedIn"
5. Generate an access token with `w_member_social` scope

#### NVIDIA NIM (Recommended - Free Tier)
1. Go to https://build.nvidia.com/
2. Sign up for a free account
3. Navigate to any model, click "Get API Key"
4. Copy the key to `NVIDIA_NIM_API_KEY`

## Running Tests

```bash
# Run all unit tests (120 tests)
npm test

# Run with coverage report
npm run test:coverage

# Run end-to-end tests (requires dev server running)
npm run test:e2e
```

## Running the Local Daemon

The daemon runs the full intelligence cycle on a loop:

```bash
npm run start:daemon
```

This will:
1. Scan your tracked GitHub repositories for activity
2. Check HackerNews and tech feeds for trending topics
3. Search for matching job opportunities
4. Score and generate content candidates
5. Create drafts for human review
6. Wait for the configured interval, then repeat

## Deploying to Vercel (Free Tier)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Link your project
vercel link

# 3. Set environment variables on Vercel
vercel env add GITHUB_TOKEN
vercel env add NVIDIA_NIM_API_KEY
vercel env add CRON_SECRET
# ... add all variables from .env

# 4. Deploy
vercel --prod
```

### Free Tier Limits

| Service | Free Tier | Our Usage |
|---------|-----------|-----------|
| Vercel | 100GB bandwidth, 1 cron job/day | ~1 daily cron |
| NVIDIA NIM | 1000 API calls/month | ~60-100/month |
| GitHub API | 5000 requests/hour | ~50-200/day |
| LinkedIn API | Rate limited per app | 2-5 posts/week |

## Project Structure

```
career-intelligence-autopilot/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── content/       # Content management endpoints
│   │   ├── cron/          # Vercel cron trigger
│   │   └── health/        # Health check
│   ├── analytics/         # Analytics dashboard
│   ├── jobs/              # Job intelligence page
│   ├── opportunities/     # Content candidates page
│   ├── queue/             # Human review queue
│   └── settings/          # Configuration page
├── lib/                   # Core business logic
│   ├── ai/                # AI provider abstraction
│   ├── content/           # Content generation & dedup
│   ├── github/            # GitHub intelligence engine
│   ├── publishing/        # Publishing state machine
│   └── system/            # Config, orchestrator, retry
├── providers/             # Data layer
│   └── db/                # Drizzle ORM schema & connection
├── __tests__/             # Unit tests (Vitest)
├── e2e/                   # End-to-end tests (Playwright)
├── docs/                  # Documentation
├── daemon.ts              # Local daemon entry point
└── vercel.json            # Vercel deployment config
```

## Troubleshooting

### "Cannot find module better-sqlite3"
```bash
npm install better-sqlite3 @types/better-sqlite3
```

### "Database is locked"
Only one process can write to SQLite at a time. Stop the daemon before running
`drizzle-kit push` or migrations.

### "GitHub API rate limit exceeded"
The system tracks rate limits via the `X-RateLimit-Remaining` header.
If you see this error, wait 1 hour or use a different GitHub token.

### Tests failing in CI
Tests use `jsdom` environment and don't require a running server.
If schema tests fail, ensure `better-sqlite3` is properly installed
(it has native dependencies that need compilation).

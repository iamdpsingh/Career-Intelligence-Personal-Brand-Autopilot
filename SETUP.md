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

The project uses a `.env` file for secrets. You must copy the provided `.env.example` to `.env` and fill in your actual credentials.

> **Note**: Do not fill your real credentials into `.env.example`. Keep `.env.example` as a template (it is tracked by Git) and put your real secrets only in `.env` (which is ignored by Git).

```bash
# 1. AI PROVIDERS (Rule 18, 36)
OPENAI_API_KEY="sk-proj-..."
# ANTHROPIC_API_KEY="sk-ant-..."
# GROQ_API_KEY="gsk_..."

# NVIDIA API for Image Generation (V2)
# NVIDIA_API_KEY="nvapi-..."

# Spend limits
MAX_AI_SPEND_PER_MONTH_USD=0.00

# 2. DATABASE (Rule 23)
DATABASE_URL="./local.db"

# 3. CRON SECURITY (Rule 03, 33)
CRON_SECRET="your_secure_random_string_here"

# 4. GITHUB APP (V2)
# GITHUB_CLIENT_ID="..."
# GITHUB_CLIENT_SECRET="..."

# 5. LINKEDIN APP (V2)
# LINKEDIN_CLIENT_ID="..."
# LINKEDIN_CLIENT_SECRET="..."
```

### Getting API Keys

#### AI Providers
1. **OpenAI**: Go to [OpenAI API Keys](https://platform.openai.com/api-keys) and generate a new secret key.
2. **Anthropic** (Optional): Go to [Anthropic Console](https://console.anthropic.com/settings/keys) and generate a key.
3. **Groq** (Optional): Go to [GroqCloud](https://console.groq.com/keys) for ultra-fast Llama/Mixtral inference.
4. **NVIDIA** (Optional, for Image Gen): Go to [build.nvidia.com](https://build.nvidia.com/), sign up, and generate an API key.

#### Database
By default, the project runs on **SQLite locally**. `DATABASE_URL` should be `./local.db`. You do not need to set up an external database. 

#### Cron Security
1. For `CRON_SECRET`, simply generate a random string, e.g. run `openssl rand -hex 32` in your terminal and paste the result. This secures manual local cron invocations.

#### GitHub App (Optional for OAuth)
1. Go to [GitHub Developer Settings](https://github.com/settings/developers).
2. Create a "New GitHub App".
3. Retrieve your `Client ID` and generate a `Client Secret`.

#### LinkedIn App (Required for Publishing)
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/).
2. Create an App and verify it with your Company Page/Profile.
3. Under the "Auth" tab, retrieve your `Client ID` and `Client Secret`.
4. Request access to the "Share on LinkedIn" and "Sign In with LinkedIn v2" products under the "Products" tab.

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

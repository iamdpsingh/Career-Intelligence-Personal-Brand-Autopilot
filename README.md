# Career Intelligence & Personal Brand Autopilot

[![CI Pipeline](https://github.com/iamdpsingh/Career-Intelligence-Personal-Brand-Autopilot/actions/workflows/ci.yml/badge.svg)](https://github.com/iamdpsingh/Career-Intelligence-Personal-Brand-Autopilot/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)

An autonomous career intelligence and personal brand management engine. This system aggregates your engineering work, tracks industry trends, and drafts high-signal, evidence-backed content for human review before publishing to LinkedIn. 

Designed for engineers who want to maintain an active professional presence without sacrificing deep work time or compromising on technical depth.

## 🧠 Philosophy: Human-in-the-Loop Automation

Unlike standard auto-posting bots that spam generic content, this engine is built on a **human-approved** philosophy:
1. **Gather**: Pulls raw engineering data (GitHub commits, PRs) and industry trends (Tech blogs, job postings).
2. **Synthesize**: Uses AI to draft well-reasoned, highly technical posts based on *actual evidence*.
3. **Queue**: Places drafts into a human-review queue. 
4. **Publish**: Nothing goes live on LinkedIn without your explicit approval. 

## ✨ Key Features

- **GitHub Intelligence Engine**: Extracts themes from your code commits, PRs, and repository activity to highlight real technical achievements.
- **Trend & Job Discovery**: Analyzes the market for emerging tech and relevant roles to contextualize your brand.
- **Content Generation Pipeline**: Leverages modern LLMs for intelligent drafting with strict anti-hallucination and duplicate detection mechanisms.
- **Human-First Queue**: A clean, Next.js dashboard to review, edit, schedule, or reject AI-generated drafts.
- **Idempotent Operations**: Built with robust retry strategies and idempotency keys to handle API rate limits and transient failures gracefully.

## 🏗 Architecture & Stack

Built for the modern edge with a focus on type safety, performance, and maintainability.

- **Frontend**: [Next.js (App Router)](https://nextjs.org/), React 19, [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **Backend**: Next.js Route Handlers (Serverless APIs)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/)
- **Infrastructure**: Designed for [Vercel](https://vercel.com/) (Hobby Tier compatible with Vercel Cron)
- **Quality Assurance**: 
  - Unit & Integration Tests (`Jest` / `Vitest`)
  - End-to-End Tests (`Playwright`)
  - Load Testing (`k6`)
  - Accessibility Audits (`AxeBuilder`)

*(For deeper technical decisions, refer to [ARCHITECTURE.md](./ARCHITECTURE.md).)*

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- PostgreSQL database (local or cloud e.g., Supabase/Neon)
- GitHub Personal Access Token (for the intelligence engine)
- AI Provider API Key (NVIDIA NIM, OpenAI, Anthropic, etc.)
- LinkedIn API credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/iamdpsingh/Career-Intelligence-Personal-Brand-Autopilot.git
   cd career-intelligence-autopilot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Copy the example environment file and populate your secrets.
   ```bash
   cp .env.example .env
   ```
   *(See [SETUP.md](./SETUP.md) for detailed configuration options.)*

4. **Database Setup**
   Run Drizzle migrations to initialize your schema:
   ```bash
   npm run db:push
   ```

5. **Run the Development Server**
   ```bash
   npm run dev
   ```
   The dashboard will be available at [http://localhost:3000](http://localhost:3000).

## 🧪 Testing

We take reliability seriously. The CI pipeline enforces strict checks before any merge.

```bash
# Run unit tests
npm run test

# Run E2E & Accessibility tests (Playwright)
npm run test:e2e

# Run load tests (k6)
npm run test:load
```
*(For detailed testing strategies, see [TESTING.md](./TESTING.md).)*

## 🤝 Contributing

Contributions are welcome! Whether it's adding new intelligence sources, refining the AI prompts, or improving the UI. 

1. Check the [open issues](https://github.com/iamdpsingh/Career-Intelligence-Personal-Brand-Autopilot/issues).
2. Create a feature branch (`git checkout -b feat/amazing-feature`).
3. Ensure all tests and linting pass (`npm run build` / `npm run test`).
4. Commit using [Conventional Commits](https://www.conventionalcommits.org/).
5. Open a Pull Request.

Please review our [SECURITY.md](./SECURITY.md) for vulnerability reporting guidelines.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

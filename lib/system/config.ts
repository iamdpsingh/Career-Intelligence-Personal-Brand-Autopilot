// ----------------------------------------------------------------------
// CENTRAL CONFIGURATION (Spec Points 5, 12, 42, 46, 66)
// ----------------------------------------------------------------------
// WHY THIS EXISTS:
// Instead of scattering magic numbers across the codebase, we keep all
// tunable settings in one place. This makes it easy to adjust posting
// frequency, content windows, and scoring thresholds without hunting
// through 20 files. It also lets us switch between "local daemon" mode
// and "Vercel cron" mode with a single env var.
// ----------------------------------------------------------------------

export const config = {
  // --- POSTING RULES (Spec Point 5) ---
  // "minimum 2 times per week" but never force a post if there's nothing good.
  publishing: {
    minPostsPerWeek: 2,
    preferredPostsPerWeek: 3,
    maxPostsPerWeek: 5,
  },

  // --- CONTENT WINDOWS (Spec Point 12) ---
  // Posts only go out during these hours. The daemon checks these before publishing.
  contentWindows: {
    morning: { enabled: true, start: "08:00", end: "10:00" },
    evening: { enabled: true, start: "18:00", end: "21:00" },
  },

  // --- SCORING THRESHOLDS (Spec Point 16) ---
  // Internal scoring that decides whether a candidate is worth drafting.
  // These are NOT public ratings — they're internal decision signals.
  scoring: {
    minScoreForDrafting: 60,       // Below this, don't bother drafting
    exceptionalScoreThreshold: 90, // Above this, draft even if weekly quota is met
  },

  // --- DUPLICATE DETECTION (Spec Point 17) ---
  // How similar two pieces of content need to be before we flag them.
  duplicateDetection: {
    // Simple keyword overlap ratio (0-1). If >0.7, we consider it a duplicate.
    similarityThreshold: 0.7,
    // How far back to look for duplicates (in days)
    lookbackDays: 30,
  },

  // --- DAEMON CONFIG (Spec Point 45) ---
  // Controls the local automation loop when running without Vercel.
  daemon: {
    // How often the daemon wakes up to check for work (in milliseconds)
    cycleIntervalMs: parseInt(process.env.DAEMON_CYCLE_MS || "60000", 10),
    // Which mode we're running in. Affects how the orchestrator behaves.
    mode: (process.env.DEPLOYMENT_MODE || "local") as "local" | "vercel" | "netlify",
  },

  // --- RETRY STRATEGY (Spec Point 26) ---
  retry: {
    maxAttempts: 3,
    baseDelayMs: 1000,
    // These error types should NOT be retried (Spec Point 26: "Don't blindly retry auth failures")
    nonRetryableErrors: ["401", "403", "INVALID_TOKEN", "UNAUTHORIZED"],
  },

  // --- GITHUB API (Spec Point 27, 48) ---
  github: {
    // Rate limit warning threshold. We log a warning when remaining requests drop below this.
    rateLimitWarningThreshold: 100,
    // Max repos to scan per cycle to avoid hitting rate limits
    maxReposPerCycle: 20,
  },

  // --- AI COST CONTROL (Spec Point 47) ---
  ai: {
    // Maximum tokens to send per request to avoid runaway costs
    maxPromptTokens: 4000,
    // Cache TTL for identical AI requests (in seconds)
    cacheTtlSeconds: 3600,
  },

  // --- TECH INTELLIGENCE (Spec Point 10) ---
  techSources: {
    // Source tier hierarchy (Spec Point 10):
    // Tier 1 = Official docs/blogs, Tier 2 = Major publications, Tier 3 = Community
    minTierForAutoCandidate: 3,
    // Minimum HN score to promote to content candidate
    minHackerNewsScore: 200,
  },
} as const;

// WHY "as const"?
// TypeScript treats this as deeply readonly. Nobody can accidentally mutate
// config.publishing.minPostsPerWeek = 0 somewhere in the code.
// If you need to override values, use environment variables instead.

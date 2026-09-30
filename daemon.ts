import { runFullCycle } from "./lib/system/orchestrator";
import { config } from "./lib/system/config";
import dns from "node:dns";
import util from "node:util";
import * as dotenv from "dotenv";

// Load environment variables (.env.local first, then fallback to .env)
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const resolve = util.promisify(dns.resolve);

// ----------------------------------------------------------------------
// LOCAL DAEMON (Spec Point 42, 45)
// ----------------------------------------------------------------------
// WHY THIS EXISTS:
// Vercel's free tier only gives you 1 cron job per day. If you run out of
// free-tier credits, or simply want to run everything on your own machine,
// this daemon does the same thing the Vercel cron would do — but locally.
//
// HOW IT WORKS:
// 1. Starts up and prints a banner
// 2. Every N seconds (configurable), it checks for internet
// 3. If online, it runs the full intelligence cycle (GitHub → Tech → Jobs → Content)
// 4. If offline, it sleeps and tries again next cycle
//
// RUN IT:
//   npm run start:daemon
//
// STOP IT:
//   Ctrl+C (graceful shutdown is handled below)
// ----------------------------------------------------------------------

/**
 * Checks if the machine has internet by resolving a DNS query.
 * We use Google's DNS as a lightweight connectivity check.
 */
async function checkInternetConnection(): Promise<boolean> {
  try {
    await resolve("www.google.com");
    return true;
  } catch {
    return false;
  }
}

/**
 * The main loop that runs on each cycle tick.
 */
async function automationLoop() {
  console.log("\n[DAEMON] Waking up to check for pending automation tasks...");

  // Step 1: Are we online?
  const isOnline = await checkInternetConnection();
  if (!isOnline) {
    console.log("[DAEMON] No internet connection. Sleeping until next cycle.");
    return;
  }

  console.log("[DAEMON] Internet available. Running full intelligence cycle...");

  try {
    // Step 2: Run the shared orchestrator (same code as Vercel cron)
    const result = await runFullCycle("local-daemon");

    // Step 3: Print a human-readable summary
    console.log("\n--- CYCLE SUMMARY ---");
    console.log(`  Run ID:    ${result.runId}`);
    console.log(`  Status:    ${result.status.toUpperCase()}`);
    console.log(`  Duration:  ${result.duration}ms`);
    console.log(`  GitHub:    ${result.results.github.success ? "✓" : "✗"} (${result.results.github.evidenceFound} evidence)`);
    console.log(`  Tech:      ${result.results.tech.success ? "✓" : "✗"}`);
    console.log(`  Jobs:      ${result.results.jobs.success ? "✓" : "✗"}`);
    console.log(`  Content:   ${result.results.content.success ? "✓" : "✗"} (${result.results.content.drafted} drafted)`);
    console.log("---------------------\n");
  } catch (error) {
    console.error("[DAEMON] Critical error in automation cycle:", error);
  }
}

// ------------------------------------------------------------------
// BOOTSTRAP
// ------------------------------------------------------------------

const CYCLE_MS = config.daemon.cycleIntervalMs;

console.log(`
╔═══════════════════════════════════════════════════════════╗
║  🤖 CAREER INTELLIGENCE & PERSONAL BRAND AUTOPILOT      ║
╠═══════════════════════════════════════════════════════════╣
║  Mode:     Local Daemon                                  ║
║  Database: SQLite (local.db)                             ║
║  Cycle:    Every ${String(CYCLE_MS / 1000).padEnd(4)} seconds                             ║
║  Cloud:    Independent — no Vercel/Netlify required      ║
╚═══════════════════════════════════════════════════════════╝
`);

// Run immediately on start, then schedule recurring
automationLoop();
const intervalId = setInterval(automationLoop, CYCLE_MS);

// Graceful shutdown on Ctrl+C
process.on("SIGINT", () => {
  console.log("\n[DAEMON] Shutting down gracefully...");
  clearInterval(intervalId);
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n[DAEMON] Received SIGTERM. Shutting down...");
  clearInterval(intervalId);
  process.exit(0);
});

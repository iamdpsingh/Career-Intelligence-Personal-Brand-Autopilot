import { runFullCycle } from "./lib/system/orchestrator";
import dns from "node:dns";
import util from "node:util";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const resolve = util.promisify(dns.resolve);

// ----------------------------------------------------------------------
// LOCAL DAEMON — 6PM DAILY SCHEDULER
// ----------------------------------------------------------------------
// Schedule: Runs immediately on start, then every day at 6:00 PM IST.
// The 6PM trigger collects:
//   - GitHub commits from each tracked repo (one summary per repo)
//   - Remote job trends from Remotive, Himalayas, Arbeitnow (once/day)
//   - Tech news trends
//   - Drafts content for human review
// ----------------------------------------------------------------------

async function checkInternetConnection(): Promise<boolean> {
  try {
    await resolve("www.google.com");
    return true;
  } catch {
    return false;
  }
}

async function automationLoop(label: string) {
  console.log(`\n[DAEMON] ${label} — checking connectivity...`);

  const isOnline = await checkInternetConnection();
  if (!isOnline) {
    console.log("[DAEMON] No internet connection. Skipping cycle.");
    return;
  }

  console.log("[DAEMON] Online. Running full intelligence cycle...");

  try {
    const result = await runFullCycle("local-daemon");

    console.log("\n--- CYCLE SUMMARY ---");
    console.log(`  Run ID:    ${result.runId}`);
    console.log(`  Status:    ${result.status.toUpperCase()}`);
    console.log(`  Duration:  ${result.duration}ms`);
    console.log(`  GitHub:    ${result.results.github.success ? "✓" : "✗"} (${result.results.github.evidenceFound} evidence items)`);
    console.log(`  Tech:      ${result.results.tech.success ? "✓" : "✗"}`);
    console.log(`  Jobs:      ${result.results.jobs.success ? "✓" : "✗"}`);
    console.log(`  Content:   ${result.results.content.success ? "✓" : "✗"} (${result.results.content.drafted} drafted)`);
    console.log("---------------------\n");
  } catch (error) {
    console.error("[DAEMON] Critical error in automation cycle:", error);
  }
}

/**
 * Calculates milliseconds until the next 6:00 PM IST (UTC+5:30).
 * If 6 PM today has already passed, returns ms until 6 PM tomorrow.
 */
function msUntilNext6PMIST(): number {
  const now = new Date();

  // IST = UTC + 5:30 = UTC + 330 minutes
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const nowIST = new Date(now.getTime() + IST_OFFSET_MS);

  // Build today's 6 PM IST as a UTC date
  const target = new Date(Date.UTC(
    nowIST.getUTCFullYear(),
    nowIST.getUTCMonth(),
    nowIST.getUTCDate(),
    18, 0, 0, 0  // 18:00:00 IST
  ) - IST_OFFSET_MS); // convert back to UTC

  // If 6 PM today has already passed, schedule for tomorrow
  if (target.getTime() <= now.getTime()) {
    target.setUTCDate(target.getUTCDate() + 1);
  }

  return target.getTime() - now.getTime();
}

function scheduleDaily6PM() {
  const ms = msUntilNext6PMIST();
  const hoursUntil = (ms / (1000 * 60 * 60)).toFixed(1);

  const nextRunIST = new Date(Date.now() + ms);
  const istString = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "full",
    timeStyle: "short",
  }).format(nextRunIST);

  console.log(`\n[DAEMON] Next scheduled run: ${istString} (in ${hoursUntil}h)`);

  setTimeout(async () => {
    await automationLoop("Scheduled 6 PM cycle");
    // After first 6 PM run, schedule the next one
    scheduleDaily6PM();
  }, ms);
}

// ------------------------------------------------------------------
// BOOTSTRAP
// ------------------------------------------------------------------

console.log(`
╔═══════════════════════════════════════════════════════════╗
║  🤖 CAREER INTELLIGENCE & PERSONAL BRAND AUTOPILOT      ║
╠═══════════════════════════════════════════════════════════╣
║  Mode:     Daily 6PM Daemon (IST)                        ║
║  Database: SQLite (local.db)                             ║
║  Schedule: Run now + every day at 6:00 PM IST            ║
║  Sources:  GitHub · Remotive · Himalayas · Arbeitnow     ║
╚═══════════════════════════════════════════════════════════╝
`);

// 1. Run immediately on start
automationLoop("Startup cycle (fresh run)").then(() => {
  // 2. After startup run completes, schedule daily 6 PM cycles
  scheduleDaily6PM();
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n[DAEMON] Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n[DAEMON] Received SIGTERM. Shutting down...");
  process.exit(0);
});

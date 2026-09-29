import { db } from "./providers/db";
import { automationRuns, contentCandidates } from "./providers/db/schema";
import { eq } from "drizzle-orm";
import dns from "node:dns";
import util from "node:util";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const resolve = util.promisify(dns.resolve);

/**
 * Checks if the system has active internet connection before running jobs.
 */
async function checkInternetConnection(): Promise<boolean> {
  try {
    await resolve("www.google.com");
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * The CORE SOUL of the local automation system.
 * This runs continuously on the local machine and executes tasks when internet is available.
 */
async function automationLoop() {
  console.log("[\x1b[36mDAEMON\x1b[0m] Waking up to check for pending automation tasks...");

  const isOnline = await checkInternetConnection();
  if (!isOnline) {
    console.log("[\x1b[33mDAEMON\x1b[0m] No internet connection detected. Sleeping until next cycle.");
    return;
  }

  console.log("[\x1b[32mDAEMON\x1b[0m] Internet is available. Booting up intelligence pipelines...");

  try {
    // 1. Log the run
    const [run] = await db.insert(automationRuns).values({
      trigger: "local-daemon",
      status: "running",
    }).returning();

    console.log(`[\x1b[36mDAEMON\x1b[0m] Started Run ID: ${run.id}`);

    // --- PIPELINE 1: GITHUB INTELLIGENCE ---
    console.log("[\x1b[36mDAEMON\x1b[0m] Executing GitHub Intelligence Pipeline...");
    // TODO: Fetch commits, PRs from user repositories
    // e.g., await syncGithubActivity();

    // --- PIPELINE 2: TECH NEWS GATHERING ---
    console.log("[\x1b[36mDAEMON\x1b[0m] Executing Tech News Pipeline...");
    // TODO: Scrape HackerNews, TechCrunch, etc.
    // e.g., await syncTechNews();

    // --- PIPELINE 3: CONTENT DRAFTING ENGINE (LLM) ---
    console.log("[\x1b[36mDAEMON\x1b[0m] Executing Content Generation Engine...");
    const pendingIdeas = await db.select().from(contentCandidates).where(eq(contentCandidates.status, "IDEA")).limit(5);
    
    if (pendingIdeas.length > 0) {
      console.log(`[\x1b[36mDAEMON\x1b[0m] Found ${pendingIdeas.length} ideas to draft...`);
      for (const idea of pendingIdeas) {
        // Mock LLM generation delay
        console.log(`  -> Drafting content for idea: ${idea.title}`);
        // await draftContentForIdea(idea.id);
      }
    } else {
      console.log("[\x1b[36mDAEMON\x1b[0m] No new ideas to draft.");
    }

    // --- PIPELINE 4: PUBLISHING ENGINE ---
    console.log("[\x1b[36mDAEMON\x1b[0m] Checking for scheduled posts to publish...");
    // e.g., await publishScheduledPosts();

    // Mark run as success
    await db.update(automationRuns).set({
      status: "success",
      finishedAt: new Date(),
    }).where(eq(automationRuns.id, run.id));

    console.log("[\x1b[32mDAEMON\x1b[0m] Automation cycle complete.");

  } catch (error) {
    console.error("[\x1b[31mDAEMON\x1b[0m] Error in automation cycle:", error);
    // You could also log this to the automationRuns table
  }
}

// ------------------------------------------------------------------
// DAEMON BOOTSTRAP
// ------------------------------------------------------------------
const CYCLE_INTERVAL_MS = 60 * 1000; // Run every 60 seconds (adjust as needed)

console.log(`
=========================================================
 🤖 CAREER INTELLIGENCE & PERSONAL BRAND AUTOPILOT
=========================================================
 Daemon mode initialized.
 Running locally. Independent of Cloud Providers.
 Database: SQLite (local.db)
 Cycle Interval: ${CYCLE_INTERVAL_MS / 1000} seconds
=========================================================
`);

// Run immediately on start
automationLoop();

// And then schedule recurring
setInterval(automationLoop, CYCLE_INTERVAL_MS);

import "dotenv/config";
import { runFullCycle } from "../lib/system/orchestrator";

async function force() {
  await runFullCycle("manual");
  process.exit(0);
}

force();

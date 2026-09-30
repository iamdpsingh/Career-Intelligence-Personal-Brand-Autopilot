import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import { db } from './providers/db/index.ts';
import { runFullCycle } from './lib/system/orchestrator.ts';

async function main() {
  console.log(`Running orchestrator manually`);
  const results = await runFullCycle('manual');
  console.log("Orchestrator Results:", JSON.stringify(results, null, 2));
  process.exit(0);
}

main().catch(console.error);

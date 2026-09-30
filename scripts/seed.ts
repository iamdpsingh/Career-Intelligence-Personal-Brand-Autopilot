import { db } from "../providers/db";
import { users, repositories } from "../providers/db/schema";
import crypto from "crypto";

async function main() {
  console.log("Seeding local SQLite database...");

  // 1. Create a default user (since V1 is single-player local)
  const userId = "system";
  
  await db.insert(users).values({
    id: userId,
    name: "DPSingh",
    email: "iamdpsingh@example.com",
    githubUsername: "iamdpsingh",
  }).onConflictDoNothing();

  console.log("User 'system' ensured.");

  // 2. Track the project repository
  const repoName = "iamdpsingh/Career-Intelligence-Personal-Brand-Autopilot";
  
  await db.insert(repositories).values({
    id: crypto.randomUUID(),
    userId: userId,
    name: repoName,
    description: "Career Intelligence & Personal Brand Autopilot",
    url: `https://github.com/${repoName}`,
    isPrivate: false,
    trackActivity: true,
  }).onConflictDoNothing();

  console.log(`Repository '${repoName}' added to tracking list.`);
  
  console.log("Seed complete! You can now restart the daemon.");
}

main().catch((err) => {
  console.error("Failed to seed database:", err);
  process.exit(1);
});

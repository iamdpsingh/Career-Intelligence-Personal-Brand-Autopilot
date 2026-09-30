"use server";

import { db } from "@/providers/db";
import { jobs } from "@/providers/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function markJobVisited(jobId: string) {
  await db.update(jobs).set({ visited: true }).where(eq(jobs.id, jobId));
  revalidatePath("/jobs");
}

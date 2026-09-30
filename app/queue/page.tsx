import { db } from "@/providers/db";
import { contentDrafts, contentCandidates } from "@/providers/db/schema";
import { eq } from "drizzle-orm";
import QueueClient from "./queue-client";

export const dynamic = 'force-dynamic';

export default async function QueuePage() {
  let drafts: {
    id: string;
    content: string;
    status: string;
    candidateTitle: string;
    sourceType: string;
  }[] = [];

  try {
    const rows = await db
      .select({
        id: contentDrafts.id,
        content: contentDrafts.content,
        status: contentDrafts.status,
        candidateTitle: contentCandidates.title,
        sourceType: contentCandidates.sourceType,
      })
      .from(contentDrafts)
      .innerJoin(contentCandidates, eq(contentDrafts.candidateId, contentCandidates.id))
      .where(eq(contentDrafts.status, "HUMAN_REVIEW"));
    drafts = rows;
  } catch (_error) {
    console.warn("Database connection failed, showing empty queue");
  }

  return (
    <div className="space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      <header>
        <h1 className="text-3xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tight">Content Queue</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 md:mt-3 text-base md:text-lg font-medium">Review, approve, or reject AI-generated drafts.</p>
      </header>

      <QueueClient initialDrafts={drafts} />
    </div>
  );
}

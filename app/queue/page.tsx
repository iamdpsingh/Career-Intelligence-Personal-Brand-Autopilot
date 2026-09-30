import { db } from "@/providers/db";
import { contentDrafts, contentCandidates } from "@/providers/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const dynamic = 'force-dynamic';

export default async function QueuePage() {
  let drafts: any[] = [];
  try {
    drafts = await db
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
  } catch (_error) {
    console.warn("Database connection failed, showing empty queue for local monkey testing");
  }

  return (
    <div className="space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      <header>
        <h2 className="text-3xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tight">Content Queue</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 md:mt-3 text-base md:text-lg font-medium">Review, approve, or reject AI-generated drafts.</p>
      </header>

      <div className="space-y-4 md:space-y-6">
        {drafts.length === 0 ? (
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-2xl p-8 md:p-12 text-center rounded-3xl border border-zinc-200 dark:border-white/10 shadow-xl">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">You&apos;re all caught up!</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2 font-medium">No drafts are currently awaiting human review.</p>
          </div>
        ) : (
          drafts.map((draft) => (
            <div key={draft.id} className="bg-white/60 dark:bg-white/5 backdrop-blur-2xl rounded-3xl border border-zinc-200 dark:border-white/10 shadow-xl overflow-hidden group hover:border-zinc-300 dark:hover:border-white/20 transition-all duration-300">
              <div className="bg-white/40 dark:bg-white/5 px-6 md:px-8 py-4 md:py-5 border-b border-zinc-200 dark:border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <span className="bg-orange-500/10 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-500/20 dark:border-orange-500/30 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm shrink-0">
                    {draft.sourceType}
                  </span>
                  <h3 className="font-bold text-zinc-900 dark:text-white text-base md:text-lg">{draft.candidateTitle}</h3>
                </div>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/20 px-3 py-1.5 rounded-full border border-amber-500/20 dark:border-amber-500/30 shadow-sm whitespace-nowrap">
                  AWAITING APPROVAL
                </span>
              </div>
              
              <div className="p-6 md:p-8">
                <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300 font-medium whitespace-pre-wrap leading-relaxed">
                  {draft.content}
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="bg-zinc-50/50 dark:bg-black/20 px-6 md:px-8 py-5 md:py-6 border-t border-zinc-200 dark:border-white/10 flex flex-wrap gap-3 md:gap-4 items-center">
                <form action={async () => {
                  "use server";
                  await db.update(contentDrafts).set({ status: "APPROVED" }).where(eq(contentDrafts.id, draft.id));
                  revalidatePath('/queue');
                }}>
                  <button className="bg-white dark:bg-white/10 hover:bg-zinc-100 dark:hover:bg-white/20 text-zinc-900 dark:text-white font-bold py-2 md:py-2.5 px-4 md:px-6 rounded-xl shadow-sm md:shadow-lg border border-zinc-200 dark:border-white/10 transition-all text-sm md:text-base">
                    Approve to Queue
                  </button>
                </form>

                <form action={async () => {
                  "use server";
                  // Schedule for 9 AM tomorrow
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  tomorrow.setHours(9, 0, 0, 0);

                  await db.update(contentDrafts).set({ 
                    status: "SCHEDULED",
                    scheduledFor: tomorrow
                  }).where(eq(contentDrafts.id, draft.id));
                  revalidatePath('/queue');
                }}>
                  <button className="bg-lime-500 hover:bg-lime-600 dark:bg-lime-600 dark:hover:bg-lime-500 text-white dark:text-zinc-950 font-black py-2 md:py-2.5 px-4 md:px-6 rounded-xl shadow-md shadow-lime-500/20 transition-all text-sm md:text-base border-0">
                    Schedule
                  </button>
                </form>

                <form action={async () => {
                  "use server";
                  await db.update(contentDrafts).set({ status: "PUBLISHING" }).where(eq(contentDrafts.id, draft.id));
                  revalidatePath('/queue');
                }}>
                  <button className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-500 text-white font-bold py-2 md:py-2.5 px-4 md:px-6 rounded-xl shadow-md shadow-orange-500/30 transition-all text-sm md:text-base border-0">
                    Post Now
                  </button>
                </form>

                <div className="flex-1 min-w-[1rem]" />

                <form action={async () => {
                  "use server";
                  await db.update(contentDrafts).set({ status: "REJECTED" }).where(eq(contentDrafts.id, draft.id));
                  revalidatePath('/queue');
                }}>
                  <button className="bg-transparent hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 font-bold border border-red-200 dark:border-red-500/30 py-2 md:py-2.5 px-4 md:px-6 rounded-xl transition-all text-sm md:text-base">
                    Reject
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

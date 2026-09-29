import { db } from "@/providers/db";
import { contentDrafts, contentCandidates } from "@/providers/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ----------------------------------------------------------------------
// HUMAN REVIEW UI (Rule 52, 54, 61)
// ----------------------------------------------------------------------
// This is the Human Shield. The AI cannot publish directly to LinkedIn.
// Every generated draft lands here in "HUMAN_REVIEW" state.
// ----------------------------------------------------------------------

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
  } catch (error) {
    console.warn("Database connection failed, showing empty queue for local monkey testing");
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <header className="mb-8 max-w-4xl mx-auto">
        <h2 className="text-3xl font-semibold text-zinc-900">Content Queue</h2>
        <p className="text-zinc-500 mt-1">Review, approve, or reject AI-generated drafts.</p>
      </header>

      <div className="max-w-4xl mx-auto space-y-6">
        {drafts.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-zinc-200">
            <h3 className="text-lg font-medium text-zinc-900">You&apos;re all caught up!</h3>
            <p className="text-zinc-500 mt-2">No drafts are currently awaiting human review.</p>
          </div>
        ) : (
          drafts.map((draft) => (
            <div key={draft.id} className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="bg-zinc-100 px-6 py-3 border-b border-zinc-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded uppercase tracking-wider">
                    {draft.sourceType}
                  </span>
                  <h3 className="font-medium text-zinc-800">{draft.candidateTitle}</h3>
                </div>
                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                  AWAITING APPROVAL
                </span>
              </div>
              
              <div className="p-6">
                <div className="prose prose-sm max-w-none text-zinc-700 whitespace-pre-wrap">
                  {draft.content}
                </div>
              </div>

              {/* ACTION BUTTONS (Rule 54: Post Now vs Queue) */}
              <div className="bg-zinc-50 px-6 py-4 border-t border-zinc-200 flex gap-3">
                <form action={async () => {
                  "use server";
                  await db.update(contentDrafts).set({ status: "APPROVED" }).where(eq(contentDrafts.id, draft.id));
                  revalidatePath('/queue');
                }}>
                  <button className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-2 px-4 rounded-md shadow-sm transition-colors">
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
                  <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-md shadow-sm transition-colors">
                    Schedule
                  </button>
                </form>

                <form action={async () => {
                  "use server";
                  await db.update(contentDrafts).set({ status: "PUBLISHING" }).where(eq(contentDrafts.id, draft.id));
                  revalidatePath('/queue');
                }}>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow-sm transition-colors">
                    Post Now
                  </button>
                </form>

                <div className="flex-1" />

                <form action={async () => {
                  "use server";
                  await db.update(contentDrafts).set({ status: "REJECTED" }).where(eq(contentDrafts.id, draft.id));
                  revalidatePath('/queue');
                }}>
                  <button className="bg-white hover:bg-red-50 text-red-600 border border-red-200 font-medium py-2 px-4 rounded-md transition-colors">
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

"use client";

import { useState } from "react";

type Draft = {
  id: string;
  content: string;
  status: string;
  candidateTitle: string;
  sourceType: string;
};

const SYSTEM_USER_ID = "system";

export default function QueueClient({ initialDrafts }: { initialDrafts: Draft[] }) {
  const [drafts, setDrafts] = useState<Draft[]>(initialDrafts);
  const [loading, setLoading] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Record<string, { type: "success" | "error"; text: string }>>({});

  function setMsg(id: string, type: "success" | "error", text: string) {
    setMessages(prev => ({ ...prev, [id]: { type, text } }));
    setTimeout(() => setMessages(prev => { const n = { ...prev }; delete n[id]; return n; }), 5000);
  }

  async function handleApprove(draftId: string) {
    setLoading(prev => ({ ...prev, [draftId]: "approving" }));
    try {
      // 1. Approve the draft (HUMAN_REVIEW → APPROVED)
      const approveRes = await fetch(`/api/content/${draftId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: SYSTEM_USER_ID }),
      });
      if (!approveRes.ok) throw new Error((await approveRes.json()).error || "Approve failed");
      setMsg(draftId, "success", "✓ Approved and ready to publish");
      setDrafts(prev => prev.filter(d => d.id !== draftId));
    } catch (e: any) {
      setMsg(draftId, "error", e.message);
    } finally {
      setLoading(prev => { const n = { ...prev }; delete n[draftId]; return n; });
    }
  }

  async function handleSchedule(draftId: string) {
    setLoading(prev => ({ ...prev, [draftId]: "scheduling" }));
    try {
      // 1. Approve first
      const approveRes = await fetch(`/api/content/${draftId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: SYSTEM_USER_ID }),
      });
      if (!approveRes.ok) throw new Error((await approveRes.json()).error || "Approve failed");

      // 2. Schedule for 9 AM tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      const schedRes = await fetch(`/api/content/${draftId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: SYSTEM_USER_ID, scheduledFor: tomorrow.toISOString() }),
      });
      if (!schedRes.ok) throw new Error((await schedRes.json()).error || "Schedule failed");

      setMsg(draftId, "success", `✓ Scheduled for tomorrow 9:00 AM`);
      setDrafts(prev => prev.filter(d => d.id !== draftId));
    } catch (e: any) {
      setMsg(draftId, "error", e.message);
    } finally {
      setLoading(prev => { const n = { ...prev }; delete n[draftId]; return n; });
    }
  }

  async function handlePostNow(draftId: string) {
    setLoading(prev => ({ ...prev, [draftId]: "posting" }));
    try {
      // 1. Approve first (HUMAN_REVIEW → APPROVED)
      const approveRes = await fetch(`/api/content/${draftId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: SYSTEM_USER_ID }),
      });
      if (!approveRes.ok) throw new Error((await approveRes.json()).error || "Approve failed");

      // 2. Publish immediately (APPROVED → PUBLISHING → PUBLISHED)
      const publishRes = await fetch("/api/content/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId, userId: SYSTEM_USER_ID }),
      });
      const publishData = await publishRes.json();
      if (!publishRes.ok) throw new Error(publishData.error || "Publish failed");

      setMsg(draftId, "success", `✓ Published to LinkedIn! ${publishData.linkedInPostUrl || ""}`);
      setDrafts(prev => prev.filter(d => d.id !== draftId));
    } catch (e: any) {
      setMsg(draftId, "error", `LinkedIn Error: ${e.message}`);
    } finally {
      setLoading(prev => { const n = { ...prev }; delete n[draftId]; return n; });
    }
  }

  async function handleReject(draftId: string) {
    setLoading(prev => ({ ...prev, [draftId]: "rejecting" }));
    try {
      const res = await fetch(`/api/content/${draftId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: SYSTEM_USER_ID }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Reject failed");
      setMsg(draftId, "success", "✓ Draft rejected");
      setDrafts(prev => prev.filter(d => d.id !== draftId));
    } catch (e: any) {
      setMsg(draftId, "error", e.message);
    } finally {
      setLoading(prev => { const n = { ...prev }; delete n[draftId]; return n; });
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {drafts.length === 0 ? (
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-2xl p-8 md:p-12 text-center rounded-3xl border border-zinc-200 dark:border-white/10 shadow-xl">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">You&apos;re all caught up!</h2>
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
                <h2 className="font-bold text-zinc-900 dark:text-white text-base md:text-lg">{draft.candidateTitle}</h2>
              </div>
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/20 px-3 py-1.5 rounded-full border border-amber-500/20 dark:border-amber-500/30 shadow-sm whitespace-nowrap">
                AWAITING APPROVAL
              </span>
            </div>

            <div className="p-6 md:p-8">
              <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300 font-medium whitespace-pre-wrap leading-relaxed">
                {draft.content}
              </div>
            </div>

            {/* Feedback message */}
            {messages[draft.id] && (
              <div className={`mx-6 md:mx-8 mb-4 px-4 py-3 rounded-xl text-sm font-semibold ${
                messages[draft.id].type === "success"
                  ? "bg-lime-500/10 text-lime-700 dark:text-lime-300 border border-lime-500/20"
                  : "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20"
              }`}>
                {messages[draft.id].text}
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="bg-zinc-50/50 dark:bg-black/20 px-6 md:px-8 py-5 md:py-6 border-t border-zinc-200 dark:border-white/10 flex flex-wrap gap-3 md:gap-4 items-center">
              <button
                type="button"
                disabled={!!loading[draft.id]}
                onClick={() => handleApprove(draft.id)}
                aria-label="Approve draft to queue"
                className="bg-white dark:bg-white/10 hover:bg-zinc-100 dark:hover:bg-white/20 text-zinc-900 dark:text-white font-bold py-2 md:py-2.5 px-4 md:px-6 rounded-xl shadow-sm md:shadow-lg border border-zinc-200 dark:border-white/10 transition-all text-sm md:text-base disabled:opacity-50"
              >
                {loading[draft.id] === "approving" ? "Approving…" : "Approve to Queue"}
              </button>

              <button
                type="button"
                disabled={!!loading[draft.id]}
                onClick={() => handleSchedule(draft.id)}
                aria-label="Schedule draft for tomorrow morning"
                className="bg-lime-500 hover:bg-lime-600 dark:bg-lime-600 dark:hover:bg-lime-500 text-zinc-950 font-black py-2 md:py-2.5 px-4 md:px-6 rounded-xl shadow-md shadow-lime-500/20 transition-all text-sm md:text-base border-0 disabled:opacity-50"
              >
                {loading[draft.id] === "scheduling" ? "Scheduling…" : "Schedule"}
              </button>

              <button
                type="button"
                disabled={!!loading[draft.id]}
                onClick={() => handlePostNow(draft.id)}
                aria-label="Post draft to LinkedIn now"
                className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-500 text-zinc-950 font-bold py-2 md:py-2.5 px-4 md:px-6 rounded-xl shadow-md shadow-orange-500/30 transition-all text-sm md:text-base border-0 disabled:opacity-50"
              >
                {loading[draft.id] === "posting" ? "Posting to LinkedIn…" : "Post Now"}
              </button>

              <div className="flex-1 min-w-[1rem]" />

              <button
                type="button"
                disabled={!!loading[draft.id]}
                onClick={() => handleReject(draft.id)}
                aria-label="Reject draft"
                className="bg-transparent hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 font-bold border border-red-200 dark:border-red-500/30 py-2 md:py-2.5 px-4 md:px-6 rounded-xl transition-all text-sm md:text-base disabled:opacity-50"
              >
                {loading[draft.id] === "rejecting" ? "Rejecting…" : "Reject"}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

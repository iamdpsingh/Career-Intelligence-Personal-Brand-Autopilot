import Link from "next/link";
import { db } from "@/providers/db";
import { profiles, apiCredentials, repositories, users } from "@/providers/db/schema";
import { eq, count } from "drizzle-orm";
import { ProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let profile: any = null;
  let credentials: any[] = [];
  let trackedRepos: any[] = [];

  try {
    const user = await db.query.users.findFirst();
    if (user) {
      profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, user.id),
      });

      credentials = await db.select({
          id: apiCredentials.id,
          provider: apiCredentials.provider,
          type: apiCredentials.type,
          status: apiCredentials.status,
          lastUsedAt: apiCredentials.lastUsedAt,
          createdAt: apiCredentials.createdAt,
        })
        .from(apiCredentials)
        .where(eq(apiCredentials.userId, user.id));

      trackedRepos = await db.select().from(repositories).where(eq(repositories.userId, user.id));
    }
  } catch (_error) {
    console.warn("Database connection failed for settings page");
  }

  return (
    <div className="space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      <header>
        <h1 className="text-3xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 md:mt-3 text-base md:text-lg font-medium">
          Configure your profile, credentials, and tracked repositories.
        </p>
      </header>

      <div className="space-y-6 md:space-y-8">
        {/* Profile Section */}
        <section className="relative z-30 bg-white/60 dark:bg-white/5 backdrop-blur-2xl rounded-3xl border border-zinc-200 dark:border-white/10 shadow-xl overflow-visible">
          <div className="rounded-t-3xl px-6 md:px-8 py-5 md:py-6 border-b border-zinc-200 dark:border-white/10 bg-white/40 dark:bg-white/5">
            <h3 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white">Professional Profile</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
              Used by the Job Intelligence Engine to match opportunities
            </p>
          </div>
          <div className="p-6 md:p-8">
            <ProfileForm profile={profile} />
          </div>
        </section>

        {/* Credentials Section */}
        <section className="relative z-20 bg-white/60 dark:bg-white/5 backdrop-blur-2xl rounded-3xl border border-zinc-200 dark:border-white/10 shadow-xl overflow-visible">
          <div className="rounded-t-3xl px-6 md:px-8 py-5 md:py-6 border-b border-zinc-200 dark:border-white/10 bg-white/40 dark:bg-white/5">
            <h3 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white">API Credentials</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
              OAuth tokens for GitHub and LinkedIn. Tokens are never displayed.
            </p>
          </div>
          <div className="p-6 md:p-8">
            {credentials.length === 0 ? (
              <div className="space-y-4">
                <p className="text-zinc-500 dark:text-zinc-400 font-medium">
                  No API credentials configured yet. Connect LinkedIn to enable publishing.
                </p>
                <a
                  href="/api/auth/linkedin"
                  className="inline-flex items-center gap-2 bg-[#0A66C2] hover:bg-[#004182] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg"
                >
                  💼 Connect LinkedIn
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {credentials.map((cred) => (
                    <div key={cred.id} className="flex items-center justify-between p-5 bg-zinc-50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors rounded-2xl border border-zinc-200 dark:border-white/10">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-white/10 flex items-center justify-center text-xl shadow-inner">
                          {cred.provider === "github" ? "🐙" : cred.provider === "linkedin" ? "💼" : "🔑"}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 dark:text-white capitalize text-lg">{cred.provider}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">{cred.type} • Added {cred.createdAt ? new Date(cred.createdAt).toLocaleDateString() : "unknown"}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full shadow-sm ${
                          cred.status === "active" ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 dark:border-emerald-500/30"
                          : cred.status === "expired" ? "bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 dark:border-amber-500/30"
                          : "bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/20 dark:border-red-500/30"
                        }`}>
                        {cred.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Re-connect if token needs refresh */}
                {!credentials.some(c => c.provider === 'linkedin') && (
                  <a
                    href="/api/auth/linkedin"
                    className="inline-flex items-center gap-2 bg-[#0A66C2] hover:bg-[#004182] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg"
                  >
                    💼 Connect LinkedIn
                  </a>
                )}
                {credentials.some(c => c.provider === 'linkedin') && (
                  <a
                    href="/api/auth/linkedin"
                    className="inline-flex items-center gap-2 bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/20 text-zinc-700 dark:text-white font-bold py-2.5 px-5 rounded-xl transition-all text-sm border border-zinc-200 dark:border-white/10"
                  >
                    🔄 Re-connect LinkedIn
                  </a>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Tracked Repositories */}
        <section className="relative z-10 bg-white/60 dark:bg-white/5 backdrop-blur-2xl rounded-3xl border border-zinc-200 dark:border-white/10 shadow-xl overflow-visible">
          <div className="rounded-t-3xl px-6 md:px-8 py-5 md:py-6 border-b border-zinc-200 dark:border-white/10 bg-white/40 dark:bg-white/5">
            <h3 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white">Tracked Repositories</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
              Repositories monitored by the GitHub Intelligence Engine
            </p>
          </div>
          <div className="p-6 md:p-8">
            {trackedRepos.length === 0 ? (
              <p className="text-zinc-500 dark:text-zinc-400 font-medium">
                No repositories tracked. Add your GitHub repos to start generating content.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trackedRepos.map((repo) => (
                  <div key={repo.id} className="flex flex-col p-5 bg-zinc-50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors rounded-2xl border border-zinc-200 dark:border-white/10">
                    <div className="flex justify-between items-start mb-3">
                      <p className="font-bold text-zinc-900 dark:text-white font-mono">{repo.name}</p>
                      {repo.language && (
                        <span className="text-xs font-bold bg-orange-500/10 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 px-2.5 py-1 rounded-full border border-orange-500/20 dark:border-orange-500/30">
                          {repo.language}
                        </span>
                      )}
                    </div>
                    {repo.description && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">{repo.description}</p>
                    )}
                    {repo.lastSyncAt && (
                      <p className="text-xs text-zinc-500 font-medium mt-4">
                        Last synced: {new Date(repo.lastSyncAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

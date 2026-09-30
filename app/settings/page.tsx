import Link from "next/link";
import { db } from "@/providers/db";
import { profiles, apiCredentials, repositories, users } from "@/providers/db/schema";
import { eq, count } from "drizzle-orm";

// ----------------------------------------------------------------------
// SETTINGS PAGE (Spec Point 31, 51)
// ----------------------------------------------------------------------
// WHY THIS EXISTS:
// This is where the user configures their profile (target roles, skills),
// manages API credentials (GitHub token, LinkedIn OAuth status), and
// controls which repositories are tracked.
//
// SECURITY NOTE (Spec Point 31):
// We NEVER display the actual access tokens on this page. We only show
// the provider name, status, and last-used date. The tokens stay in the
// database and are never sent to the browser.
// ----------------------------------------------------------------------

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let profile: any = null;
  let credentials: any[] = [];
  let trackedRepos: any[] = [];

  try {
    // Get first user (single-user V1)
    const user = await db.query.users.findFirst();
    if (user) {
      profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, user.id),
      });

      // Only fetch safe fields — NEVER send tokens to the browser (Rule 31)
      credentials = await db
        .select({
          id: apiCredentials.id,
          provider: apiCredentials.provider,
          type: apiCredentials.type,
          status: apiCredentials.status,
          lastUsedAt: apiCredentials.lastUsedAt,
          createdAt: apiCredentials.createdAt,
        })
        .from(apiCredentials)
        .where(eq(apiCredentials.userId, user.id));

      trackedRepos = await db
        .select()
        .from(repositories)
        .where(eq(repositories.userId, user.id));
    }
  } catch (_error) {
    console.warn("Database connection failed for settings page");
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <header className="mb-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-zinc-900">Settings</h2>
            <p className="text-zinc-500 mt-1">
              Configure your profile, credentials, and tracked repositories.
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-800 font-medium"
          >
            ← Back to Overview
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Section */}
        <section className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50">
            <h3 className="font-semibold text-zinc-900">Professional Profile</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Used by the Job Intelligence Engine to match opportunities
            </p>
          </div>

          <div className="p-6 space-y-4">
            {profile ? (
              <>
                <div>
                  <label className="text-sm font-medium text-zinc-700 block mb-1">
                    Target Roles
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(profile.targetRoles || []).map((role: string) => (
                      <span
                        key={role}
                        className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full"
                      >
                        {role}
                      </span>
                    ))}
                    {(!profile.targetRoles || profile.targetRoles.length === 0) && (
                      <span className="text-zinc-400 text-sm italic">Not configured</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-700 block mb-1">
                    Core Skills
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(profile.coreSkills || []).map((skill: string) => (
                      <span
                        key={skill}
                        className="bg-purple-50 text-purple-700 text-sm px-3 py-1 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                    {(!profile.coreSkills || profile.coreSkills.length === 0) && (
                      <span className="text-zinc-400 text-sm italic">Not configured</span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-zinc-500 text-sm">
                No profile configured. Create a user and set up your target roles and skills.
              </p>
            )}
          </div>
        </section>

        {/* Credentials Section */}
        <section className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50">
            <h3 className="font-semibold text-zinc-900">API Credentials</h3>
            <p className="text-xs text-zinc-500 mt-1">
              OAuth tokens for GitHub and LinkedIn. Tokens are never displayed.
            </p>
          </div>

          <div className="p-6">
            {credentials.length === 0 ? (
              <p className="text-zinc-500 text-sm">
                No API credentials configured. Connect GitHub and LinkedIn to enable the automation.
              </p>
            ) : (
              <div className="space-y-3">
                {credentials.map((cred) => (
                  <div
                    key={cred.id}
                    className="flex items-center justify-between p-4 bg-zinc-50 rounded-lg border border-zinc-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {cred.provider === "github" ? "🐙" : cred.provider === "linkedin" ? "💼" : "🔑"}
                      </span>
                      <div>
                        <p className="font-medium text-zinc-900 capitalize">{cred.provider}</p>
                        <p className="text-xs text-zinc-500">{cred.type} • Added {cred.createdAt ? new Date(cred.createdAt).toLocaleDateString() : "unknown"}</p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${
                        cred.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : cred.status === "expired"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {cred.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Tracked Repositories */}
        <section className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50">
            <h3 className="font-semibold text-zinc-900">Tracked Repositories</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Repositories monitored by the GitHub Intelligence Engine
            </p>
          </div>

          <div className="p-6">
            {trackedRepos.length === 0 ? (
              <p className="text-zinc-500 text-sm">
                No repositories tracked. Add your GitHub repos to start generating content.
              </p>
            ) : (
              <div className="space-y-2">
                {trackedRepos.map((repo) => (
                  <div
                    key={repo.id}
                    className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg border border-zinc-100"
                  >
                    <div>
                      <p className="font-medium text-zinc-900 font-mono text-sm">{repo.name}</p>
                      {repo.description && (
                        <p className="text-xs text-zinc-500 mt-0.5">{repo.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      {repo.language && (
                        <span className="text-xs bg-zinc-200 text-zinc-600 px-2 py-0.5 rounded">
                          {repo.language}
                        </span>
                      )}
                      {repo.lastSyncAt && (
                        <p className="text-xs text-zinc-400 mt-1">
                          Last synced: {new Date(repo.lastSyncAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
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

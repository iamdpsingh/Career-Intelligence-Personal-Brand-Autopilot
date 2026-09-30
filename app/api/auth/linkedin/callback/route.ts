import { NextResponse } from "next/server";
import { db } from "@/providers/db";
import { apiCredentials, users } from "@/providers/db/schema";
import { eq, and } from "drizzle-orm";

// LinkedIn OAuth Step 2: Exchange code for access token and store it
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const redirectUri = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/linkedin/callback`;

  if (error) {
    console.error("[LinkedIn OAuth] User denied access or error:", error);
    return NextResponse.redirect(new URL("/settings?error=linkedin_denied", request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/settings?error=no_code", request.url));
  }

  try {
    // Exchange authorization code for access token
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: process.env.LINKEDIN_CLIENT_ID || "",
        client_secret: process.env.LINKEDIN_CLIENT_SECRET || "",
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("[LinkedIn OAuth] Token exchange failed:", err);
      return NextResponse.redirect(new URL("/settings?error=token_exchange_failed", request.url));
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const expiresInSeconds = tokenData.expires_in || 5184000; // default 60 days
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    // Get the system user (single-user app)
    const user = await db.query.users.findFirst();
    if (!user) {
      return NextResponse.redirect(new URL("/settings?error=no_user", request.url));
    }

    // Upsert credential (delete old, insert new)
    await db.delete(apiCredentials).where(
      and(
        eq(apiCredentials.userId, user.id),
        eq(apiCredentials.provider, "linkedin")
      )
    );

    await db.insert(apiCredentials).values({
      userId: user.id,
      provider: "linkedin",
      type: "oauth2",
      accessToken,
      expiresAt,
      status: "active",
    });

    console.log(`[LinkedIn OAuth] Successfully stored LinkedIn token for user ${user.id}. Expires: ${expiresAt.toISOString()}`);
    return NextResponse.redirect(new URL("/settings?success=linkedin_connected", request.url));

  } catch (err) {
    console.error("[LinkedIn OAuth] Callback failed:", err);
    return NextResponse.redirect(new URL("/settings?error=callback_failed", request.url));
  }
}

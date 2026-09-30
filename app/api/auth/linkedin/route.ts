import { NextResponse } from "next/server";

// LinkedIn OAuth Step 1: Redirect user to LinkedIn authorization
export async function GET() {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/linkedin/callback`;

  if (!clientId) {
    return NextResponse.json({ error: "LINKEDIN_CLIENT_ID not configured" }, { status: 500 });
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "openid profile email w_member_social",
    state: "career-autopilot",
  });

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  return NextResponse.redirect(authUrl);
}

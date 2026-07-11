import { NextRequest, NextResponse } from "next/server";
import { createSession, SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/auth";
import { getAuthStore } from "@/lib/authStore";
import { exchangeGoogleCode, googleConfigured, OAUTH_STATE_COOKIE } from "@/lib/googleAuth";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

function failure(origin: string): NextResponse {
  return NextResponse.redirect(new URL("/login?error=google_failed", origin));
}

/**
 * Completes Google sign-in. Google accounts live under the internal id
 * `g_<sub>` (sub is Google's stable per-user identifier), which can never
 * collide with password usernames since those are capped at 20 characters.
 * Sessions, chat budgets, and progress sync all key off that id via the
 * existing session machinery; the stored profile carries email and a
 * friendly display name for the UI.
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  if (!googleConfigured()) return failure(origin);

  const withinRateLimit = await checkRateLimit(`gauth:${clientIp(req)}`, 10);
  if (!withinRateLimit) return failure(origin);

  const state = req.nextUrl.searchParams.get("state");
  const code = req.nextUrl.searchParams.get("code");
  const cookieState = req.cookies.get(OAUTH_STATE_COOKIE)?.value;
  if (!state || !code || !cookieState || state !== cookieState) {
    return failure(origin);
  }

  const identity = await exchangeGoogleCode(origin, code);
  if (!identity || !identity.emailVerified) return failure(origin);

  const accountId = `g_${identity.sub}`;
  const store = getAuthStore();
  const existing = await store.get(`user:${accountId}`);
  const displayName =
    identity.givenName?.trim() || identity.email.split("@")[0] || "google user";
  if (!existing) {
    await store.set(
      `user:${accountId}`,
      JSON.stringify({
        googleSub: identity.sub,
        email: identity.email,
        displayName,
        createdAt: new Date().toISOString(),
      })
    );
  }

  const sessionId = await createSession(accountId);
  const res = NextResponse.redirect(new URL("/", origin));
  res.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  res.cookies.delete(OAUTH_STATE_COOKIE);
  return res;
}

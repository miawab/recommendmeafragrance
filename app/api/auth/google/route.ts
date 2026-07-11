import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { buildGoogleAuthUrl, googleConfigured, OAUTH_STATE_COOKIE } from "@/lib/googleAuth";

export const runtime = "nodejs";

/** Kicks off the Google sign-in redirect, carrying a CSRF state token that
 * the callback verifies against a short-lived cookie. */
export async function GET(req: NextRequest) {
  if (!googleConfigured()) {
    return NextResponse.redirect(new URL("/login?error=google_unconfigured", req.nextUrl.origin));
  }
  const state = crypto.randomBytes(24).toString("hex");
  const res = NextResponse.redirect(buildGoogleAuthUrl(req.nextUrl.origin, state));
  res.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}

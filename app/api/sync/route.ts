import { NextRequest, NextResponse } from "next/server";
import { getSessionUsername, SESSION_COOKIE } from "@/lib/auth";
import { getAuthStore } from "@/lib/authStore";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Generous for years of daily play (shelf + streaks + per-day history), tight
// enough that the endpoint can't be used as free arbitrary blob storage.
const MAX_BLOB_BYTES = 256 * 1024;
const RATE_LIMIT_PER_MINUTE = 30;

function syncKey(username: string): string {
  return `sync:${username.toLowerCase()}`;
}

/** Returns the logged-in user's saved game progress (shelf, streaks, history). */
export async function GET(req: NextRequest) {
  const username = await getSessionUsername(req.cookies.get(SESSION_COOKIE)?.value);
  if (!username) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const raw = await getAuthStore().get(syncKey(username));
  if (!raw) return NextResponse.json({ data: null });
  try {
    return NextResponse.json({ data: JSON.parse(raw) });
  } catch {
    return NextResponse.json({ data: null });
  }
}

/** Saves the logged-in user's game progress so it follows them across devices. */
export async function PUT(req: NextRequest) {
  const username = await getSessionUsername(req.cookies.get(SESSION_COOKIE)?.value);
  if (!username) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const withinRateLimit = await checkRateLimit(`sync:${clientIp(req)}`, RATE_LIMIT_PER_MINUTE);
  if (!withinRateLimit) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let text: string;
  try {
    text = await req.text();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (text.length > MAX_BLOB_BYTES) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return NextResponse.json({ error: "invalid_shape" }, { status: 400 });
  }

  await getAuthStore().set(syncKey(username), text);
  return NextResponse.json({ ok: true });
}

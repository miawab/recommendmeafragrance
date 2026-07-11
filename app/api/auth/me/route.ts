import { NextRequest, NextResponse } from "next/server";
import { getSessionUsername, SESSION_COOKIE } from "@/lib/auth";
import { getAuthStore } from "@/lib/authStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
  const account = await getSessionUsername(sessionId);
  if (!account) return NextResponse.json({ username: null });

  // Google accounts are keyed g_<sub>; surface the stored display name
  // instead of the raw internal id.
  if (account.startsWith("g_")) {
    try {
      const raw = await getAuthStore().get(`user:${account}`);
      const profile = raw ? (JSON.parse(raw) as { displayName?: string }) : null;
      return NextResponse.json({ username: profile?.displayName ?? "google user" });
    } catch {
      return NextResponse.json({ username: "google user" });
    }
  }

  return NextResponse.json({ username: account });
}

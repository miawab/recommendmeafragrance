import { NextRequest, NextResponse } from "next/server";
import { getSessionUsername, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
  const username = await getSessionUsername(sessionId);
  return NextResponse.json({ username });
}

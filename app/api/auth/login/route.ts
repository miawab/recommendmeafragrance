import { NextRequest, NextResponse } from "next/server";
import { createSession, getUser, isValidPassword, isValidUsername, SESSION_COOKIE, SESSION_TTL_SECONDS, verifyPassword } from "@/lib/auth";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

interface LoginBody {
  username?: string;
  password?: string;
}

export async function POST(req: NextRequest) {
  const withinRateLimit = await checkRateLimit(`login:${clientIp(req)}`, 10);
  if (!withinRateLimit) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: LoginBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { username, password } = body;
  if (!isValidUsername(username) || !isValidPassword(password)) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const user = await getUser(username);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const sessionId = await createSession(user.username);
  const res = NextResponse.json({ username: user.username });
  res.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}

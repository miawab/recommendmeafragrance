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

  // Per-account attempt limit on top of the per-IP one above: a distributed
  // credential-stuffing attack rotates IPs, so the target username itself
  // needs a cap. 10 attempts per 5 minutes stays invisible to real users.
  const withinAccountLimit = await checkRateLimit(
    `login:user:${username.toLowerCase()}`,
    10,
    300
  );
  if (!withinAccountLimit) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
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

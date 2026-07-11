import { NextRequest, NextResponse } from "next/server";
import { createSession, createUser, getUser, isValidPassword, isValidUsername, SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/auth";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

interface SignupBody {
  username?: string;
  password?: string;
}

export async function POST(req: NextRequest) {
  const withinRateLimit = await checkRateLimit(`signup:${clientIp(req)}`, 5);
  if (!withinRateLimit) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: SignupBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { username, password } = body;
  if (!isValidUsername(username)) {
    return NextResponse.json(
      { error: "invalid_username", message: "Username must be 3-20 letters, numbers, or underscores." },
      { status: 400 }
    );
  }
  if (!isValidPassword(password)) {
    return NextResponse.json(
      { error: "invalid_password", message: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const existing = await getUser(username);
  if (existing) {
    return NextResponse.json({ error: "username_taken" }, { status: 409 });
  }

  await createUser(username, password);
  const sessionId = await createSession(username);

  const res = NextResponse.json({ username });
  res.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}

import crypto from "node:crypto";
import { getAuthStore } from "@/lib/authStore";

export const SESSION_COOKIE = "rmf_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

/** Sessions map an opaque random id to an account id (Google accounts are
 * keyed g_<sub>). Sign-in itself is Google-only; see lib/googleAuth.ts. */
export async function createSession(accountId: string): Promise<string> {
  const sessionId = crypto.randomBytes(32).toString("hex");
  await getAuthStore().set(`session:${sessionId}`, accountId, SESSION_TTL_SECONDS);
  return sessionId;
}

export async function getSessionUsername(sessionId: string | undefined): Promise<string | null> {
  if (!sessionId) return null;
  return getAuthStore().get(`session:${sessionId}`);
}

export async function destroySession(sessionId: string | undefined): Promise<void> {
  if (!sessionId) return;
  await getAuthStore().del(`session:${sessionId}`);
}

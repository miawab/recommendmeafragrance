import crypto from "node:crypto";
import { getAuthStore } from "@/lib/authStore";

const SCRYPT_KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  let hashBuffer: Buffer;
  let candidate: Buffer;
  try {
    hashBuffer = Buffer.from(hash, "hex");
    candidate = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  } catch {
    return false;
  }
  if (candidate.length !== hashBuffer.length) return false;
  return crypto.timingSafeEqual(candidate, hashBuffer);
}

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export function isValidUsername(u: unknown): u is string {
  return typeof u === "string" && USERNAME_RE.test(u);
}

export function isValidPassword(p: unknown): p is string {
  return typeof p === "string" && p.length >= 8 && p.length <= 200;
}

export const SESSION_COOKIE = "rmf_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

interface UserRecord {
  username: string;
  passwordHash: string;
  createdAt: string;
}

function userKey(username: string): string {
  return `user:${username.toLowerCase()}`;
}

export async function getUser(username: string): Promise<UserRecord | null> {
  const raw = await getAuthStore().get(userKey(username));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserRecord;
  } catch {
    return null;
  }
}

export async function createUser(username: string, password: string): Promise<UserRecord> {
  const record: UserRecord = {
    username,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  await getAuthStore().set(userKey(username), JSON.stringify(record));
  return record;
}

export async function createSession(username: string): Promise<string> {
  const sessionId = crypto.randomBytes(32).toString("hex");
  await getAuthStore().set(`session:${sessionId}`, username, SESSION_TTL_SECONDS);
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

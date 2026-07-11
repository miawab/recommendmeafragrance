import type { NextRequest } from "next/server";
import { getKV } from "@/lib/redis";

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** Fixed-window rate limit keyed by an arbitrary bucket string (e.g. `ip` or
 * `login:${ip}`). Returns true when the request is within limit. */
export async function checkRateLimit(
  bucketKey: string,
  limit: number,
  windowSeconds = 60
): Promise<boolean> {
  const kv = getKV();
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = `rl:${bucketKey}:${bucket}`;
  const count = await kv.incrby(key, 1);
  if (count === 1) await kv.expire(key, windowSeconds + 5);
  return count <= limit;
}

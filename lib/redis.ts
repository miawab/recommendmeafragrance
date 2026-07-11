import { Redis } from "@upstash/redis";

interface KVLike {
  get(key: string): Promise<number | null>;
  incrby(key: string, amount: number): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  ttl(key: string): Promise<number>;
}

/** In-memory fallback so local dev works before Upstash credentials exist.
 * Not shared across processes or persistent across restarts, dev-only. */
class MemoryKV implements KVLike {
  private store = new Map<string, { value: number; expiresAt: number | null }>();

  private read(key: string) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry;
  }

  async get(key: string) {
    return this.read(key)?.value ?? null;
  }

  async incrby(key: string, amount: number) {
    const entry = this.read(key);
    const next = (entry?.value ?? 0) + amount;
    this.store.set(key, { value: next, expiresAt: entry?.expiresAt ?? null });
    return next;
  }

  async expire(key: string, seconds: number) {
    const entry = this.read(key);
    if (!entry) return 0;
    entry.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  async ttl(key: string) {
    const entry = this.read(key);
    if (!entry?.expiresAt) return -1;
    return Math.max(0, Math.round((entry.expiresAt - Date.now()) / 1000));
  }
}

/** Raw Upstash Redis client for storing JSON blobs (e.g. synced offers), distinct
 * from the counter-only KVLike interface used for token/message budgets. Returns
 * null when Upstash isn't configured, callers should fall back to a static file. */
export function getRawRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return Redis.fromEnv();
}

let client: KVLike | null = null;
let warned = false;

export function getKV(): KVLike {
  if (client) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    client = Redis.fromEnv() as unknown as KVLike;
  } else {
    if (!warned) {
      // eslint-disable-next-line no-console
      console.warn(
        "[rmf] UPSTASH_REDIS_REST_URL/TOKEN not set, using an in-memory token counter for local dev only."
      );
      warned = true;
    }
    client = new MemoryKV();
  }
  return client;
}

import { getRawRedis } from "@/lib/redis";

interface StringKV {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, exSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
}

/** In-memory fallback so local dev works before Upstash credentials exist.
 * Not shared across processes or persistent across restarts, dev-only. */
class MemoryStringKV implements StringKV {
  private store = new Map<string, { value: string; expiresAt: number | null }>();

  async get(key: string) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, exSeconds?: number) {
    this.store.set(key, { value, expiresAt: exSeconds ? Date.now() + exSeconds * 1000 : null });
  }

  async del(key: string) {
    this.store.delete(key);
  }
}

let memoryFallback: MemoryStringKV | null = null;

/** String-valued KV for user records and sessions, backed by Upstash Redis when
 * configured, an in-memory Map otherwise. Distinct from getKV() in lib/redis.ts,
 * which is a numeric counter store used for rate limits and token budgets. */
export function getAuthStore(): StringKV {
  const redis = getRawRedis();
  if (redis) {
    return {
      async get(key) {
        const v = await redis.get<string>(key);
        return v ?? null;
      },
      async set(key, value, exSeconds) {
        if (exSeconds) await redis.set(key, value, { ex: exSeconds });
        else await redis.set(key, value);
      },
      async del(key) {
        await redis.del(key);
      },
    };
  }
  if (!memoryFallback) memoryFallback = new MemoryStringKV();
  return memoryFallback;
}

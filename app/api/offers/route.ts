import { NextResponse } from "next/server";
import { getRawRedis } from "@/lib/redis";
import { getOffers } from "@/lib/serverCatalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OFFERS_REDIS_KEY = "offers:data";

/** Serves the static build-time seed overlaid with the daily cron's fresh
 * Redis data. The seed guarantees every catalog entry keeps a working link
 * even when CJ's live pagination drops a few rows between syncs; fresh
 * prices/stock win wherever the cron found the product. */
export async function GET() {
  const base: Record<string, unknown> = { ...getOffers() };
  const redis = getRawRedis();
  if (redis) {
    const raw = await redis.get<string | Record<string, unknown>>(OFFERS_REDIS_KEY);
    if (raw) {
      const fresh = (typeof raw === "string" ? JSON.parse(raw) : raw) as Record<string, unknown>;
      Object.assign(base, fresh);
    }
  }
  return NextResponse.json(base, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}

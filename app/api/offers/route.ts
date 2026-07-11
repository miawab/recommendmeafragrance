import { NextResponse } from "next/server";
import { getRawRedis } from "@/lib/redis";
import { getOffers } from "@/lib/serverCatalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OFFERS_REDIS_KEY = "offers:data";

/** Serves the freshest offers map: Redis (updated by the daily cron) when
 * available, otherwise the static build-time seed from /public/data/offers.json. */
export async function GET() {
  const redis = getRawRedis();
  if (redis) {
    const raw = await redis.get<string | Record<string, unknown>>(OFFERS_REDIS_KEY);
    if (raw) {
      const data = typeof raw === "string" ? JSON.parse(raw) : raw;
      return NextResponse.json(data, {
        headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
      });
    }
  }
  return NextResponse.json(getOffers(), {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}

import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { buildOffersFromFeed, fetchCjAdvertiserProducts } from "@/lib/feedSync";
import type { MatchedOffer } from "@/lib/offerMatching";
import { getRawRedis } from "@/lib/redis";
import { getFullCatalog } from "@/lib/serverCatalog";

export const runtime = "nodejs";

const OFFERS_REDIS_KEY = "offers:data";
const OVERRIDES_PATH = path.join(process.cwd(), "data-pipeline", "offer_overrides.json");

function loadOverrides(): Record<string, Partial<MatchedOffer>> {
  try {
    return JSON.parse(fs.readFileSync(OVERRIDES_PATH, "utf-8"));
  } catch {
    return {};
  }
}

/**
 * Daily Vercel Cron target. Queries CJ's Product Feed GraphQL API for each
 * configured advertiser, matches products against the catalog, and persists
 * the result. Vercel functions have an ephemeral filesystem, so instead of
 * writing back to /public we store the offers blob in Upstash Redis (already
 * a project dependency for chat token metering) under OFFERS_REDIS_KEY.
 * /api/offers reads from there first, falling back to the static
 * /public/data/offers.json seed when Redis has nothing yet.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const apiToken = process.env.CJ_API_TOKEN;
  const companyId = process.env.CJ_COMPANY_ID;
  const pid = process.env.CJ_PID;
  const advertiserIds = (process.env.CJ_ADVERTISER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (!apiToken || !companyId || !pid || advertiserIds.length === 0) {
    return NextResponse.json(
      {
        ok: true,
        message:
          "CJ_API_TOKEN/CJ_COMPANY_ID/CJ_PID/CJ_ADVERTISER_IDS not fully configured yet, nothing to sync.",
      },
      { status: 200 }
    );
  }

  const catalog = getFullCatalog();
  const overrides = loadOverrides();
  let combinedOffers: Record<string, MatchedOffer> = {};
  const errors: string[] = [];

  for (const advertiserId of advertiserIds) {
    try {
      const feed = await fetchCjAdvertiserProducts(advertiserId, {
        apiToken,
        companyId,
        pid,
      });
      const offers = buildOffersFromFeed(catalog, feed);
      combinedOffers = { ...combinedOffers, ...offers };
    } catch (err) {
      errors.push(`advertiser ${advertiserId}: ${err instanceof Error ? err.message : "fetch failed"}`);
    }
  }

  for (const [id, override] of Object.entries(overrides)) {
    combinedOffers[id] = { ...combinedOffers[id], ...override } as MatchedOffer;
  }

  const redis = getRawRedis();
  if (redis) {
    await redis.set(OFFERS_REDIS_KEY, JSON.stringify(combinedOffers));
  }

  const famous = catalog.filter((p) => p.tier === "famous");
  const matchedFamous = famous.filter((p) => combinedOffers[p.id]).length;

  return NextResponse.json({
    ok: true,
    persisted: !!redis,
    totalOffers: Object.keys(combinedOffers).length,
    famousMatchRate:
      famous.length > 0 ? Math.round((matchedFamous / famous.length) * 100) : 0,
    errors,
  });
}

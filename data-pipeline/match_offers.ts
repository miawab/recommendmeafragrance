/**
 * Matches a CJ merchant product feed against the catalog and writes
 * /public/data/offers.json. Also usable locally against a sample feed CSV.
 *
 * Usage:
 *   pnpm tsx data-pipeline/match_offers.ts --feed-json data-pipeline/raw/fragranceshop_feed.json
 *   pnpm tsx data-pipeline/match_offers.ts --feed data-pipeline/sample_feed.csv
 *   pnpm tsx data-pipeline/match_offers.ts --stub   (placeholder offers, no real feed yet)
 */
import fs from "node:fs";
import path from "node:path";
import { buildOffersFromFeed, csvRowsToFeedRows, generateStubOffers, parseCsv } from "../lib/feedSync";
import type { MatchedOffer } from "../lib/offerMatching";
import type { PerfumeEntry } from "../lib/types";

const ROOT = path.join(__dirname, "..");
const CATALOG_PATH = path.join(ROOT, "public", "data", "catalog-full.json");
const OFFERS_PATH = path.join(ROOT, "public", "data", "offers.json");
const OVERRIDES_PATH = path.join(ROOT, "data-pipeline", "offer_overrides.json");
const UNMATCHED_REPORT_PATH = path.join(ROOT, "data-pipeline", "unmatched_offers.txt");

function parseArgs() {
  const args = process.argv.slice(2);
  const feedIdx = args.indexOf("--feed");
  const feedJsonIdx = args.indexOf("--feed-json");
  return {
    feedPath: feedIdx >= 0 ? args[feedIdx + 1] : null,
    feedJsonPath: feedJsonIdx >= 0 ? args[feedJsonIdx + 1] : null,
    stub: args.includes("--stub"),
  };
}

function loadOverrides(): Record<string, Partial<MatchedOffer>> {
  if (!fs.existsSync(OVERRIDES_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(OVERRIDES_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function main() {
  const { feedPath, feedJsonPath, stub } = parseArgs();
  if (!feedPath && !feedJsonPath && !stub) {
    console.error("Usage: match_offers.ts --feed-json <path.json> | --feed <path.csv> | --stub");
    process.exit(1);
  }

  const catalog: PerfumeEntry[] = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf-8"));
  const famous = catalog.filter((p) => p.tier === "famous");
  const overrides = loadOverrides();

  let offers: Record<string, MatchedOffer>;
  if (stub) {
    offers = { ...generateStubOffers(famous) };
    for (const [id, override] of Object.entries(overrides)) {
      offers[id] = { ...offers[id], ...override } as MatchedOffer;
    }
    console.log(`Generated stub offers for ${famous.length} famous-tier entries.`);
  } else {
    // --feed-json takes the FeedRow[] dump from fetch_cj_feed.ts as-is.
    const feed = feedJsonPath
      ? (JSON.parse(fs.readFileSync(feedJsonPath, "utf-8")) as ReturnType<typeof csvRowsToFeedRows>)
      : csvRowsToFeedRows(parseCsv(fs.readFileSync(feedPath as string, "utf-8")));
    offers = buildOffersFromFeed(catalog, feed, overrides);

    const matchedFamous = famous.filter((p) => offers[p.id]).length;
    const rate = famous.length > 0 ? Math.round((matchedFamous / famous.length) * 100) : 0;
    console.log(
      `Matched ${Object.keys(offers).length} of ${catalog.length} catalog entries (${matchedFamous}/${famous.length} famous tier, ${rate}% match rate).`
    );

    const unmatched = famous.filter((p) => !offers[p.id]).map((p) => `${p.brand} | ${p.name} (${p.id})`);
    fs.writeFileSync(UNMATCHED_REPORT_PATH, unmatched.join("\n"), "utf-8");
    console.log(`Wrote ${unmatched.length} unmatched famous-tier entries to ${UNMATCHED_REPORT_PATH}`);
  }

  fs.writeFileSync(OFFERS_PATH, JSON.stringify(offers), "utf-8");
  console.log(`Wrote ${Object.keys(offers).length} offers to ${OFFERS_PATH}`);
}

main();

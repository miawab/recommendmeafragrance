/**
 * Downloads the full FragranceShop.com product feed from CJ's GraphQL API to
 * data-pipeline/raw/fragranceshop_feed.json (FeedRow[]), which build_catalog.py
 * uses to anchor the catalog to products we can actually link to, and
 * build_offers_from_feed.ts uses to seed public/data/offers.json.
 *
 * Run: npx tsx data-pipeline/fetch_cj_feed.ts   (needs CJ_* vars in .env.local)
 */
import fs from "node:fs";
import path from "node:path";
import { fetchCjAdvertiserProducts } from "../lib/feedSync";

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}

async function main() {
  loadEnvLocal();
  const apiToken = process.env.CJ_API_TOKEN;
  const companyId = process.env.CJ_COMPANY_ID;
  const pid = process.env.CJ_PID;
  const advertiserIds = (process.env.CJ_ADVERTISER_IDS ?? "").split(",").filter(Boolean);
  if (!apiToken || !companyId || !pid || advertiserIds.length === 0) {
    throw new Error("CJ_API_TOKEN / CJ_COMPANY_ID / CJ_PID / CJ_ADVERTISER_IDS must be set");
  }

  const all = [];
  for (const advertiserId of advertiserIds) {
    const rows = await fetchCjAdvertiserProducts(advertiserId.trim(), { apiToken, companyId, pid });
    console.log(`advertiser ${advertiserId}: ${rows.length} products`);
    all.push(...rows);
  }

  const outPath = path.join(__dirname, "raw", "fragranceshop_feed.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(all, null, 1), "utf-8");
  console.log(`wrote ${all.length} rows to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

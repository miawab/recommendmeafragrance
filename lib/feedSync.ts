import { matchOffers, type FeedRow, type MatchedOffer, type MatchTarget } from "./offerMatching";
import type { PerfumeEntry } from "./types";

/** Minimal CSV parser: handles quoted fields containing commas, no embedded newlines. */
export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const parseLine = (line: string): string[] => {
    const cells: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        cells.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    cells.push(cur);
    return cells.map((c) => c.trim());
  };
  const headers = parseLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = parseLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = cells[i] ?? ""));
    return row;
  });
}

export function csvRowsToFeedRows(rows: Record<string, string>[]): FeedRow[] {
  return rows.map((r) => ({
    brand: r.brand ?? "",
    name: r.name ?? "",
    price: Number(r.price ?? 0),
    currency: r.currency || "USD",
    merchant: r.merchant || "Unknown",
    deepLink: r.deepLink || r.link || "",
    image: r.image || undefined,
    volumeMl: r.volumeMl ? Number(r.volumeMl) : undefined,
    inStock: r.inStock ? r.inStock.toLowerCase() === "true" : true,
  }));
}

const CJ_GRAPHQL_ENDPOINT = "https://ads.api.cj.com/query";
const CJ_PAGE_LIMIT = 1000;
const CJ_MAX_RECORDS = 10000;

interface CjProductNode {
  advertiserId: string;
  advertiserName?: string;
  title: string;
  price?: { amount: string; currency: string } | null;
  brand?: string | null;
  imageLink?: string | null;
  availability?: string | null;
  linkCode?: { clickUrl: string } | null;
}

interface CjProductsResponse {
  data?: {
    products?: {
      totalCount: number;
      resultList: CjProductNode[];
    };
  };
  errors?: { message: string }[];
}

const OZ_TO_ML = 29.57;
const OZ_RE = /(\d+(?:\.\d+)?)\s*oz\b/i;
const ML_RE = /(\d+(?:\.\d+)?)\s*ml\b/i;

function parseVolumeMl(title: string): number | undefined {
  const ml = title.match(ML_RE);
  if (ml) return Number(ml[1]);
  const oz = title.match(OZ_RE);
  if (oz) return Math.round(Number(oz[1]) * OZ_TO_ML);
  return undefined;
}

/** Feed titles usually lead with the brand ("Azha Black Ruby Perfume for
 * Women..."), but catalog names don't include the brand, so leaving it in
 * drags the token-set similarity below the match threshold. */
function stripBrandPrefix(title: string, brand: string): string {
  if (brand && title.toLowerCase().startsWith(brand.toLowerCase() + " ")) {
    return title.slice(brand.length).trim();
  }
  return title;
}

/** Fetches every product for one CJ advertiser via the Product Feed GraphQL
 * API (verified live against advertiser 7287203): partnerIds scopes the
 * search server-side, and brand/imageLink/availability live on the Shopping
 * subtype, hence the inline fragment. Paginates with offset/limit up to the
 * API's 10,000-record cap. */
export async function fetchCjAdvertiserProducts(
  advertiserId: string,
  opts: { apiToken: string; companyId: string; pid: string }
): Promise<FeedRow[]> {
  const rows: FeedRow[] = [];
  let offset = 1;

  while (offset <= CJ_MAX_RECORDS) {
    const query = `{
      products(companyId: "${opts.companyId}", partnerIds: ["${advertiserId}"], offset: ${offset}, limit: ${CJ_PAGE_LIMIT}) {
        totalCount
        resultList {
          advertiserId
          advertiserName
          title
          price { amount currency }
          linkCode(pid: "${opts.pid}") { clickUrl }
          ... on Shopping {
            brand
            imageLink
            availability
          }
        }
      }
    }`;

    const res = await fetch(CJ_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${opts.apiToken}`,
      },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      const detail = (await res.text().catch(() => "")).slice(0, 300);
      throw new Error(`CJ API HTTP ${res.status} for advertiser ${advertiserId}: ${detail}`);
    }
    const json: CjProductsResponse = await res.json();
    if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("; "));

    const page = json.data?.products;
    if (!page) break;

    for (const p of page.resultList) {
      if (!p.linkCode?.clickUrl || !p.price) continue;
      const brand = p.brand ?? "";
      rows.push({
        brand,
        name: stripBrandPrefix(p.title, brand),
        price: Number(p.price.amount),
        currency: p.price.currency,
        merchant: (p.advertiserName || "Unknown").trim(),
        deepLink: p.linkCode.clickUrl,
        image: p.imageLink || undefined,
        volumeMl: parseVolumeMl(p.title),
        // Google-feed-style enum: in_stock / out_of_stock / preorder / backorder.
        inStock: p.availability ? p.availability.toLowerCase() === "in_stock" : true,
      });
    }

    if (page.resultList.length < CJ_PAGE_LIMIT || offset + CJ_PAGE_LIMIT > page.totalCount) break;
    offset += CJ_PAGE_LIMIT;
  }

  return rows;
}

const PRICE_TIER_STUB_PRICE: Record<number, number> = {
  1: 29.99,
  2: 69.99,
  3: 129.99,
  4: 219.99,
  5: 349.99,
};

export function generateStubOffers(famous: PerfumeEntry[]): Record<string, MatchedOffer> {
  const now = new Date().toISOString();
  const result: Record<string, MatchedOffer> = {};
  for (const p of famous) {
    const query = encodeURIComponent(`${p.brand} ${p.name}`);
    result[p.id] = {
      deepLink: `https://www.google.com/search?tbm=shop&q=${query}`,
      price: PRICE_TIER_STUB_PRICE[p.priceTier] ?? 79.99,
      currency: "USD",
      merchant: "Sample Merchant",
      matchedAt: now,
    };
  }
  return result;
}

export function buildOffersFromFeed(
  catalog: PerfumeEntry[],
  feed: FeedRow[],
  overrides: Record<string, Partial<MatchedOffer>> = {}
): Record<string, MatchedOffer> {
  const targets: MatchTarget[] = catalog.map((p) => ({ id: p.id, brand: p.brand, name: p.name }));
  const offers = matchOffers(targets, feed);
  for (const [id, override] of Object.entries(overrides)) {
    offers[id] = { ...offers[id], ...override } as MatchedOffer;
  }
  return offers;
}

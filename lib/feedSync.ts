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

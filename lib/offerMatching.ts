export interface FeedRow {
  brand: string;
  name: string;
  price: number;
  currency: string;
  merchant: string;
  deepLink: string;
  image?: string;
  volumeMl?: number;
  inStock: boolean;
}

export interface MatchTarget {
  id: string;
  brand: string;
  name: string;
}

export interface MatchedOffer {
  deepLink: string;
  price: number;
  currency: string;
  merchant: string;
  image?: string;
  matchedAt: string;
}

const NOISE_PATTERN =
  /\b(edt|edp|eau de toilette|eau de parfum|parfum|perfume|cologne|fragrance mist|for men|for women|for her|for him|for unisex|unisex|spray|splash|roll-?on|tester|gift set|travel size|(\d+\/\d+|\d+(\.\d+)?)\s?(ml|oz))\b/gi;

// "the" carries no signal and one-word names like "Dreamer" otherwise miss
// their catalog twin "The Dreamer" on token-set similarity.
const STOPWORDS = new Set(["the"]);

export function normalizeProductName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(NOISE_PATTERN, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w))
    .join(" ");
}

/** Token-set similarity (Dice coefficient over unique word sets), a lightweight
 * stand-in for a token-sort ratio: order-independent, robust to reordered words. */
export function tokenSetRatio(a: string, b: string): number {
  const na = normalizeProductName(a);
  const nb = normalizeProductName(b);
  const setA = new Set(na.split(" ").filter(Boolean));
  const setB = new Set(nb.split(" ").filter(Boolean));
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const w of setA) if (setB.has(w)) intersection++;
  return (2 * intersection) / (setA.size + setB.size);
}

const BRAND_ALIASES: Record<string, string[]> = {
  lattafa: ["lattafa perfumes"],
  "al haramain": ["al haramain perfumes"],
  ysl: ["yves saint laurent"],
  ck: ["calvin klein"],
  "d&g": ["dolce gabbana", "dolce and gabbana"],
};

/** Squash to bare alphanumerics so punctuation and spacing differences can't
 * break brand comparison ("Dolce & Gabbana" vs "Dolce Gabbana"). */
function squashBrand(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function brandMatches(catalogBrand: string, feedBrand: string): boolean {
  const a = squashBrand(catalogBrand);
  const b = squashBrand(feedBrand);
  if (!a || !b) return true; // missing brand: fall through to name similarity
  if (a === b || a.includes(b) || b.includes(a)) return true;
  const aliases = BRAND_ALIASES[catalogBrand.toLowerCase().trim()] ?? [];
  return aliases.some((alias) => squashBrand(alias) === b || b.includes(squashBrand(alias)));
}

const MIN_VOLUME_ML = 50;
const NAME_MATCH_THRESHOLD = 0.85;

/** Matches feed rows against catalog entries by brand + fuzzy name, preferring
 * full-size, in-stock, lowest-priced offers among ties. */
export function matchOffers(
  targets: MatchTarget[],
  feed: FeedRow[]
): Record<string, MatchedOffer> {
  const now = new Date().toISOString();
  const result: Record<string, MatchedOffer> = {};

  for (const target of targets) {
    const candidates = feed.filter(
      (row) =>
        brandMatches(target.brand, row.brand) &&
        tokenSetRatio(target.name, row.name) >= NAME_MATCH_THRESHOLD
    );
    if (candidates.length === 0) continue;

    const preferred = candidates
      .slice()
      .sort((a, b) => {
        const aFullSize = (a.volumeMl ?? MIN_VOLUME_ML) >= MIN_VOLUME_ML ? 0 : 1;
        const bFullSize = (b.volumeMl ?? MIN_VOLUME_ML) >= MIN_VOLUME_ML ? 0 : 1;
        if (aFullSize !== bFullSize) return aFullSize - bFullSize;
        const aStock = a.inStock ? 0 : 1;
        const bStock = b.inStock ? 0 : 1;
        if (aStock !== bStock) return aStock - bStock;
        return a.price - b.price;
      })[0];

    result[target.id] = {
      deepLink: preferred.deepLink,
      price: preferred.price,
      currency: preferred.currency,
      merchant: preferred.merchant,
      image: preferred.image,
      matchedAt: now,
    };
  }

  return result;
}

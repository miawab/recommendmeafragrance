export type Tier = "famous" | "deep";
export type Gender = "women" | "men" | "unisex";
export type BrandGroup = "arab-house" | "mass-market" | "designer" | "niche";

export interface NotesPyramid {
  top: string[];
  heart: string[];
  base: string[];
}

export interface PerfumeEntry {
  id: string;
  name: string;
  brand: string;
  year: number | null;
  gender: Gender;
  concentration: string;
  priceTier: number;
  brandGroup: BrandGroup;
  tier: Tier;
  fameScore: number;
  notes: NotesPyramid;
  accords: string[];
  seasons: string[];
  occasions: string[];
  vibe: string[];
  funFact: string;
}

export interface NoteEntry {
  id: string;
  label: string;
  count: number;
}

export interface Offer {
  deepLink: string;
  price: number;
  currency: string;
  merchant: string;
  image?: string;
  matchedAt: string;
}

export type OffersMap = Record<string, Offer>;

export type Surface =
  | "scentle"
  | "detective"
  | "bab"
  | "hol"
  | "roulette"
  | "blind"
  | "shelf"
  | "chat"
  | "detail";

import type { PerfumeEntry } from "./types";

export interface RouletteDials {
  season: string; // "any" or a season tag
  occasion: string; // "any" or an occasion tag
  minPrice: number;
  maxPrice: number;
  chaos: number; // 0-100, 0 = famous only, 100 = deep cuts allowed
}

export function filterCandidates(catalog: PerfumeEntry[], dials: RouletteDials): PerfumeEntry[] {
  return catalog.filter((p) => {
    if (dials.season !== "any" && !p.seasons.includes(dials.season)) return false;
    if (dials.occasion !== "any" && !p.occasions.includes(dials.occasion)) return false;
    if (p.priceTier < dials.minPrice || p.priceTier > dials.maxPrice) return false;
    if (dials.chaos <= 0 && p.tier !== "famous") return false;
    return true;
  });
}

function weightFor(p: PerfumeEntry, chaos: number): number {
  const t = Math.min(Math.max(chaos, 0), 100) / 100;
  const w = p.fameScore * (1 - t) + (1 - p.fameScore) * t;
  return Math.max(w, 0.001);
}

/** Weighted random pick, deterministic given the same rng sequence. */
export function pickWeighted(
  pool: PerfumeEntry[],
  chaos: number,
  rng: () => number = Math.random
): PerfumeEntry | undefined {
  if (pool.length === 0) return undefined;
  const weights = pool.map((p) => weightFor(p, chaos));
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

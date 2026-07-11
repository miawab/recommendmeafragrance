import type { PerfumeEntry } from "./types";

export type HigherLowerAttribute = "year" | "price";
export type HigherLowerDifficulty = "easy" | "hard";

// Easy leans heavily on famous bottles and only pairs them up when the gap is
// obvious enough to guess by feel; hard draws far more from the deep catalog
// and accepts any non-tied gap, so close calls between niche releases happen.
const FAMOUS_BIAS: Record<HigherLowerDifficulty, number> = { easy: 0.85, hard: 0.3 };
const MIN_GAP: Record<HigherLowerDifficulty, Record<HigherLowerAttribute, number>> = {
  easy: { year: 6, price: 2 },
  hard: { year: 1, price: 1 },
};

export function attributeValue(p: PerfumeEntry, attribute: HigherLowerAttribute): number | null {
  return attribute === "year" ? p.year : p.priceTier;
}

/** Picks one bottle, favoring the famous tier more heavily on easy than hard. */
export function drawBottle(
  famousPool: PerfumeEntry[],
  fullPool: PerfumeEntry[],
  difficulty: HigherLowerDifficulty = "easy",
  rng: () => number = Math.random
): PerfumeEntry {
  const pool = rng() < FAMOUS_BIAS[difficulty] && famousPool.length > 0 ? famousPool : fullPool;
  return pool[Math.floor(rng() * pool.length)];
}

/** Draws two distinct bottles whose gap on the given attribute clears the
 * difficulty's minimum, so easy rounds are guessable at a glance and hard
 * rounds can come down to a single year or price tier. */
export function drawPair(
  famousPool: PerfumeEntry[],
  fullPool: PerfumeEntry[],
  attribute: HigherLowerAttribute,
  difficulty: HigherLowerDifficulty = "easy",
  rng: () => number = Math.random,
  maxAttempts = 50
): [PerfumeEntry, PerfumeEntry] {
  const minGap = MIN_GAP[difficulty][attribute];
  for (let i = 0; i < maxAttempts; i++) {
    const a = drawBottle(famousPool, fullPool, difficulty, rng);
    const b = drawBottle(famousPool, fullPool, difficulty, rng);
    if (a.id === b.id) continue;
    const va = attributeValue(a, attribute);
    const vb = attributeValue(b, attribute);
    if (va == null || vb == null) continue;
    if (Math.abs(va - vb) < minGap) continue;
    return [a, b];
  }
  throw new Error("Could not draw a non-tied pair, catalog may be too small");
}

/** Returns "a" or "b" for whichever has the lower value (released first / cheaper is not
 * the winner here; "higher" wins: later year is NOT correct for "released first" question,
 * callers decide question framing and pass the right comparison direction). */
export function higherSide(
  a: PerfumeEntry,
  b: PerfumeEntry,
  attribute: HigherLowerAttribute
): "a" | "b" {
  const va = attributeValue(a, attribute) ?? -Infinity;
  const vb = attributeValue(b, attribute) ?? -Infinity;
  return va >= vb ? "a" : "b";
}

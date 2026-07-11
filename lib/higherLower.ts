import type { PerfumeEntry } from "./types";

export type HigherLowerAttribute = "year" | "price";

export function attributeValue(p: PerfumeEntry, attribute: HigherLowerAttribute): number | null {
  return attribute === "year" ? p.year : p.priceTier;
}

/** Picks one bottle, favoring the famous tier ~70% of the time. */
export function drawBottle(
  famousPool: PerfumeEntry[],
  fullPool: PerfumeEntry[],
  rng: () => number = Math.random
): PerfumeEntry {
  const pool = rng() < 0.7 && famousPool.length > 0 ? famousPool : fullPool;
  return pool[Math.floor(rng() * pool.length)];
}

/** Draws two distinct bottles that don't tie on the given attribute. */
export function drawPair(
  famousPool: PerfumeEntry[],
  fullPool: PerfumeEntry[],
  attribute: HigherLowerAttribute,
  rng: () => number = Math.random,
  maxAttempts = 50
): [PerfumeEntry, PerfumeEntry] {
  for (let i = 0; i < maxAttempts; i++) {
    const a = drawBottle(famousPool, fullPool, rng);
    const b = drawBottle(famousPool, fullPool, rng);
    if (a.id === b.id) continue;
    const va = attributeValue(a, attribute);
    const vb = attributeValue(b, attribute);
    if (va == null || vb == null) continue;
    if (va === vb) continue;
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

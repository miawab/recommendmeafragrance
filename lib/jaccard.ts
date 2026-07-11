import type { PerfumeEntry } from "./types";

export interface WeightedNoteSet {
  top: string[];
  heart: string[];
  base: string[];
}

const BASE_WEIGHT = 1.5;

/**
 * Weighted Jaccard over a perfume's note pyramid. Base notes count 1.5x since
 * they carry the most identity; top/heart count 1x. Weight is applied by
 * duplicating base-note membership in the underlying multiset comparison.
 */
export function weightedJaccard(a: WeightedNoteSet, b: WeightedNoteSet): number {
  const weight = (set: WeightedNoteSet) => {
    const m = new Map<string, number>();
    for (const n of set.top) m.set(n, (m.get(n) ?? 0) + 1);
    for (const n of set.heart) m.set(n, (m.get(n) ?? 0) + 1);
    for (const n of set.base) m.set(n, (m.get(n) ?? 0) + BASE_WEIGHT);
    return m;
  };
  const wa = weight(a);
  const wb = weight(b);
  const keys = new Set([...wa.keys(), ...wb.keys()]);
  let intersection = 0;
  let union = 0;
  for (const k of keys) {
    const va = wa.get(k) ?? 0;
    const vb = wb.get(k) ?? 0;
    intersection += Math.min(va, vb);
    union += Math.max(va, vb);
  }
  if (union === 0) return 0;
  return intersection / union;
}

export function perfumeNoteSet(p: Pick<PerfumeEntry, "notes">): WeightedNoteSet {
  return { top: p.notes.top, heart: p.notes.heart, base: p.notes.base };
}

export interface Match {
  perfume: PerfumeEntry;
  similarity: number;
}

export function findClosestMatches(
  target: WeightedNoteSet,
  catalog: PerfumeEntry[],
  count: number,
  excludeId?: string
): Match[] {
  const scored = catalog
    .filter((p) => p.id !== excludeId)
    .map((p) => ({ perfume: p, similarity: weightedJaccard(target, perfumeNoteSet(p)) }))
    .sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, count);
}

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

// Descriptors perfumers commonly bolt onto a base note ("madagascar-vanilla",
// "haitian-vetiver", "blood-orange"). With hundreds of notes in the catalog,
// treating these as their base note lets a pick like "vanilla" still match a
// perfume listed under a qualified variant, instead of only ever matching the
// exact string.
const NOTE_QUALIFIERS = new Set([
  "madagascar", "haitian", "turkish", "bulgarian", "damask", "african", "indian",
  "moroccan", "italian", "french", "sicilian", "calabrian", "egyptian", "somali",
  "mysore", "virginia", "atlas", "chinese", "japanese", "wild", "tunisian",
  "persian", "grasse", "spanish", "australian", "canadian", "tahitian", "ceylon",
  "siamese", "cambodian", "royal", "bourbon", "sri-lankan",
  "white", "black", "red", "green", "pink", "blood", "yellow", "golden", "blue",
  "purple", "fresh", "dried", "candied", "roasted", "toasted", "burnt",
]);

function buildNoteVocabulary(catalog: PerfumeEntry[]): Set<string> {
  const vocab = new Set<string>();
  for (const p of catalog) {
    for (const n of p.notes.top) vocab.add(n);
    for (const n of p.notes.heart) vocab.add(n);
    for (const n of p.notes.base) vocab.add(n);
  }
  return vocab;
}

/** Reduces a qualified note ("madagascar-vanilla") to its base note ("vanilla")
 * when that base note also exists in the vocabulary, so near-duplicates count
 * as the same note for matching purposes. Leaves unrelated notes untouched. */
function canonicalNote(id: string, vocabulary: Set<string>): string {
  const parts = id.split("-");
  if (parts.length > 1) {
    if (NOTE_QUALIFIERS.has(parts[0])) {
      const rest = parts.slice(1).join("-");
      if (vocabulary.has(rest)) return rest;
    }
    if (NOTE_QUALIFIERS.has(parts[parts.length - 1])) {
      const rest = parts.slice(0, -1).join("-");
      if (vocabulary.has(rest)) return rest;
    }
  }
  return id;
}

function canonicalNoteSet(set: WeightedNoteSet, vocabulary: Set<string>): WeightedNoteSet {
  return {
    top: set.top.map((n) => canonicalNote(n, vocabulary)),
    heart: set.heart.map((n) => canonicalNote(n, vocabulary)),
    base: set.base.map((n) => canonicalNote(n, vocabulary)),
  };
}

export function findClosestMatches(
  target: WeightedNoteSet,
  catalog: PerfumeEntry[],
  count: number,
  excludeId?: string
): Match[] {
  const vocabulary = buildNoteVocabulary(catalog);
  const canonTarget = canonicalNoteSet(target, vocabulary);
  const scored = catalog
    .filter((p) => p.id !== excludeId)
    .map((p) => ({
      perfume: p,
      similarity: weightedJaccard(canonTarget, canonicalNoteSet(perfumeNoteSet(p), vocabulary)),
    }))
    .sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, count);
}

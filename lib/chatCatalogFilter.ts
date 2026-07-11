import type { PerfumeEntry } from "./types";

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

/** Pre-filters the catalog down to candidates worth sending to the model for the
 * WRAPUP recommendation call, scored by keyword overlap with the conversation so far. */
export function filterCandidates(
  conversationText: string,
  catalog: PerfumeEntry[],
  limit = 40
): PerfumeEntry[] {
  const words = tokenize(conversationText);
  if (words.size === 0) {
    return catalog
      .slice()
      .sort((a, b) => b.fameScore - a.fameScore)
      .slice(0, limit);
  }

  const scored = catalog.map((p) => {
    const tags = [...p.notes.top, ...p.notes.heart, ...p.notes.base, ...p.accords, ...p.vibe].map(
      (t) => t.replace(/-/g, " ")
    );
    let score = 0;
    for (const tag of tags) {
      for (const word of tag.split(" ")) {
        if (words.has(word)) score++;
      }
    }
    return { perfume: p, score };
  });

  scored.sort((a, b) => b.score - a.score || b.perfume.fameScore - a.perfume.fameScore);
  return scored.slice(0, limit).map((s) => s.perfume);
}

export function formatCandidateList(candidates: PerfumeEntry[]): string {
  return candidates
    .map((p) => `${p.id} | ${p.name} | ${p.vibe.slice(0, 3).join(", ")}`)
    .join("\n");
}

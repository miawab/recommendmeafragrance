import type { NoteEntry, PerfumeEntry } from "./types";

export interface NotePalette {
  top: string[];
  heart: string[];
  base: string[];
}

/**
 * notes.json only stores a flat note vocabulary with total counts (no layer info).
 * To build a categorized "top/heart/base" palette for Build-a-Bottle we derive each
 * note's dominant pyramid layer by scanning how it's actually used across the catalog.
 */
export function buildNotePalette(
  catalog: PerfumeEntry[],
  notes: NoteEntry[],
  limit = 120
): NotePalette {
  const layerCounts = new Map<string, { top: number; heart: number; base: number }>();
  const bump = (note: string, layer: "top" | "heart" | "base") => {
    const entry = layerCounts.get(note) ?? { top: 0, heart: 0, base: 0 };
    entry[layer] += 1;
    layerCounts.set(note, entry);
  };
  for (const p of catalog) {
    for (const n of p.notes.top) bump(n, "top");
    for (const n of p.notes.heart) bump(n, "heart");
    for (const n of p.notes.base) bump(n, "base");
  }

  const palette: NotePalette = { top: [], heart: [], base: [] };
  for (const note of notes.slice(0, limit)) {
    const counts = layerCounts.get(note.id) ?? { top: 0, heart: 0, base: 0 };
    const dominant: "top" | "heart" | "base" =
      counts.top >= counts.heart && counts.top >= counts.base
        ? "top"
        : counts.heart >= counts.base
          ? "heart"
          : "base";
    palette[dominant].push(note.id);
  }
  return palette;
}

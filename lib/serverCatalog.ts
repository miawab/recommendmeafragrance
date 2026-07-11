import fs from "node:fs";
import path from "node:path";
import type { NoteEntry, OffersMap, PerfumeEntry } from "./types";

let fullCache: PerfumeEntry[] | null = null;
let notesCache: NoteEntry[] | null = null;
let offersCache: OffersMap | null = null;

function readJson<T>(relPath: string, fallback: T): T {
  try {
    const abs = path.join(process.cwd(), "public", "data", relPath);
    return JSON.parse(fs.readFileSync(abs, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

export function getFullCatalog(): PerfumeEntry[] {
  if (!fullCache) fullCache = readJson<PerfumeEntry[]>("catalog-full.json", []);
  return fullCache;
}

export function getFamousCatalog(): PerfumeEntry[] {
  return getFullCatalog().filter((p) => p.tier === "famous");
}

export function getNotes(): NoteEntry[] {
  if (!notesCache) notesCache = readJson<NoteEntry[]>("notes.json", []);
  return notesCache;
}

export function getOffers(): OffersMap {
  if (!offersCache) offersCache = readJson<OffersMap>("offers.json", {});
  return offersCache;
}

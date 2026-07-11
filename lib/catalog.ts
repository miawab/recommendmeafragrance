import type { NoteEntry, PerfumeEntry } from "./types";

let corePromise: Promise<PerfumeEntry[]> | null = null;
let fullPromise: Promise<PerfumeEntry[]> | null = null;
let notesPromise: Promise<NoteEntry[]> | null = null;

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

/** Famous-tier only (~300 entries). Loads eagerly on the hub and most games. */
export function loadCoreCatalog(): Promise<PerfumeEntry[]> {
  if (!corePromise) corePromise = fetchJson<PerfumeEntry[]>("/data/catalog-core.json");
  return corePromise;
}

/** Full catalog (famous + deep, ~2500 entries). Lazy-load only where needed. */
export function loadFullCatalog(): Promise<PerfumeEntry[]> {
  if (!fullPromise) fullPromise = fetchJson<PerfumeEntry[]>("/data/catalog-full.json");
  return fullPromise;
}

export function loadNotes(): Promise<NoteEntry[]> {
  if (!notesPromise) notesPromise = fetchJson<NoteEntry[]>("/data/notes.json");
  return notesPromise;
}

export async function findById(id: string): Promise<PerfumeEntry | undefined> {
  const full = await loadFullCatalog();
  return full.find((p) => p.id === id);
}

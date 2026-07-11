import type { PerfumeEntry } from "./types";
import { dailyIndex, shuffleDeterministic } from "./seededRandom";

const SHUFFLE_SEED = 1337;

/** A stable shuffled order over the famous pool so daily answers don't correlate
 * with fameScore rank or repeat in a predictable cadence across games. */
export function shuffledFamousPool(famous: PerfumeEntry[]): PerfumeEntry[] {
  const sorted = famous.slice().sort((a, b) => a.id.localeCompare(b.id));
  return shuffleDeterministic(sorted, SHUFFLE_SEED);
}

export function getDailyAnswer(
  famous: PerfumeEntry[],
  date: string,
  gameName: string
): PerfumeEntry {
  const pool = shuffledFamousPool(famous);
  const idx = dailyIndex(date, gameName, pool.length);
  return pool[idx];
}

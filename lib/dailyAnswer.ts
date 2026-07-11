import type { PerfumeEntry } from "./types";
import { dailyIndex, shuffleDeterministic } from "./seededRandom";

const SHUFFLE_SEED = 1337;
const DEEP_SHUFFLE_SEED = 7331;

export type DailyDifficulty = "easy" | "hard";

/** A stable shuffled order over the famous pool so daily answers don't correlate
 * with fameScore rank or repeat in a predictable cadence across games. */
export function shuffledFamousPool(famous: PerfumeEntry[]): PerfumeEntry[] {
  const sorted = famous.slice().sort((a, b) => a.id.localeCompare(b.id));
  return shuffleDeterministic(sorted, SHUFFLE_SEED);
}

/** Same idea, but over an arbitrary pool with its own seed, for the deeper
 * (non-famous) catalog that backs hard mode. */
function shuffledPool(pool: PerfumeEntry[], seed: number): PerfumeEntry[] {
  const sorted = pool.slice().sort((a, b) => a.id.localeCompare(b.id));
  return shuffleDeterministic(sorted, seed);
}

/** The easy answer: today's pick from the famous pool, unchanged from before
 * difficulty modes existed. */
export function getDailyAnswer(
  famous: PerfumeEntry[],
  date: string,
  gameName: string
): PerfumeEntry {
  const pool = shuffledFamousPool(famous);
  const idx = dailyIndex(date, gameName, pool.length);
  return pool[idx];
}

/**
 * Each day picks two candidate answers per game: one famous, well-known
 * bottle (easy) and one from the deeper, less-famous catalog (hard), so
 * players can pick their difficulty. Falls back to the famous pool for hard
 * if the catalog has no non-famous entries (e.g. a tiny local dev catalog).
 */
export function getDailyAnswerPair(
  famous: PerfumeEntry[],
  full: PerfumeEntry[],
  date: string,
  gameName: string
): { easy: PerfumeEntry; hard: PerfumeEntry } {
  const easy = getDailyAnswer(famous, date, gameName);
  const deep = full.filter((p) => p.tier !== "famous" && p.id !== easy.id);
  const hardPool =
    deep.length > 0
      ? shuffledPool(deep, DEEP_SHUFFLE_SEED)
      : shuffledPool(
          famous.filter((p) => p.id !== easy.id),
          DEEP_SHUFFLE_SEED
        );
  const idx = dailyIndex(date, `${gameName}:hard`, hardPool.length);
  const hard = hardPool[idx] ?? easy;
  return { easy, hard };
}

export function getDailyAnswerByDifficulty(
  famous: PerfumeEntry[],
  full: PerfumeEntry[],
  date: string,
  gameName: string,
  difficulty: DailyDifficulty
): PerfumeEntry {
  const { easy, hard } = getDailyAnswerPair(famous, full, date, gameName);
  return difficulty === "hard" ? hard : easy;
}

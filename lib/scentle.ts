import type { PerfumeEntry } from "./types";

export type DirectionalStatus = "exact" | "up" | "down";
export type BinaryStatus = "exact" | "miss";
export type BrandStatus = "exact" | "partial" | "miss";

export interface ScentleFeedback {
  correct: boolean;
  brand: BrandStatus;
  year: { status: DirectionalStatus; close: boolean } | null;
  gender: BinaryStatus;
  priceTier: { status: DirectionalStatus };
  concentration: BinaryStatus;
  sharedNotes: number;
}

function allNotes(p: PerfumeEntry): Set<string> {
  return new Set([...p.notes.top, ...p.notes.heart, ...p.notes.base]);
}

/** Direction is relative to the guess: which way the player should move to reach the answer. */
function directional(guessVal: number, answerVal: number): DirectionalStatus {
  if (guessVal === answerVal) return "exact";
  return answerVal > guessVal ? "up" : "down";
}

export function computeScentleFeedback(
  guess: PerfumeEntry,
  answer: PerfumeEntry
): ScentleFeedback {
  const correct = guess.id === answer.id;

  let brand: BrandStatus = "miss";
  if (guess.brand === answer.brand) brand = "exact";
  else if (guess.brandGroup === answer.brandGroup) brand = "partial";

  let year: ScentleFeedback["year"] = null;
  if (guess.year != null && answer.year != null) {
    const status = directional(guess.year, answer.year);
    year = { status, close: Math.abs(guess.year - answer.year) <= 3 };
  }

  const gender: BinaryStatus = guess.gender === answer.gender ? "exact" : "miss";
  const priceTier = { status: directional(guess.priceTier, answer.priceTier) };
  const concentration: BinaryStatus =
    guess.concentration === answer.concentration ? "exact" : "miss";

  const guessNotes = allNotes(guess);
  const answerNotes = allNotes(answer);
  let sharedNotes = 0;
  for (const n of guessNotes) if (answerNotes.has(n)) sharedNotes++;

  return { correct, brand, year, gender, priceTier, concentration, sharedNotes };
}

/** Note Detective reveals individual notes one at a time: base notes first (hardest),
 * then heart, then top. `count` is how many notes (across that order) are revealed so far. */
export function getRevealedNotes(answer: PerfumeEntry, count: number): string[] {
  const order = [...answer.notes.base, ...answer.notes.heart, ...answer.notes.top];
  return order.slice(0, Math.max(0, count));
}

export function totalNoteCount(answer: PerfumeEntry): number {
  return answer.notes.base.length + answer.notes.heart.length + answer.notes.top.length;
}

export function buildShareGrid(history: ScentleFeedback[]): string {
  const symbol = (status: string) =>
    status === "exact" ? "🟩" : status === "partial" || status === "up" || status === "down" ? "🟨" : "⬛";
  return history
    .map((f) =>
      [
        symbol(f.brand),
        f.year ? symbol(f.year.status) : "⬛",
        symbol(f.gender),
        symbol(f.priceTier.status),
        symbol(f.concentration),
        f.sharedNotes > 0 ? "🟨" : "⬛",
      ].join("")
    )
    .join("\n");
}

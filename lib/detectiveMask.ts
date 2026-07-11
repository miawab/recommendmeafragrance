import { seededHash, shuffleDeterministic } from "./seededRandom";

/**
 * Hangman-style mask for Note Detective. Letters/digits hide as "_",
 * spaces and punctuation show through so the name's shape reads.
 *
 * Reveals are percentage-based rather than a fixed letter count, so short
 * and long names feel equally hinted: whole letters (all occurrences,
 * hangman-style) are uncovered in a deterministic per-day order. The
 * percentage grows with how many times the player has hit "reveal next
 * note" rather than with score, so it can't be gamed by wrong guesses and
 * scales naturally with however many notes a perfume has.
 */
export const PCT_PER_REVEAL = 0.07;
export const MAX_REVEAL_PCT = 0.85;

export function revealPctFor(revealCount: number): number {
  return Math.min(MAX_REVEAL_PCT, Math.max(0, revealCount) * PCT_PER_REVEAL);
}

export function buildNameMask(name: string, date: string, revealCount: number): string {
  const pct = revealPctFor(revealCount);

  const letterPositions = Array.from(name.toLowerCase()).filter((ch) => /[a-z0-9]/.test(ch));
  const counts = new Map<string, number>();
  for (const ch of letterPositions) counts.set(ch, (counts.get(ch) ?? 0) + 1);

  const order = shuffleDeterministic(
    [...counts.keys()],
    seededHash(`${date}:detective-letters`)
  );

  const revealed = new Set<string>();
  let covered = 0;
  for (const letter of order) {
    if (letterPositions.length === 0 || covered / letterPositions.length >= pct) break;
    revealed.add(letter);
    covered += counts.get(letter) ?? 0;
  }

  return Array.from(name)
    .map((ch) => {
      if (!/[a-zA-Z0-9]/.test(ch)) return ch;
      return revealed.has(ch.toLowerCase()) ? ch : "_";
    })
    .join("");
}

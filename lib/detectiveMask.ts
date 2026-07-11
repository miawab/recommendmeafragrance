import { seededHash, shuffleDeterministic } from "./seededRandom";

/**
 * Hangman-style mask for Note Detective. Letters/digits hide as "_",
 * spaces and punctuation show through so the name's shape reads.
 *
 * Reveals are percentage-based rather than a fixed letter count, so short
 * and long names feel equally hinted: whole letters (all occurrences,
 * hangman-style) are uncovered in a deterministic per-day order until the
 * revealed share of the name's letter positions reaches the stage's
 * percentage.
 */
export const REVEAL_STAGE_PCTS = [0, 0.15, 0.3, 0.45];

export function buildNameMask(name: string, date: string, stage: number): string {
  const pct = REVEAL_STAGE_PCTS[Math.max(0, Math.min(REVEAL_STAGE_PCTS.length - 1, stage))];

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

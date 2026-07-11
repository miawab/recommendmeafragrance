import { seededHash, shuffleDeterministic } from "./seededRandom";

/**
 * Hangman-style mask for Note Detective. Letters/digits hide as "_",
 * spaces and punctuation show through so the name's shape reads. Revealed
 * letters are chosen deterministically per day (same for every player) and
 * revealing a letter exposes all its occurrences, hangman-style.
 */
export function buildNameMask(name: string, date: string, lettersRevealed: number): string {
  const unique: string[] = [];
  for (const ch of name.toLowerCase()) {
    if (/[a-z0-9]/.test(ch) && !unique.includes(ch)) unique.push(ch);
  }
  const order = shuffleDeterministic(unique, seededHash(`${date}:detective-letters`));
  const revealed = new Set(order.slice(0, Math.max(0, Math.min(lettersRevealed, order.length))));

  return Array.from(name)
    .map((ch) => {
      if (!/[a-zA-Z0-9]/.test(ch)) return ch;
      return revealed.has(ch.toLowerCase()) ? ch : "_";
    })
    .join("");
}

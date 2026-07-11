import type { PerfumeEntry } from "./types";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Finds catalog perfumes the Concierge actually named in a free-text reply,
 * so the client can render them as buyable cards under the message.
 *
 * Guards against false positives: the name must appear on word boundaries,
 * and short names (which collide with everyday words, e.g. "Angel") only
 * count when the reply also mentions the brand. When one matched name
 * contains another (e.g. "Bleu de Chanel Parfum" vs "Bleu de Chanel"), only
 * the longest is kept.
 */
export function findMentionedPerfumes(
  text: string,
  catalog: PerfumeEntry[],
  max = 3
): PerfumeEntry[] {
  const lower = text.toLowerCase();
  const matched: PerfumeEntry[] = [];

  for (const p of catalog) {
    const name = p.name.toLowerCase();
    if (name.length < 3) continue;
    const nameRe = new RegExp(`(^|[^a-z0-9])${escapeRegExp(name)}($|[^a-z0-9])`, "i");
    if (!nameRe.test(lower)) continue;
    if (name.length < 8 && !lower.includes(p.brand.toLowerCase())) continue;
    matched.push(p);
  }

  const longestOnly = matched.filter(
    (p) =>
      !matched.some(
        (other) =>
          other !== p &&
          other.name.length > p.name.length &&
          other.name.toLowerCase().includes(p.name.toLowerCase())
      )
  );

  return longestOnly.sort((a, b) => b.fameScore - a.fameScore).slice(0, max);
}

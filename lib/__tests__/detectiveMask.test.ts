import { describe, expect, it } from "vitest";
import { buildNameMask, MAX_REVEAL_PCT, revealPctFor } from "../detectiveMask";

function revealedShare(name: string, mask: string): number {
  const chars = Array.from(name);
  let letters = 0;
  let shown = 0;
  chars.forEach((ch, i) => {
    if (!/[a-zA-Z0-9]/.test(ch)) return;
    letters++;
    if (mask[i] !== "_") shown++;
  });
  return shown / letters;
}

describe("revealPctFor", () => {
  it("is zero with no notes revealed yet", () => {
    expect(revealPctFor(0)).toBe(0);
  });

  it("grows by roughly 6-8% per note revealed", () => {
    expect(revealPctFor(1)).toBeCloseTo(0.07, 5);
    expect(revealPctFor(2)).toBeCloseTo(0.14, 5);
    expect(revealPctFor(4)).toBeCloseTo(0.28, 5);
  });

  it("caps out instead of climbing past the max", () => {
    expect(revealPctFor(1000)).toBe(MAX_REVEAL_PCT);
  });
});

describe("buildNameMask", () => {
  it("hides all letters with no reveals yet but keeps the shape", () => {
    const mask = buildNameMask("La Vie Est Belle", "2026-07-12", 0);
    expect(mask).toBe("__ ___ ___ _____");
  });

  it("is deterministic for the same day and reveal count", () => {
    const a = buildNameMask("Black Opium", "2026-07-12", 4);
    const b = buildNameMask("Black Opium", "2026-07-12", 4);
    expect(a).toBe(b);
  });

  it("reveals all occurrences of a chosen letter, hangman style", () => {
    const name = "Coco Noir";
    const mask = buildNameMask(name, "2026-07-12", 5);
    const chars = Array.from(name.toLowerCase());
    Array.from(mask).forEach((mch, i) => {
      if (mch === "_" || !/[a-z0-9]/i.test(name[i])) return;
      // every other occurrence of this letter must also be revealed
      chars.forEach((ch, j) => {
        if (ch === chars[i]) expect(mask[j]).not.toBe("_");
      });
    });
  });

  it("reveals more letters as the reveal count climbs, tied to note reveals not score", () => {
    const name = "Emporio Armani Stronger With You";
    const shares = [0, 2, 5, 10].map((n) =>
      revealedShare(name, buildNameMask(name, "2026-07-12", n))
    );
    expect(shares[0]).toBe(0);
    expect(shares[1]).toBeGreaterThan(0);
    expect(shares[2]).toBeGreaterThanOrEqual(shares[1]);
    expect(shares[3]).toBeGreaterThanOrEqual(shares[2]);
  });
});

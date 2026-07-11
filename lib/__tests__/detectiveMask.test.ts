import { describe, expect, it } from "vitest";
import { buildNameMask } from "../detectiveMask";

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

describe("buildNameMask", () => {
  it("hides all letters at stage 0 but keeps the shape", () => {
    const mask = buildNameMask("La Vie Est Belle", "2026-07-12", 0);
    expect(mask).toBe("__ ___ ___ _____");
  });

  it("is deterministic for the same day", () => {
    const a = buildNameMask("Black Opium", "2026-07-12", 2);
    const b = buildNameMask("Black Opium", "2026-07-12", 2);
    expect(a).toBe(b);
  });

  it("reveals all occurrences of a chosen letter, hangman style", () => {
    const name = "Coco Noir";
    const mask = buildNameMask(name, "2026-07-12", 3);
    const chars = Array.from(name.toLowerCase());
    Array.from(mask).forEach((mch, i) => {
      if (mch === "_" || !/[a-z0-9]/i.test(name[i])) return;
      // every other occurrence of this letter must also be revealed
      chars.forEach((ch, j) => {
        if (ch === chars[i]) expect(mask[j]).not.toBe("_");
      });
    });
  });

  it("scales reveals with name length via percentage coverage", () => {
    for (const name of ["Sauvage", "Stronger With You Absolutely Intense"]) {
      const share = revealedShare(name, buildNameMask(name, "2026-07-12", 3));
      expect(share).toBeGreaterThan(0.3);
      expect(share).toBeLessThan(0.85);
    }
  });

  it("reveals more at each stage", () => {
    const name = "Emporio Armani Stronger With You";
    const shares = [0, 1, 2, 3].map((s) =>
      revealedShare(name, buildNameMask(name, "2026-07-12", s))
    );
    expect(shares[0]).toBe(0);
    expect(shares[1]).toBeGreaterThan(0);
    expect(shares[2]).toBeGreaterThanOrEqual(shares[1]);
    expect(shares[3]).toBeGreaterThanOrEqual(shares[2]);
  });
});

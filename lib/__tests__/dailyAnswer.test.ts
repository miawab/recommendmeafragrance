import { describe, expect, it } from "vitest";
import { getDailyAnswer } from "../dailyAnswer";
import type { PerfumeEntry } from "../types";

function makePool(count: number): PerfumeEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `perfume-${i}`,
    name: `Perfume ${i}`,
    brand: "Brand",
    year: 2020,
    gender: "unisex",
    concentration: "EDP",
    priceTier: 2,
    brandGroup: "designer",
    tier: "famous",
    fameScore: i / count,
    notes: { top: [], heart: [], base: [] },
    accords: [],
    seasons: [],
    occasions: [],
    vibe: [],
    funFact: "",
  }));
}

describe("getDailyAnswer", () => {
  const pool = makePool(300);

  it("is deterministic for the same date and game", () => {
    const a = getDailyAnswer(pool, "2026-07-11", "scentle");
    const b = getDailyAnswer(pool, "2026-07-11", "scentle");
    expect(a.id).toBe(b.id);
  });

  it("differs across game names on the same date (independent pools)", () => {
    const scentle = getDailyAnswer(pool, "2026-07-11", "scentle");
    const detective = getDailyAnswer(pool, "2026-07-11", "detective");
    // Not guaranteed different for every date, but the hash inputs differ so
    // across many dates they should diverge; spot check a handful of dates.
    const dates = ["2026-07-11", "2026-07-12", "2026-07-13", "2026-07-14"];
    const anyDifferent = dates.some(
      (d) => getDailyAnswer(pool, d, "scentle").id !== getDailyAnswer(pool, d, "detective").id
    );
    expect(anyDifferent).toBe(true);
    expect(scentle).toBeDefined();
    expect(detective).toBeDefined();
  });

  it("changes across different dates (not static)", () => {
    const dates = Array.from({ length: 10 }, (_, i) => `2026-07-${String(i + 1).padStart(2, "0")}`);
    const ids = new Set(dates.map((d) => getDailyAnswer(pool, d, "scentle").id));
    expect(ids.size).toBeGreaterThan(1);
  });

  it("only ever returns entries from the given pool", () => {
    for (let i = 0; i < 20; i++) {
      const date = `2026-08-${String(i + 1).padStart(2, "0")}`;
      const answer = getDailyAnswer(pool, date, "scentle");
      expect(pool.some((p) => p.id === answer.id)).toBe(true);
    }
  });
});

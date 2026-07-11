import { describe, expect, it } from "vitest";
import { findClosestMatches, weightedJaccard } from "../jaccard";
import type { PerfumeEntry } from "../types";

function makePerfume(id: string, notes: PerfumeEntry["notes"]): PerfumeEntry {
  return {
    id,
    name: id,
    brand: "Brand",
    year: 2020,
    gender: "unisex",
    concentration: "EDP",
    priceTier: 2,
    brandGroup: "designer",
    tier: "famous",
    fameScore: 0.5,
    notes,
    accords: [],
    seasons: [],
    occasions: [],
    vibe: [],
    funFact: "",
  };
}

describe("weightedJaccard", () => {
  it("scores identical note sets as a perfect match", () => {
    const notes = { top: ["bergamot"], heart: ["rose"], base: ["musk"] };
    expect(weightedJaccard(notes, notes)).toBe(1);
  });

  it("scores completely disjoint note sets as zero", () => {
    const a = { top: ["bergamot"], heart: ["rose"], base: ["musk"] };
    const b = { top: ["lemon"], heart: ["jasmine"], base: ["vanilla"] };
    expect(weightedJaccard(a, b)).toBe(0);
  });

  it("weights base note overlap more heavily than top/heart", () => {
    const target = { top: ["bergamot"], heart: ["rose"], base: ["musk"] };
    const sharesBase = { top: ["lemon"], heart: ["jasmine"], base: ["musk"] };
    const sharesTop = { top: ["bergamot"], heart: ["jasmine"], base: ["vanilla"] };
    expect(weightedJaccard(target, sharesBase)).toBeGreaterThan(
      weightedJaccard(target, sharesTop)
    );
  });

  it("returns a value between 0 and 1 for partial overlap", () => {
    const a = { top: ["bergamot", "lemon"], heart: ["rose"], base: ["musk"] };
    const b = { top: ["bergamot"], heart: ["jasmine"], base: ["musk", "amber"] };
    const score = weightedJaccard(a, b);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });
});

describe("findClosestMatches", () => {
  const target = { top: ["bergamot"], heart: ["rose"], base: ["musk"] };
  const catalog = [
    makePerfume("exact", { top: ["bergamot"], heart: ["rose"], base: ["musk"] }),
    makePerfume("close", { top: ["bergamot"], heart: ["jasmine"], base: ["musk"] }),
    makePerfume("far", { top: ["lemon"], heart: ["jasmine"], base: ["vanilla"] }),
  ];

  it("ranks matches best-first", () => {
    const matches = findClosestMatches(target, catalog, 3);
    expect(matches.map((m) => m.perfume.id)).toEqual(["exact", "close", "far"]);
  });

  it("respects the requested count", () => {
    expect(findClosestMatches(target, catalog, 2)).toHaveLength(2);
  });

  it("excludes the given id (e.g. the perfume being compared against itself)", () => {
    const matches = findClosestMatches(target, catalog, 3, "exact");
    expect(matches.some((m) => m.perfume.id === "exact")).toBe(false);
  });
});

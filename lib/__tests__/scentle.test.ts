import { describe, expect, it } from "vitest";
import { computeScentleFeedback, getRevealedNotes } from "../scentle";
import type { PerfumeEntry } from "../types";

function makePerfume(overrides: Partial<PerfumeEntry>): PerfumeEntry {
  return {
    id: "test-id",
    name: "Test",
    brand: "TestBrand",
    year: 2020,
    gender: "unisex",
    concentration: "EDP",
    priceTier: 2,
    brandGroup: "designer",
    tier: "famous",
    fameScore: 0.5,
    notes: { top: ["bergamot"], heart: ["rose"], base: ["musk"] },
    accords: ["floral"],
    seasons: ["spring"],
    occasions: ["date"],
    vibe: ["versatile"],
    funFact: "",
    ...overrides,
  };
}

describe("computeScentleFeedback", () => {
  it("marks an identical guess as fully correct", () => {
    const answer = makePerfume({ id: "a" });
    const feedback = computeScentleFeedback(answer, answer);
    expect(feedback.correct).toBe(true);
    expect(feedback.brand).toBe("exact");
    expect(feedback.year?.status).toBe("exact");
    expect(feedback.gender).toBe("exact");
    expect(feedback.priceTier.status).toBe("exact");
    expect(feedback.concentration).toBe("exact");
    expect(feedback.sharedNotes).toBe(3);
  });

  it("gives brand partial credit for same brand-group, miss otherwise", () => {
    const answer = makePerfume({ id: "a", brand: "Dior", brandGroup: "designer" });
    const sameGroup = makePerfume({ id: "b", brand: "Chanel", brandGroup: "designer" });
    const differentGroup = makePerfume({ id: "c", brand: "Lattafa", brandGroup: "arab-house" });

    expect(computeScentleFeedback(sameGroup, answer).brand).toBe("partial");
    expect(computeScentleFeedback(differentGroup, answer).brand).toBe("miss");
  });

  it("gives directional year feedback and flags within-3-years as close", () => {
    const answer = makePerfume({ id: "a", year: 2020 });
    const earlier = makePerfume({ id: "b", year: 2015 });
    const closeEarlier = makePerfume({ id: "c", year: 2018 });
    const later = makePerfume({ id: "d", year: 2023 });

    const feedbackEarlier = computeScentleFeedback(earlier, answer);
    expect(feedbackEarlier.year?.status).toBe("up"); // answer is later than the guess
    expect(feedbackEarlier.year?.close).toBe(false);

    expect(computeScentleFeedback(closeEarlier, answer).year?.close).toBe(true);

    const feedbackLater = computeScentleFeedback(later, answer);
    expect(feedbackLater.year?.status).toBe("down"); // answer is earlier than the guess
  });

  it("counts shared notes across all pyramid layers", () => {
    const answer = makePerfume({
      id: "a",
      notes: { top: ["bergamot", "lemon"], heart: ["rose"], base: ["musk", "amber"] },
    });
    const guess = makePerfume({
      id: "b",
      notes: { top: ["bergamot"], heart: ["jasmine"], base: ["musk", "vanilla"] },
    });
    expect(computeScentleFeedback(guess, answer).sharedNotes).toBe(2);
  });
});

describe("getRevealedNotes", () => {
  const answer = makePerfume({
    notes: { top: ["bergamot"], heart: ["rose"], base: ["musk", "amber"] },
  });

  it("reveals nothing at count 0", () => {
    expect(getRevealedNotes(answer, 0)).toEqual([]);
  });

  it("reveals base notes one at a time, first", () => {
    expect(getRevealedNotes(answer, 1)).toEqual(["musk"]);
    expect(getRevealedNotes(answer, 2)).toEqual(["musk", "amber"]);
  });

  it("reveals heart after base is exhausted", () => {
    expect(getRevealedNotes(answer, 3)).toEqual(["musk", "amber", "rose"]);
  });

  it("reveals top last, and clamps beyond the total note count", () => {
    expect(getRevealedNotes(answer, 4)).toEqual(["musk", "amber", "rose", "bergamot"]);
    expect(getRevealedNotes(answer, 99)).toEqual(["musk", "amber", "rose", "bergamot"]);
  });
});

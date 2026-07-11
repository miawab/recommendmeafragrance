import { describe, expect, it } from "vitest";
import { findMentionedPerfumes } from "../chatMentions";
import type { PerfumeEntry } from "../types";

function entry(overrides: Partial<PerfumeEntry>): PerfumeEntry {
  return {
    id: "x",
    name: "X",
    brand: "Y",
    year: 2020,
    gender: "unisex",
    concentration: "EDP",
    priceTier: 3,
    brandGroup: "designer",
    tier: "famous",
    fameScore: 50,
    notes: { top: [], heart: [], base: [] },
    accords: [],
    seasons: [],
    occasions: [],
    vibe: [],
    funFact: "",
    ...overrides,
  };
}

const catalog: PerfumeEntry[] = [
  entry({ id: "dior-sauvage", name: "Sauvage", brand: "Dior", fameScore: 99 }),
  entry({ id: "bdc", name: "Bleu de Chanel", brand: "Chanel", fameScore: 95 }),
  entry({ id: "bdc-parfum", name: "Bleu de Chanel Parfum", brand: "Chanel", fameScore: 90 }),
  entry({ id: "mugler-angel", name: "Angel", brand: "Mugler", fameScore: 80 }),
];

describe("findMentionedPerfumes", () => {
  it("finds a perfume named with its brand", () => {
    const picks = findMentionedPerfumes("Try Sauvage by Dior, it's a crowd killer.", catalog);
    expect(picks.map((p) => p.id)).toEqual(["dior-sauvage"]);
  });

  it("requires the brand nearby for short collision-prone names", () => {
    expect(findMentionedPerfumes("She has the voice of an angel.", catalog)).toEqual([]);
    expect(
      findMentionedPerfumes("Angel by Mugler is pure cotton candy drama.", catalog).map((p) => p.id)
    ).toEqual(["mugler-angel"]);
  });

  it("keeps only the longest name when matches nest", () => {
    const picks = findMentionedPerfumes(
      "Bleu de Chanel Parfum is the deeper, woodier one.",
      catalog
    );
    expect(picks.map((p) => p.id)).toEqual(["bdc-parfum"]);
  });

  it("matches on word boundaries only", () => {
    expect(findMentionedPerfumes("I love sauvageness in general.", catalog)).toEqual([]);
  });

  it("caps and orders by fame", () => {
    const picks = findMentionedPerfumes(
      "Sauvage by Dior, Bleu de Chanel, and Angel by Mugler are all icons.",
      catalog,
      2
    );
    expect(picks.map((p) => p.id)).toEqual(["dior-sauvage", "bdc"]);
  });
});

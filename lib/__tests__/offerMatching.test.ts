import { describe, expect, it } from "vitest";
import { matchOffers, normalizeProductName, tokenSetRatio, type FeedRow } from "../offerMatching";

describe("normalizeProductName", () => {
  it("strips concentration, volume, and gender markers", () => {
    expect(normalizeProductName("Sauvage EDT 100ml for men")).toBe("sauvage");
    expect(normalizeProductName("Black Opium Eau de Parfum 3.4 oz Spray")).toBe("black opium");
  });

  it("lowercases and collapses whitespace", () => {
    expect(normalizeProductName("  Bleu   De Chanel  ")).toBe("bleu de chanel");
  });
});

describe("tokenSetRatio", () => {
  it("scores identical names as a perfect match", () => {
    expect(tokenSetRatio("Sauvage", "Sauvage")).toBe(1);
  });

  it("is order-independent", () => {
    const a = tokenSetRatio("Dior Sauvage", "Sauvage Dior");
    expect(a).toBe(1);
  });

  it("scores unrelated names low", () => {
    expect(tokenSetRatio("Sauvage", "Black Opium")).toBeLessThan(0.3);
  });

  it("tolerates noise words that get normalized away", () => {
    const a = tokenSetRatio("Sauvage EDT 100ml for men", "Sauvage");
    expect(a).toBe(1);
  });
});

describe("matchOffers", () => {
  const feed: FeedRow[] = [
    {
      brand: "Dior",
      name: "Sauvage EDT 100ml for men",
      price: 89.99,
      currency: "USD",
      merchant: "FragranceNet",
      deepLink: "https://example.com/sauvage-100",
      volumeMl: 100,
      inStock: true,
    },
    {
      brand: "Dior",
      name: "Sauvage EDT 60ml for men",
      price: 65.0,
      currency: "USD",
      merchant: "FragranceNet",
      deepLink: "https://example.com/sauvage-60",
      volumeMl: 60,
      inStock: true,
    },
    {
      brand: "Lattafa Perfumes",
      name: "Khamrah EDP 100ml",
      price: 29.99,
      currency: "USD",
      merchant: "FragranceX",
      deepLink: "https://example.com/khamrah",
      volumeMl: 100,
      inStock: true,
    },
    {
      brand: "Versace",
      name: "Eros Flame 100ml",
      price: 75.0,
      currency: "USD",
      merchant: "FragranceX",
      deepLink: "https://example.com/eros-flame",
      volumeMl: 100,
      inStock: false,
    },
  ];

  it("matches a catalog target to the best feed row by brand and fuzzy name", () => {
    const result = matchOffers([{ id: "dior-sauvage", brand: "Dior", name: "Sauvage" }], feed);
    expect(result["dior-sauvage"]).toBeDefined();
    expect(result["dior-sauvage"].price).toBe(65); // cheapest among the tied full-size-eligible matches
  });

  it("matches brand aliases (e.g. lattafa vs lattafa perfumes)", () => {
    const result = matchOffers(
      [{ id: "lattafa-khamrah", brand: "Lattafa", name: "Khamrah" }],
      feed
    );
    expect(result["lattafa-khamrah"]?.merchant).toBe("FragranceX");
  });

  it("leaves unmatched targets out of the result entirely", () => {
    const result = matchOffers(
      [{ id: "creed-aventus", brand: "Creed", name: "Aventus" }],
      feed
    );
    expect(result["creed-aventus"]).toBeUndefined();
  });

  it("still matches an out-of-stock offer when it's the only candidate", () => {
    const result = matchOffers(
      [{ id: "versace-eros-flame", brand: "Versace", name: "Eros Flame" }],
      feed
    );
    expect(result["versace-eros-flame"]?.merchant).toBe("FragranceX");
  });
});

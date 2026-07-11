import { describe, expect, it } from "vitest";
import { parseRecommendation } from "../chatRecommendation";

const validIds = new Set(["dior-sauvage", "chanel-bleu-de-chanel", "creed-aventus"]);

describe("parseRecommendation", () => {
  it("parses a clean JSON response", () => {
    const raw = '{"picks":["dior-sauvage","creed-aventus"],"reason":"Both are fresh and versatile."}';
    const result = parseRecommendation(raw, validIds);
    expect(result).toEqual({
      picks: ["dior-sauvage", "creed-aventus"],
      reason: "Both are fresh and versatile.",
    });
  });

  it("strips ```json code fences", () => {
    const raw = '```json\n{"picks":["dior-sauvage","creed-aventus"],"reason":"Fresh picks."}\n```';
    const result = parseRecommendation(raw, validIds);
    expect(result?.picks).toEqual(["dior-sauvage", "creed-aventus"]);
  });

  it("strips bare code fences without a language tag", () => {
    const raw = '```\n{"picks":["dior-sauvage","creed-aventus"],"reason":"Fresh picks."}\n```';
    expect(parseRecommendation(raw, validIds)).not.toBeNull();
  });

  it("drops ids that aren't in the valid catalog set", () => {
    const raw =
      '{"picks":["dior-sauvage","made-up-id","creed-aventus"],"reason":"Solid choices."}';
    const result = parseRecommendation(raw, validIds);
    expect(result?.picks).toEqual(["dior-sauvage", "creed-aventus"]);
  });

  it("returns null when fewer than 2 valid ids remain", () => {
    const raw = '{"picks":["made-up-id","dior-sauvage"],"reason":"Only one is real."}';
    expect(parseRecommendation(raw, validIds)).toBeNull();
  });

  it("returns null on malformed JSON", () => {
    expect(parseRecommendation("not json at all", validIds)).toBeNull();
  });

  it("returns null when required fields are missing", () => {
    expect(parseRecommendation('{"picks":["dior-sauvage","creed-aventus"]}', validIds)).toBeNull();
    expect(parseRecommendation('{"reason":"no picks field"}', validIds)).toBeNull();
  });

  it("caps picks at 3 even if the model returns more", () => {
    const raw =
      '{"picks":["dior-sauvage","chanel-bleu-de-chanel","creed-aventus"],"reason":"Three great options."}';
    const result = parseRecommendation(raw, validIds);
    expect(result?.picks).toHaveLength(3);
  });

  it("deduplicates repeated ids", () => {
    const raw = '{"picks":["dior-sauvage","dior-sauvage","creed-aventus"],"reason":"Two unique."}';
    const result = parseRecommendation(raw, validIds);
    expect(result?.picks).toEqual(["dior-sauvage", "creed-aventus"]);
  });
});

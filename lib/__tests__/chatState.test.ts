import { describe, expect, it } from "vitest";
import { getChatState, remainingBudgetPct, stripUrls } from "../chatState";

describe("getChatState", () => {
  const budget = 8000;

  it("stays NORMAL under 75% usage and under 20 messages", () => {
    expect(getChatState(0, budget, 1)).toBe("NORMAL");
    expect(getChatState(5000, budget, 10)).toBe("NORMAL");
  });

  it("switches to WRAPUP at 75% budget usage", () => {
    expect(getChatState(6000, budget, 5)).toBe("WRAPUP");
    expect(getChatState(5999, budget, 5)).toBe("NORMAL");
  });

  it("switches to WRAPUP on the 20th message regardless of budget", () => {
    expect(getChatState(0, budget, 20)).toBe("WRAPUP");
    expect(getChatState(0, budget, 19)).toBe("NORMAL");
  });

  it("switches to LOCKED once usage reaches the daily budget", () => {
    expect(getChatState(8000, budget, 3)).toBe("LOCKED");
    expect(getChatState(9000, budget, 3)).toBe("LOCKED");
  });

  it("treats a zero or negative budget as immediately LOCKED", () => {
    expect(getChatState(0, 0, 1)).toBe("LOCKED");
  });
});

describe("remainingBudgetPct", () => {
  it("computes the percentage of budget left", () => {
    expect(remainingBudgetPct(0, 8000)).toBe(100);
    expect(remainingBudgetPct(4000, 8000)).toBe(50);
    expect(remainingBudgetPct(8000, 8000)).toBe(0);
  });

  it("never goes negative when usage exceeds budget", () => {
    expect(remainingBudgetPct(9000, 8000)).toBe(0);
  });
});

describe("stripUrls", () => {
  it("removes http(s) URLs", () => {
    expect(stripUrls("Check https://example.com for more")).toBe("Check  for more");
  });

  it("removes bare www URLs", () => {
    expect(stripUrls("Visit www.example.com today")).toBe("Visit  today");
  });

  it("leaves normal text untouched", () => {
    expect(stripUrls("Sauvage is a fresh, spicy fragrance.")).toBe(
      "Sauvage is a fresh, spicy fragrance."
    );
  });
});

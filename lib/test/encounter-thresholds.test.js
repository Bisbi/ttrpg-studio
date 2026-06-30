import { describe, it, expect } from "vitest";
import { XP_THRESHOLDS, multiplierForCount } from "../encounter/thresholds.js";

describe("XP_THRESHOLDS", () => {
  it("copre i livelli 1..20", () => {
    for (let l = 1; l <= 20; l++) {
      expect(XP_THRESHOLDS[l]).toBeTruthy();
      const t = XP_THRESHOLDS[l];
      expect(t.easy).toBeLessThanOrEqual(t.medium);
      expect(t.medium).toBeLessThanOrEqual(t.hard);
      expect(t.hard).toBeLessThanOrEqual(t.deadly);
    }
  });
  it("valori di riferimento al livello 1 e 5", () => {
    expect(XP_THRESHOLDS[1]).toEqual({ easy: 25, medium: 50, hard: 75, deadly: 100 });
    expect(XP_THRESHOLDS[5]).toEqual({ easy: 250, medium: 500, hard: 750, deadly: 1100 });
  });
});

describe("multiplierForCount", () => {
  it("scala col numero di mostri", () => {
    expect(multiplierForCount(1)).toBe(1);
    expect(multiplierForCount(2)).toBe(1.5);
    expect(multiplierForCount(3)).toBe(2);
    expect(multiplierForCount(6)).toBe(2);
    expect(multiplierForCount(7)).toBe(2.5);
    expect(multiplierForCount(11)).toBe(3);
    expect(multiplierForCount(15)).toBe(4);
  });
});

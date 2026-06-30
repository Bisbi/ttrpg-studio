import { describe, it, expect } from "vitest";
import { partyBudget, adjustedXp } from "../encounter/budget.js";

describe("partyBudget", () => {
  it("somma le soglie del party", () => {
    expect(partyBudget([1, 1])).toEqual({ easy: 50, medium: 100, hard: 150, deadly: 200 });
  });
  it("party misto", () => {
    const b = partyBudget([3, 3, 3, 4]);
    expect(b.hard).toBe(225 + 225 + 225 + 375);
  });
  it("errore su livello invalido", () => {
    expect(() => partyBudget([21])).toThrow(/livello/i);
  });
});

describe("adjustedXp", () => {
  it("applica il moltiplicatore per numero di mostri", () => {
    expect(adjustedXp([50])).toBe(50);          // ×1
    expect(adjustedXp([50, 50])).toBe(150);      // 100 ×1.5
    expect(adjustedXp([100, 100, 100])).toBe(600); // 300 ×2
  });
});

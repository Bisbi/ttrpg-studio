import { describe, it, expect } from "vitest";
import { runEncounter } from "../bin/encounter.js";

describe("runEncounter", () => {
  it("calcola budget e proposte per la difficoltà scelta", () => {
    const out = runEncounter({
      levels: [1, 1, 1, 1],
      candidates: [{ id: "g", name: "G", xp: 50 }],
      difficulty: "medium",
    }, {});
    expect(out.budget.medium).toBe(200);
    expect(out.target).toBe(200);
    expect(out.proposals[0].id).toBe("g");
    expect(out.proposals[0].adjustedXp).toBeLessThanOrEqual(200);
  });
  it("difficoltà di default = hard", () => {
    const out = runEncounter({ levels: [1, 1], candidates: [], }, {});
    expect(out.target).toBe(out.budget.hard);
  });
});

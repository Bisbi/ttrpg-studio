import { describe, it, expect } from "vitest";
import * as api from "../index.js";

describe("lib/index — adventure", () => {
  it("riesporta le API della pipeline avventura", () => {
    for (const name of ["validateAdventure", "scaffoldAdventure", "partyBudget",
      "adjustedXp", "proposeEncounters", "rollOnColumn", "rollAll", "extractOnePager",
      "validateAdventureConfig"]) {
      expect(typeof api[name]).toBe("function");
    }
    expect(api.XP_THRESHOLDS).toBeTruthy();
  });
});

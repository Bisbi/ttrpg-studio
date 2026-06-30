import { describe, it, expect } from "vitest";
import { proposeEncounters } from "../encounter/propose.js";

describe("proposeEncounters", () => {
  it("trova il massimo numero di copie entro il target", () => {
    // xp 50: n=1→50, n=2→150 (×1.5), n=3→300 (×2). target 200 → max 2.
    const props = proposeEncounters({ candidates: [{ id: "g", name: "G", xp: 50 }], target: 200 });
    expect(props[0]).toEqual({ id: "g", name: "G", count: 2, adjustedXp: 150 });
  });
  it("scarta i candidati che non entrano con 1 copia", () => {
    const props = proposeEncounters({ candidates: [{ id: "drago", name: "D", xp: 5000 }], target: 200 });
    expect(props).toEqual([]);
  });
  it("ordina per vicinanza al target e rispetta maxResults", () => {
    const props = proposeEncounters({
      candidates: [
        { id: "a", name: "A", xp: 25 },
        { id: "b", name: "B", xp: 100 },
      ],
      target: 200,
      maxResults: 1,
    });
    expect(props.length).toBe(1);
    expect(props[0].adjustedXp).toBeLessThanOrEqual(200);
  });
});

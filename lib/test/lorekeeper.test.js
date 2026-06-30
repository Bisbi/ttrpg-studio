import { describe, it, expect } from "vitest";
import { checkCanon } from "../lorekeeper/check.js";

describe("checkCanon", () => {
  it("segnala riferimenti pendenti", () => {
    const r = checkCanon({
      edges: [{ source: "a", type: "ostile", target: "ignoto" }],
      knownIds: ["a"],
    });
    expect(r.discrepancies.some((d) => d.code === "DANGLING_REF")).toBe(true);
  });

  it("segnala contraddizione ostile+alleata sulla stessa coppia", () => {
    const r = checkCanon({
      edges: [
        { source: "a", type: "ostile", target: "b" },
        { source: "b", type: "alleata", target: "a" },
      ],
      knownIds: ["a", "b"],
    });
    expect(r.discrepancies.some((d) => d.code === "CONTRADICTION")).toBe(true);
  });

  it("segnala self-loop", () => {
    const r = checkCanon({ edges: [{ source: "a", type: "ostile", target: "a" }], knownIds: ["a"] });
    expect(r.discrepancies.some((d) => d.code === "SELF_LOOP")).toBe(true);
  });

  it("canon pulito → nessuna discrepanza", () => {
    const r = checkCanon({
      edges: [{ source: "a", type: "alleata", target: "b" }],
      knownIds: ["a", "b"],
    });
    expect(r.discrepancies).toEqual([]);
  });
});

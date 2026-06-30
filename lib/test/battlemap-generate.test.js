import { describe, it, expect } from "vitest";
import { generateDungeon } from "../battlemap/generate.js";

// rng deterministico (LCG)
function seeded(seed) {
  let s = seed >>> 0;
  return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 2 ** 32; };
}

describe("generateDungeon", () => {
  it("rispetta le dimensioni e crea almeno una stanza con pavimento", () => {
    const map = generateDungeon({ cols: 12, rows: 10, rng: seeded(1) });
    expect(map.cols).toBe(12);
    expect(map.rows).toBe(10);
    expect(map.cells.length).toBe(10);
    expect(map.cells[0].length).toBe(12);
    expect(map.rooms.length).toBeGreaterThanOrEqual(1);
    const floors = map.cells.flat().filter((c) => c === 1).length;
    expect(floors).toBeGreaterThan(0);
  });
  it("è deterministico a parità di seed", () => {
    const a = generateDungeon({ rng: seeded(42) });
    const b = generateDungeon({ rng: seeded(42) });
    expect(a).toEqual(b);
  });
});

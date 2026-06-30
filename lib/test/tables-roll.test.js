import { describe, it, expect } from "vitest";
import { rollOnColumn, rollAll } from "../tables/roll.js";
import { ToolError } from "../common/errors.js";

const table = { table: "t", columns: { a: ["x", "y", "z"], b: ["uno"] } };

describe("rollOnColumn", () => {
  it("rng=0 → prima voce", () => {
    expect(rollOnColumn(table, "a", () => 0)).toBe("x");
  });
  it("rng→ultima voce", () => {
    expect(rollOnColumn(table, "a", () => 0.99)).toBe("z");
  });
  it("colonna inesistente → ToolError", () => {
    expect(() => rollOnColumn(table, "zzz", () => 0)).toThrow(ToolError);
  });
});

describe("rollAll", () => {
  it("una voce per colonna", () => {
    const r = rollAll(table, () => 0);
    expect(r).toEqual({ a: "x", b: "uno" });
  });
});

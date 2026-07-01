import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "templates", "tables");

describe("seed tables", () => {
  const files = readdirSync(dir).filter((f) => f.endsWith("-seed.json"));
  it("ci sono almeno 4 seed table", () => {
    expect(files.length).toBeGreaterThanOrEqual(4);
  });
  for (const f of ["faction-seed.json", "region-seed.json", "deity-seed.json", "npc-seed.json"]) {
    it(`${f} è ben formato e non vuoto`, () => {
      const data = JSON.parse(readFileSync(join(dir, f), "utf8"));
      expect(data.schema_version).toBe("1.0");
      expect(typeof data.table).toBe("string");
      expect(data.source).toBe("HomebrewExample");
      const cols = Object.values(data.columns);
      expect(cols.length).toBeGreaterThanOrEqual(3);
      for (const entries of cols) expect(entries.length).toBeGreaterThanOrEqual(6);
    });
  }
});

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const p = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "templates", "tables", "loot-nonitem.json");

describe("loot-nonitem", () => {
  it("è ben formato e non vuoto", () => {
    const data = JSON.parse(readFileSync(p, "utf8"));
    expect(data.schema_version).toBe("1.0");
    expect(data.table).toBe("loot-nonitem");
    expect(data.columns.tipo.length).toBeGreaterThanOrEqual(4);
    expect(data.columns.esempio.length).toBe(data.columns.tipo.length);
  });
});

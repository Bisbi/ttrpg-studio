import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { collectKnownIds, runLoreCheck } from "../bin/lore-check.js";

function setup(relations) {
  const dir = mkdtempSync(join(tmpdir(), "lc-"));
  mkdirSync(join(dir, "30-factions"), { recursive: true });
  writeFileSync(join(dir, "30-factions", "_index.md"), "# Fazioni");
  writeFileSync(join(dir, "30-factions", "lega-del-sale.md"), "# Lega del Sale");
  writeFileSync(join(dir, "30-factions", "corte-d-ottone.md"), "# Corte d'Ottone");
  writeFileSync(join(dir, "_relations.md"), "# Relazioni\n\n```relations\n" + relations + "\n```\n");
  return dir;
}

describe("collectKnownIds", () => {
  it("raccoglie gli slug delle entità, esclude gli _index", () => {
    const dir = setup("");
    const ids = collectKnownIds(dir);
    expect(ids).toContain("lega-del-sale");
    expect(ids).toContain("corte-d-ottone");
    expect(ids).not.toContain("_index");
  });
});

describe("runLoreCheck", () => {
  it("code 0 su canon pulito", () => {
    const dir = setup("lega-del-sale --ostile--> corte-d-ottone");
    const { code } = runLoreCheck([], { SETTING_PATH: dir });
    expect(code).toBe(0);
  });
  it("code 2 con riferimento pendente", () => {
    const dir = setup("lega-del-sale --ostile--> fantasma");
    const { code, report } = runLoreCheck([], { SETTING_PATH: dir });
    expect(code).toBe(2);
    expect(report.discrepancies.some((d) => d.code === "DANGLING_REF")).toBe(true);
  });
});

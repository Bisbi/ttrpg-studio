import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { applyGeneration } from "../setting/apply-generation.js";

function settingDir() {
  const dir = mkdtempSync(join(tmpdir(), "set-"));
  mkdirSync(join(dir, "30-factions"), { recursive: true });
  writeFileSync(join(dir, "60-timeline.md"), "# Timeline\n");
  writeFileSync(join(dir, "_relations.md"), "# Relazioni\n\n```relations\n```\n");
  return dir;
}

describe("applyGeneration", () => {
  it("scrive la scheda fazione, accoda timeline e fa merge relazioni", () => {
    const settingPath = settingDir();
    const res = applyGeneration({
      settingPath,
      element: {
        kind: "faction",
        name: "Lega del Sale",
        markdown: "# Lega del Sale\n\nFazione mercantile.",
        timelineEntry: "120 EC — fondazione della Lega del Sale",
        edges: [{ source: "lega-del-sale", type: "ostile", target: "corte-d-ottone" }],
      },
    });
    const scheda = join(settingPath, "30-factions", "lega-del-sale.md");
    expect(existsSync(scheda)).toBe(true);
    expect(readFileSync(join(settingPath, "60-timeline.md"), "utf8")).toContain("Lega del Sale");
    expect(readFileSync(join(settingPath, "_relations.md"), "utf8")).toContain("lega-del-sale --ostile--> corte-d-ottone");
    expect(res.actions.length).toBeGreaterThanOrEqual(3);
  });

  it("dryRun non scrive nulla", () => {
    const settingPath = settingDir();
    applyGeneration({
      settingPath, dryRun: true,
      element: { kind: "region", name: "Altopiano", markdown: "# Altopiano" },
    });
    expect(existsSync(join(settingPath, "20-geography", "altopiano.md"))).toBe(false);
  });
});

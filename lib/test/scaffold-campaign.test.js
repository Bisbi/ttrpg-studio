import { describe, it, expect, beforeAll } from "vitest";
import { mkdtempSync, existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { scaffoldCampaign } from "../campaign/scaffold-campaign.js";

// templates/ è alla radice del plugin: da lib/test/ risali di due livelli.
const pluginRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

let dir;
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "camp-"));
  scaffoldCampaign({
    name: "Testlandia", projectDir: dir, referencePath: "C:/ref",
    templatesDir: join(pluginRoot, "templates", "setting-bible"),
    policy: "overwrite", dryRun: false,
  });
});

describe("scaffoldCampaign", () => {
  it("crea le cartelle di output per tipo", () => {
    for (const sub of ["dm-screens", "battle-maps", "handouts", "item-cards", "art", "wiki"])
      expect(existsSync(join(dir, "output", sub))).toBe(true);
    expect(existsSync(join(dir, "adventures"))).toBe(true);
  });
  it("crea il compendio originale con manifest", () => {
    const mf = join(dir, "setting", "compendium", "_manifest.json");
    expect(existsSync(mf)).toBe(true);
    expect(JSON.parse(readFileSync(mf, "utf8")).schema_version).toBe("1.0");
  });
  it("scrive settings.json con GAME_DATA_PATH multi-root e le env di progetto", () => {
    const s = JSON.parse(readFileSync(join(dir, ".claude", "settings.json"), "utf8"));
    expect(s.env.GAME_DATA_PATH).toContain(";");
    expect(s.env.GAME_DATA_PATH).toContain("C:/ref");
    expect(s.env.SETTING_PATH).toContain("setting");
    expect(s.env.OUTPUT_DIR).toContain("output");
    expect(s.env.ADVENTURE_PATH).toContain("adventures");
  });
  it("scaffolda la Setting Bible (00-overview.md)", () => {
    expect(existsSync(join(dir, "setting", "00-overview.md"))).toBe(true);
  });
});

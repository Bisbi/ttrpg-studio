import { describe, it, expect } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildBattleMap } from "../bin/battle-map.js";

function seeded(seed) { let s = seed >>> 0; return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 2 ** 32; }; }

describe("buildBattleMap", () => {
  it("Tier 1: produce svg con griglia, html e outPath", () => {
    const out = mkdtempSync(join(tmpdir(), "out-"));
    const r = buildBattleMap({ tier: 1, cols: 8, rows: 8, name: "Cripta", rng: seeded(3) }, { OUTPUT_DIR: out });
    expect(r.svg).toContain("<svg");
    expect(r.svg).toContain('class="grid"');
    expect(r.html).toContain(".canvas");
    expect(r.outPath).toContain("battle-map-cripta");
    expect(r.outPath.endsWith(".png")).toBe(true);
    expect(r.map.cols).toBe(8);
  });
  it("Tier 2: incapsula un'immagine con la griglia", () => {
    const out = mkdtempSync(join(tmpdir(), "out-"));
    const r = buildBattleMap({ tier: 2, name: "Arena", imageHref: "scena.png", cols: 10, rows: 10 }, { OUTPUT_DIR: out });
    expect(r.svg).toContain("<image");
    expect(r.svg).toContain("scena.png");
    expect(r.svg).toContain('class="grid"');
  });
});

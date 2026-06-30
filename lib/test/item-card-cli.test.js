import { describe, it, expect } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildItemCard } from "../bin/item-card.js";

describe("buildItemCard", () => {
  it("costruisce HTML e outPath dentro OUTPUT_DIR", () => {
    const out = mkdtempSync(join(tmpdir(), "out-"));
    const { html, outPath } = buildItemCard(
      { name: "Tonico di Cenere", rarity: "non comune" },
      { OUTPUT_DIR: out, GAME_DATA_LANG: "it" }
    );
    expect(html).toContain("Tonico di Cenere");
    expect(outPath.startsWith(out)).toBe(true);
    expect(outPath.endsWith(".png")).toBe(true);
    expect(outPath).toContain("tonico-di-cenere");
  });
});

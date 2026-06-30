import { describe, it, expect } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildDmScreen } from "../bin/dm-screen.js";

describe("buildDmScreen", () => {
  it("costruisce HTML e outPath", () => {
    const out = mkdtempSync(join(tmpdir(), "out-"));
    const { html, outPath } = buildDmScreen(
      { adventure: { title: "La Cripta", hooks: ["g1"] }, monsters: [{ name: "Muffa", xp: 100 }] },
      { OUTPUT_DIR: out }
    );
    expect(html).toContain("La Cripta");
    expect(html).toContain("Muffa");
    expect(outPath.startsWith(out)).toBe(true);
    expect(outPath).toContain("dm-screen-la-cripta");
  });
});

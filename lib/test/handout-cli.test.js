import { describe, it, expect } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildHandout } from "../bin/handout.js";

describe("buildHandout", () => {
  it("compone HTML e outPath; non espone segreti da contenuto strutturato", () => {
    const out = mkdtempSync(join(tmpdir(), "out-"));
    const { html, outPath } = buildHandout(
      { kind: "letter", title: "Avviso", content: { testo: "Venite.", secret: "trappola" } },
      { OUTPUT_DIR: out }
    );
    expect(html).toContain("Avviso");
    expect(html).toContain("Venite.");
    expect(html).not.toContain("trappola");
    expect(outPath.startsWith(out)).toBe(true);
    expect(outPath.endsWith(".png")).toBe(true);
  });
});

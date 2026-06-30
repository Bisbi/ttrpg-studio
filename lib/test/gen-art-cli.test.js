import { describe, it, expect } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { planGenArt } from "../bin/gen-art.js";

describe("planGenArt", () => {
  it("sceglie il provider api e un outPath png", () => {
    const out = mkdtempSync(join(tmpdir(), "out-"));
    const p = planGenArt("spada fiammeggiante", { OUTPUT_DIR: out, IMAGE_API_URL: "https://x" });
    expect(p.provider).toBe("api");
    expect(p.outPath.startsWith(out)).toBe(true);
    expect(p.outPath).toContain("art-spada-fiammeggiante");
    expect(p.outPath.endsWith(".png")).toBe(true);
  });
  it("provider null senza env", () => {
    const out = mkdtempSync(join(tmpdir(), "out-"));
    expect(planGenArt("x", { OUTPUT_DIR: out }).provider).toBe(null);
  });
});

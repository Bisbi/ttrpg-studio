import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveOutputPath } from "../common/output.js";

describe("resolveOutputPath", () => {
  it("ritorna il path base se libero", () => {
    const dir = mkdtempSync(join(tmpdir(), "out-"));
    expect(resolveOutputPath(dir, "carta", ".png")).toBe(join(dir, "carta.png"));
  });
  it("aggiunge un suffisso numerico se esiste", () => {
    const dir = mkdtempSync(join(tmpdir(), "out-"));
    writeFileSync(join(dir, "carta.png"), "x");
    expect(resolveOutputPath(dir, "carta", ".png")).toBe(join(dir, "carta-1.png"));
  });
  it("normalizza l'estensione senza punto", () => {
    const dir = mkdtempSync(join(tmpdir(), "out-"));
    expect(resolveOutputPath(dir, "x", "pdf")).toBe(join(dir, "x.pdf"));
  });
});

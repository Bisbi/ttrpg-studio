import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runRoll } from "../bin/roll.js";

function root() {
  const r = mkdtempSync(join(tmpdir(), "root-"));
  const tdir = join(r, "templates", "tables");
  mkdirSync(tdir, { recursive: true });
  writeFileSync(join(tdir, "faction-seed.json"), JSON.stringify({ table: "faction-seed", columns: { movente: ["vendetta", "potere"] } }));
  return r;
}

describe("runRoll", () => {
  it("tira tutte le colonne (rng=0)", () => {
    const r = root();
    const { code, result } = runRoll(["faction-seed"], { CLAUDE_PLUGIN_ROOT: r }, () => 0);
    expect(code).toBe(0);
    expect(result.movente).toBe("vendetta");
  });
  it("tabella inesistente → code 1", () => {
    const r = root();
    const { code } = runRoll(["inesistente"], { CLAUDE_PLUGIN_ROOT: r }, () => 0);
    expect(code).toBe(1);
  });
});

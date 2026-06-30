import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderOnePager, runSessionPrep } from "../bin/session-prep.js";

describe("renderOnePager", () => {
  it("produce markdown con le sezioni chiave", () => {
    const md = renderOnePager({
      strongStart: "Apertura.", scenes: ["A", "B"], readyMonsters: [{ id: "m", role: "r" }],
      backupNpcNames: ["Vera"], complications: ["crollo"], loot: { items: [], nonItem: ["favore"] },
    }, "La Cripta");
    expect(md).toContain("# La Cripta — Session Prep");
    expect(md).toContain("Apertura.");
    expect(md).toContain("Vera");
  });
});

describe("runSessionPrep", () => {
  it("scrive session-prep.md accanto all'avventura", () => {
    const adventurePath = mkdtempSync(join(tmpdir(), "ap-"));
    const advDir = join(adventurePath, "la-cripta");
    mkdirSync(advDir, { recursive: true });
    writeFileSync(join(advDir, "adventure.json"), JSON.stringify({
      title: "La Cripta", strong_start: "Apertura.", fantastic_locations: [],
      npcs: [], monsters: [], consequences: [], hooks: [], reward_loot: { items: [], nonItem: [] },
    }));
    const { code } = runSessionPrep(["la-cripta"], { ADVENTURE_PATH: adventurePath });
    expect(code).toBe(0);
    expect(existsSync(join(advDir, "session-prep.md"))).toBe(true);
    expect(readFileSync(join(advDir, "session-prep.md"), "utf8")).toContain("Session Prep");
  });
});

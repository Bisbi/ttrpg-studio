import { describe, it, expect, beforeAll } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { validateConfig } from "../lib/config.js";
import { CompendiumStore } from "../lib/store.js";

function writeCompendium(dir, records) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "_manifest.json"),
    JSON.stringify({ schema_version: "1.0", files: { "monsters.json": "monster" } }));
  writeFileSync(join(dir, "monsters.json"),
    JSON.stringify({ schema_version: "1.0", records }));
}

const silent = { debug(){}, info(){}, warn(){}, error(){} };
let rootA, rootB;

beforeAll(() => {
  const base = mkdtempSync(join(tmpdir(), "compendium-"));
  rootA = join(base, "ref");
  rootB = join(base, "orig");
  writeCompendium(rootA, [{ id: "goblin-xmm", name: { en: "Goblin" }, source: "XMM", cr: "1/4", hp: 7, ac: 15 }]);
  writeCompendium(rootB, [{ id: "gober-duelune", name: { it: "Gober" }, source: "Duelune", cr: "1/2", hp: 10, ac: 12 }]);
});

describe("reader multi-root", () => {
  it("validateConfig accetta lista ;-separata", () => {
    const cfg = validateConfig({ GAME_DATA_PATH: `${rootA};${rootB}`, GAME_DATA_LANG: "it" });
    expect(cfg.dataPaths).toEqual([rootA, rootB]);
  });

  it("un solo percorso resta retrocompatibile", () => {
    const cfg = validateConfig({ GAME_DATA_PATH: rootA });
    expect(cfg.dataPaths).toEqual([rootA]);
  });

  it("fonde i mostri di entrambi i root", () => {
    const cfg = validateConfig({ GAME_DATA_PATH: `${rootA};${rootB}` });
    const store = new CompendiumStore({ ...cfg, logger: silent });
    store.load();
    const ids = store.allOfType("monster").map((r) => r.id).sort();
    expect(ids).toEqual(["gober-duelune", "goblin-xmm"]);
  });
});

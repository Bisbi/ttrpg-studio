import { describe, it, expect } from "vitest";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CompendiumStore } from "../lib/store.js";

const dataPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "examples", "compendium-homebrew");
const logger = { debug(){}, info(){}, warn(){}, error(){} };

describe("CompendiumStore", () => {
  it("carica i tipi dal manifest", () => {
    const s = new CompendiumStore({ dataPath, lang: "it", logger });
    s.load();
    expect(s.getTypes().sort()).toEqual(["item", "monster", "spell"]);
  });
  it("indicizza i record per id", () => {
    const s = new CompendiumStore({ dataPath, lang: "it", logger });
    s.load();
    const monsters = s.allOfType("monster");
    expect(monsters.length).toBe(2);
    expect(monsters.find(m => m.id === "guardiano-ottone-homebrew")).toBeTruthy();
  });
});

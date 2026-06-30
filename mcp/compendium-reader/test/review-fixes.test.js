import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CompendiumStore } from "../lib/store.js";
import { buildServer } from "../index.js";

const examples = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "examples", "compendium-homebrew");
const logger = { debug(){}, info(){}, warn(){}, error(){} };

function writeFile(dir, name, type, records) {
  writeFileSync(join(dir, name), JSON.stringify({ schema_version: "1.0", records }));
  return type;
}

describe("read_file (fix review)", () => {
  it("risolve il tipo dal manifest e proietta i campi", async () => {
    const { handlers } = buildServer({ GAME_DATA_PATH: examples, GAME_DATA_LANG: "it" });
    const res = await handlers.read_file({ file: "monsters.json", fields: ["id", "hp"] });
    expect(res.results.length).toBe(2);
    expect(Object.keys(res.results[0]).sort()).toEqual(["hp", "id"]);
  });

  it("ritorna i record grezzi senza fields", async () => {
    const { handlers } = buildServer({ GAME_DATA_PATH: examples, GAME_DATA_LANG: "it" });
    const res = await handlers.read_file({ file: "items.json" });
    expect(res.results[0].source).toBe("HomebrewExample");
  });

  it("file non riconosciuto → handler propaga ToolError NOT_FOUND", async () => {
    const { handlers } = buildServer({ GAME_DATA_PATH: examples, GAME_DATA_LANG: "it" });
    await expect(handlers.read_file({ file: "classes.json" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("reloadIfStale (fix review): rileva file aggiunti", () => {
  it("ricarica quando un nuovo file compare nella cartella", () => {
    const dir = mkdtempSync(join(tmpdir(), "cr-reload-"));
    writeFile(dir, "monsters.json", "monster", [
      { id: "m1-homebrew", name: "M1", source: "HomebrewExample", cr: "1", hp: 10, ac: 12 },
    ]);
    const s = new CompendiumStore({ dataPath: dir, lang: "it", logger });
    s.load();
    expect(s.getTypes()).toEqual(["monster"]);
    // Nuovo file riconosciuto dalla mappa di default.
    writeFile(dir, "spells.json", "spell", [
      { id: "s1-homebrew", name: "S1", source: "HomebrewExample", level: 1 },
    ]);
    expect(s.reloadIfStale()).toBe(true);
    expect(s.getTypes().sort()).toEqual(["monster", "spell"]);
    rmSync(dir, { recursive: true, force: true });
  });
});

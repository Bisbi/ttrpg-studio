import { describe, it, expect } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateAdventureConfig } from "../common/config.js";

describe("validateAdventureConfig", () => {
  it("ritorna adventurePath e lang con env valida", () => {
    const dir = mkdtempSync(join(tmpdir(), "adv-"));
    const cfg = validateAdventureConfig({ ADVENTURE_PATH: dir, GAME_DATA_LANG: "en" });
    expect(cfg.adventurePath).toBe(dir);
    expect(cfg.lang).toBe("en");
  });
  it("default lang = it", () => {
    const dir = mkdtempSync(join(tmpdir(), "adv-"));
    expect(validateAdventureConfig({ ADVENTURE_PATH: dir }).lang).toBe("it");
  });
  it("errore se ADVENTURE_PATH manca", () => {
    expect(() => validateAdventureConfig({})).toThrow(/ADVENTURE_PATH/);
  });
  it("errore se la cartella non esiste", () => {
    expect(() => validateAdventureConfig({ ADVENTURE_PATH: "/no/such/xyz" })).toThrow(/non esiste|not found/i);
  });
});

import { describe, it, expect } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateConfig } from "../lib/config.js";

describe("validateConfig", () => {
  it("ritorna dataPaths e lang con env valida", () => {
    const dir = mkdtempSync(join(tmpdir(), "cr-"));
    const cfg = validateConfig({ GAME_DATA_PATH: dir, GAME_DATA_LANG: "en" });
    expect(cfg.dataPaths).toEqual([dir]);
    expect(cfg.lang).toBe("en");
  });

  it("default lang = it quando assente", () => {
    const dir = mkdtempSync(join(tmpdir(), "cr-"));
    expect(validateConfig({ GAME_DATA_PATH: dir }).lang).toBe("it");
  });

  it("errore azionabile se GAME_DATA_PATH manca", () => {
    expect(() => validateConfig({})).toThrow(/GAME_DATA_PATH/);
  });

  it("errore se la cartella non esiste", () => {
    expect(() => validateConfig({ GAME_DATA_PATH: "/no/such/dir/xyz" }))
      .toThrow(/non esiste|not found/i);
  });

  it("errore se lang non valida", () => {
    const dir = mkdtempSync(join(tmpdir(), "cr-"));
    expect(() => validateConfig({ GAME_DATA_PATH: dir, GAME_DATA_LANG: "fr" }))
      .toThrow(/it.*en|lang/i);
  });
});

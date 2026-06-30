import { describe, it, expect } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateSettingConfig } from "../common/config.js";

describe("validateSettingConfig", () => {
  it("ritorna settingPath e lang con env valida", () => {
    const dir = mkdtempSync(join(tmpdir(), "set-"));
    const cfg = validateSettingConfig({ SETTING_PATH: dir, GAME_DATA_LANG: "en" });
    expect(cfg.settingPath).toBe(dir);
    expect(cfg.lang).toBe("en");
  });
  it("default lang = it", () => {
    const dir = mkdtempSync(join(tmpdir(), "set-"));
    expect(validateSettingConfig({ SETTING_PATH: dir }).lang).toBe("it");
  });
  it("errore se SETTING_PATH manca", () => {
    expect(() => validateSettingConfig({})).toThrow(/SETTING_PATH/);
  });
  it("errore se la cartella non esiste", () => {
    expect(() => validateSettingConfig({ SETTING_PATH: "/no/such/xyz" })).toThrow(/non esiste|not found/i);
  });
  it("errore se lang non valida", () => {
    const dir = mkdtempSync(join(tmpdir(), "set-"));
    expect(() => validateSettingConfig({ SETTING_PATH: dir, GAME_DATA_LANG: "fr" })).toThrow(/it.*en|lang/i);
  });
});

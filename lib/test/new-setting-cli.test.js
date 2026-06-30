import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runNewSetting } from "../bin/new-setting.js";

function fakeRoot() {
  const root = mkdtempSync(join(tmpdir(), "root-"));
  const tpl = join(root, "templates", "setting-bible");
  mkdirSync(tpl, { recursive: true });
  writeFileSync(join(tpl, "_index.md"), "# {{SETTING_NAME}}");
  return root;
}

describe("runNewSetting", () => {
  it("scaffolda nella SETTING_PATH", () => {
    const root = fakeRoot();
    const settingPath = join(mkdtempSync(join(tmpdir(), "sp-")), "setting");
    mkdirSync(settingPath, { recursive: true });
    const { code } = runNewSetting(["Cenere"], {
      SETTING_PATH: settingPath, CLAUDE_PLUGIN_ROOT: root,
    });
    expect(code).toBe(0);
    expect(existsSync(join(settingPath, "_index.md"))).toBe(true);
  });

  it("non scambia il valore di --policy con il nome", () => {
    const root = fakeRoot();
    const settingPath = join(mkdtempSync(join(tmpdir(), "sp-")), "setting");
    mkdirSync(settingPath, { recursive: true });
    const { code } = runNewSetting(["--policy", "skip", "Mondo"], {
      SETTING_PATH: settingPath, CLAUDE_PLUGIN_ROOT: root,
    });
    expect(code).toBe(0);
    // il nome è "Mondo", non "skip": il template _index.md contiene il nome
    expect(readFileSync(join(settingPath, "_index.md"), "utf8")).toContain("Mondo");
  });

  it("ritorna code 1 senza nome", () => {
    const root = fakeRoot();
    const settingPath = mkdtempSync(join(tmpdir(), "sp-"));
    const { code } = runNewSetting([], { SETTING_PATH: settingPath, CLAUDE_PLUGIN_ROOT: root });
    expect(code).toBe(1);
  });
});

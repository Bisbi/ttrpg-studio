import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
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

  it("ritorna code 1 senza nome", () => {
    const root = fakeRoot();
    const settingPath = mkdtempSync(join(tmpdir(), "sp-"));
    const { code } = runNewSetting([], { SETTING_PATH: settingPath, CLAUDE_PLUGIN_ROOT: root });
    expect(code).toBe(1);
  });
});

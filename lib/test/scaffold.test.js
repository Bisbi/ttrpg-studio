import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scaffoldSetting } from "../setting/scaffold.js";

function fakeTemplates() {
  const dir = mkdtempSync(join(tmpdir(), "tpl-"));
  writeFileSync(join(dir, "_index.md"), "# {{SETTING_NAME}} — Bible");
  mkdirSync(join(dir, "30-factions"));
  writeFileSync(join(dir, "30-factions", "_index.md"), "# Fazioni");
  return dir;
}

describe("scaffoldSetting", () => {
  it("crea l'albero sostituendo il nome", () => {
    const templatesDir = fakeTemplates();
    const destDir = join(mkdtempSync(join(tmpdir(), "dst-")), "setting");
    const res = scaffoldSetting({ name: "Cenere", destDir, templatesDir });
    expect(existsSync(join(destDir, "_index.md"))).toBe(true);
    expect(readFileSync(join(destDir, "_index.md"), "utf8")).toContain("Cenere — Bible");
    expect(existsSync(join(destDir, "30-factions", "_index.md"))).toBe(true);
    expect(res.created.length).toBe(2);
  });

  it("dryRun non scrive nulla", () => {
    const templatesDir = fakeTemplates();
    const destDir = join(mkdtempSync(join(tmpdir(), "dst-")), "setting");
    const res = scaffoldSetting({ name: "X", destDir, templatesDir, dryRun: true });
    expect(existsSync(destDir)).toBe(false);
    expect(res.actions.every((a) => a.action === "created")).toBe(true);
  });

  it("policy error: fallisce se un file esiste già", () => {
    const templatesDir = fakeTemplates();
    const destDir = join(mkdtempSync(join(tmpdir(), "dst-")), "setting");
    scaffoldSetting({ name: "X", destDir, templatesDir });
    expect(() => scaffoldSetting({ name: "X", destDir, templatesDir, policy: "error" })).toThrow();
  });
});

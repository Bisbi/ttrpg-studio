import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runNewAdventure } from "../bin/new-adventure.js";

function fakeRoot() {
  const root = mkdtempSync(join(tmpdir(), "root-"));
  const tpl = join(root, "templates", "adventure");
  mkdirSync(tpl, { recursive: true });
  writeFileSync(join(tpl, "adventure.template.json"), '{ "title": "{{TITLE}}", "slug": "{{SLUG}}" }');
  writeFileSync(join(tpl, "adventure.template.md"), "# {{TITLE}}");
  return root;
}

describe("runNewAdventure", () => {
  it("scaffolda nella ADVENTURE_PATH", () => {
    const root = fakeRoot();
    const adventurePath = mkdtempSync(join(tmpdir(), "ap-"));
    const { code } = runNewAdventure(["La Cripta"], { ADVENTURE_PATH: adventurePath, CLAUDE_PLUGIN_ROOT: root });
    expect(code).toBe(0);
    expect(existsSync(join(adventurePath, "la-cripta", "adventure.json"))).toBe(true);
  });
  it("code 1 senza titolo", () => {
    const root = fakeRoot();
    const adventurePath = mkdtempSync(join(tmpdir(), "ap-"));
    expect(runNewAdventure([], { ADVENTURE_PATH: adventurePath, CLAUDE_PLUGIN_ROOT: root }).code).toBe(1);
  });
});

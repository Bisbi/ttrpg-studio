import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scaffoldAdventure } from "../adventure/scaffold.js";

function fakeTemplates() {
  const dir = mkdtempSync(join(tmpdir(), "advtpl-"));
  writeFileSync(join(dir, "adventure.template.json"), '{ "title": "{{TITLE}}", "slug": "{{SLUG}}" }');
  writeFileSync(join(dir, "adventure.template.md"), "# {{TITLE}}");
  return dir;
}

describe("scaffoldAdventure", () => {
  it("crea la cartella avventura con json e md", () => {
    const templatesDir = fakeTemplates();
    const destDir = mkdtempSync(join(tmpdir(), "adv-"));
    const res = scaffoldAdventure({ title: "La Cripta di Sale", destDir, templatesDir });
    expect(res.slug).toBe("la-cripta-di-sale");
    const jsonPath = join(destDir, "la-cripta-di-sale", "adventure.json");
    expect(existsSync(jsonPath)).toBe(true);
    expect(readFileSync(jsonPath, "utf8")).toContain('"title": "La Cripta di Sale"');
    expect(readFileSync(jsonPath, "utf8")).toContain('"slug": "la-cripta-di-sale"');
    expect(existsSync(join(destDir, "la-cripta-di-sale", "adventure.md"))).toBe(true);
  });

  it("dryRun non scrive nulla", () => {
    const templatesDir = fakeTemplates();
    const destDir = mkdtempSync(join(tmpdir(), "adv-"));
    scaffoldAdventure({ title: "X", destDir, templatesDir, dryRun: true });
    expect(existsSync(join(destDir, "x", "adventure.json"))).toBe(false);
  });
});

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SCHEMAS, SCHEMA_VERSION } from "../schema/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "examples", "compendium-homebrew");
const manifest = JSON.parse(readFileSync(join(root, "_manifest.json"), "utf8"));

describe("dataset homebrew d'esempio", () => {
  for (const [file, type] of Object.entries(manifest.files)) {
    it(`${file} valida contro lo schema ${type}`, () => {
      const data = JSON.parse(readFileSync(join(root, file), "utf8"));
      expect(data.schema_version).toBe(SCHEMA_VERSION);
      for (const rec of data.records) {
        expect(rec.source).toBe("HomebrewExample");
        expect(() => SCHEMAS[type].parse(rec)).not.toThrow();
      }
    });
  }
});

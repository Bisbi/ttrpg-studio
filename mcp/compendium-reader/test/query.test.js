import { describe, it, expect, beforeAll } from "vitest";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CompendiumStore } from "../lib/store.js";
import { CompendiumQuery } from "../lib/query.js";
import { ToolError } from "../lib/errors.js";

const dataPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "examples", "compendium-homebrew");
const logger = { debug(){}, info(){}, warn(){}, error(){} };
let q;
beforeAll(() => {
  const s = new CompendiumStore({ dataPath, lang: "it", logger });
  s.load();
  q = new CompendiumQuery(s);
});

describe("get", () => {
  it("trova per id", () => {
    expect(q.get("monster", "guardiano-ottone-homebrew", { lang: "it" }).hp).toBe(45);
  });
  it("trova per nome localizzato (it)", () => {
    expect(q.get("monster", "Muffa Cantante", { lang: "it" }).id).toBe("muffa-cantante-homebrew");
  });
  it("NOT_FOUND se assente", () => {
    expect(() => q.get("monster", "Drago", { lang: "it" })).toThrow(ToolError);
  });
  it("proietta solo i campi richiesti", () => {
    const r = q.get("monster", "guardiano-ottone-homebrew", { lang: "it", fields: ["id", "hp"] });
    expect(Object.keys(r).sort()).toEqual(["hp", "id"]);
  });
});

describe("list", () => {
  it("pagina con limit e cursor", () => {
    const p1 = q.list("monster", { limit: 1 });
    expect(p1.results.length).toBe(1);
    expect(p1.total).toBe(2);
    const p2 = q.list("monster", { limit: 1, cursor: p1.cursor });
    expect(p2.results[0].id).not.toBe(p1.results[0].id);
  });
});

describe("search", () => {
  it("trova per testo nel nome", () => {
    const r = q.search("cantante", { lang: "it" });
    expect(r.results.some(x => x.id === "muffa-cantante-homebrew")).toBe(true);
  });
});

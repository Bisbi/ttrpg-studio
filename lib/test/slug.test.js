import { describe, it, expect } from "vitest";
import { slugify } from "../common/slug.js";

describe("slugify", () => {
  it("minuscolo con trattini", () => {
    expect(slugify("Lega del Sale")).toBe("lega-del-sale");
  });
  it("rimuove accenti", () => {
    expect(slugify("Città di Cenere")).toBe("citta-di-cenere");
  });
  it("collassa separatori e bordi", () => {
    expect(slugify("  --A__B--  ")).toBe("a-b");
  });
  it("idempotente", () => {
    const s = slugify("Régno d'Ottone!");
    expect(slugify(s)).toBe(s);
  });
});

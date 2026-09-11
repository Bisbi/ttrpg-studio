import { describe, it, expect } from "vitest";
import { parseWikiArgs } from "../wiki/cli-args.js";

describe("parseWikiArgs", () => {
  it("riconosce il comando", () => {
    expect(parseWikiArgs(["validate"]).command).toBe("validate");
  });

  it("default: entrambe le directory", () => {
    expect(parseWikiArgs(["all"]).dirs).toEqual(["wiki", "local/wiki"]);
  });

  it("--dir sostituisce le directory di default", () => {
    expect(parseWikiArgs(["all", "--dir", "wiki"]).dirs).toEqual(["wiki"]);
  });

  it("--dir ripetuto accumula", () => {
    expect(parseWikiArgs(["all", "--dir", "a", "--dir", "b"]).dirs).toEqual(["a", "b"]);
  });

  it("--json attiva l'uscita machine-readable", () => {
    expect(parseWikiArgs(["stale", "--json"]).json).toBe(true);
  });

  it("comando sconosciuto da command null", () => {
    expect(parseWikiArgs(["frobnicate"]).command).toBe(null);
  });

  it("nessun argomento da command null", () => {
    expect(parseWikiArgs([]).command).toBe(null);
  });
});

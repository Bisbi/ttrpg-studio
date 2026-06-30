import { describe, it, expect } from "vitest";
import { localizeField } from "../common/localize.js";

describe("localizeField", () => {
  it("stringa passthrough", () => {
    expect(localizeField("Spada", "it")).toBe("Spada");
  });
  it("sceglie la lingua", () => {
    expect(localizeField({ it: "Spada", en: "Sword" }, "en")).toBe("Sword");
  });
  it("fallback en quando manca la lingua", () => {
    expect(localizeField({ en: "Sword" }, "it")).toBe("Sword");
  });
  it("valore assente → stringa vuota", () => {
    expect(localizeField(undefined, "it")).toBe("");
  });
});

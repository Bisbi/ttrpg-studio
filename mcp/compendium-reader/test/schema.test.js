import { describe, it, expect } from "vitest";
import { localize, BaseRecord, EntryNode } from "../schema/common.js";
import { SCHEMAS, SCHEMA_VERSION } from "../schema/index.js";

describe("localize", () => {
  it("ritorna la stringa così com'è", () => {
    expect(localize("Goblin", "it")).toBe("Goblin");
  });
  it("sceglie la lingua richiesta", () => {
    expect(localize({ it: "Folletto", en: "Goblin" }, "it")).toBe("Folletto");
  });
  it("fallback it→en quando manca la lingua", () => {
    expect(localize({ en: "Goblin" }, "it")).toBe("Goblin");
  });
});

describe("schema", () => {
  it("SCHEMA_VERSION è 1.0", () => {
    expect(SCHEMA_VERSION).toBe("1.0");
  });
  it("valida un mostro minimale", () => {
    const r = SCHEMAS.monster.parse({
      id: "goblin-homebrew", name: "Goblin", source: "HomebrewExample",
      cr: "1/4", hp: 7, ac: 15,
    });
    expect(r.id).toBe("goblin-homebrew");
  });
  it("EntryNode accetta un nodo testo annidato", () => {
    expect(() => EntryNode.parse({ type: "text", text: "ciao" })).not.toThrow();
  });
  it("rifiuta un record senza id", () => {
    expect(() => SCHEMAS.spell.parse({ name: "X", source: "HomebrewExample" })).toThrow();
  });
});

import { describe, it, expect } from "vitest";
import { cardModel } from "../item-card/model.js";

describe("cardModel", () => {
  it("mappa una voce di loot localizzata", () => {
    const m = cardModel({
      name: { it: "Tonico di Cenere", en: "Ash Tonic" },
      rarity: "non comune", attunement: false,
      desc: { it: "Cura con retrogusto di fumo.", en: "Heals." },
    }, "it");
    expect(m.name).toBe("Tonico di Cenere");
    expect(m.rarity).toBe("non comune");
    expect(m.attunement).toBe(false);
    expect(m.description).toBe("Cura con retrogusto di fumo.");
  });
  it("attunement booleano e image opzionale", () => {
    const m = cardModel({ name: "X", attunement: true });
    expect(m.attunement).toBe(true);
    expect(m.image).toBe(null);
  });
});

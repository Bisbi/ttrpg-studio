import { describe, it, expect } from "vitest";
import { validateAdventure } from "../adventure/validate.js";

function validDoc() {
  return {
    title: "La Cripta di Sale",
    strong_start: "Il pavimento cede e il gruppo precipita in una cripta allagata.",
    secrets_and_clues: Array.from({ length: 8 }, (_, i) => `Segreto ${i + 1}`),
    fantastic_locations: [
      { name: "Sala A", sensory: ["sale scricchiola", "odore di iodio", "luce verde"] },
      { name: "Sala B", sensory: ["eco lontana", "aria fredda", "muschio umido"] },
      { name: "Sala C", sensory: ["acqua nera", "gocciolio", "riflessi"] },
    ],
    npcs: [{ name: "Vera", role: "guida", voice: "sussurra", wants: "fuggire", secret: "è una spia" }],
    monsters: [{ id: "muffa-cantante-homebrew", role: "imboscata" }],
    encounters: [{ name: "Agguato", monsters: ["muffa-cantante-homebrew"] }],
    hooks: ["Un debito", "Una mappa", "Una sparizione"],
    consequences: [{ ifPcs: "liberano la muffa", then: "il porto si ammala" }],
    reward_loot: { items: [], nonItem: [] },
  };
}

describe("validateAdventure", () => {
  it("documento valido → ok", () => {
    const r = validateAdventure(validDoc());
    expect(r.ok).toBe(true);
    expect(r.issues).toEqual([]);
  });
  it("meno di 8 segreti → TOO_FEW_SECRETS", () => {
    const doc = validDoc(); doc.secrets_and_clues = ["uno"];
    const r = validateAdventure(doc);
    expect(r.ok).toBe(false);
    expect(r.issues.some((i) => i.code === "TOO_FEW_SECRETS")).toBe(true);
  });
  it("luoghi fuori range → LOCATIONS_OUT_OF_RANGE", () => {
    const doc = validDoc(); doc.fantastic_locations = [doc.fantastic_locations[0]];
    expect(validateAdventure(doc).issues.some((i) => i.code === "LOCATIONS_OUT_OF_RANGE")).toBe(true);
  });
  it("luogo con <3 dettagli sensoriali → LOCATION_SENSORY", () => {
    const doc = validDoc(); doc.fantastic_locations[0].sensory = ["solo uno"];
    expect(validateAdventure(doc).issues.some((i) => i.code === "LOCATION_SENSORY")).toBe(true);
  });
  it("PNG senza campo obbligatorio → NPC_FIELD", () => {
    const doc = validDoc(); delete doc.npcs[0].secret;
    expect(validateAdventure(doc).issues.some((i) => i.code === "NPC_FIELD")).toBe(true);
  });
  it("campo top-level mancante → MISSING_FIELD", () => {
    const doc = validDoc(); delete doc.strong_start;
    expect(validateAdventure(doc).issues.some((i) => i.code === "MISSING_FIELD")).toBe(true);
  });
});

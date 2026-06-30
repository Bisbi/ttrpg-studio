import { describe, it, expect } from "vitest";
import { extractOnePager } from "../session-prep/extract.js";

const doc = {
  strong_start: "Il pavimento cede.",
  fantastic_locations: [
    { name: "Sala A", sensory: ["a", "b", "c"] },
    { name: "Sala B", sensory: ["a", "b", "c"] },
    { name: "Sala C", sensory: ["a", "b", "c"] },
    { name: "Sala D", sensory: ["a", "b", "c"] },
  ],
  monsters: [{ id: "m1", role: "agguato" }],
  npcs: [
    { name: "Vera", role: "guida", voice: "x", wants: "y", secret: "z" },
    { name: "Olmo", role: "oste", voice: "x", wants: "y", secret: "z" },
  ],
  consequences: [{ ifPcs: "X", then: "il porto si ammala" }],
  hooks: ["gancio1", "gancio2", "gancio3", "gancio4"],
  reward_loot: { items: [], nonItem: ["un favore"] },
};

describe("extractOnePager", () => {
  it("estrae i campi chiave, max 3 scene", () => {
    const op = extractOnePager(doc);
    expect(op.strongStart).toBe("Il pavimento cede.");
    expect(op.scenes).toEqual(["Sala A", "Sala B", "Sala C"]);
    expect(op.readyMonsters).toEqual([{ id: "m1", role: "agguato" }]);
    expect(op.backupNpcNames).toEqual(["Vera", "Olmo"]);
    expect(op.complications).toEqual(["il porto si ammala"]);
    expect(op.loot.nonItem).toEqual(["un favore"]);
  });
  it("non espone i segreti dei PNG né secrets_and_clues", () => {
    const op = extractOnePager(doc);
    const json = JSON.stringify(op);
    expect(json).not.toContain("secret");
    expect(json).not.toContain('"z"');
  });
});

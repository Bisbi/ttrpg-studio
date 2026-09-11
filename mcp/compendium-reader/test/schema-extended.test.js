import { describe, it, expect } from "vitest";
import {
  SpeciesRecord, BackgroundRecord, FeatRecord, ClassRecord,
  ConditionRecord, DeityRecord, NpcRecord, PcRecord,
} from "../schema/types.js";
import { SCHEMAS, DEFAULT_FILE_TYPE } from "../schema/index.js";

describe("nuovi record schema (T2 + originali)", () => {
  it("BackgroundRecord accetta un background 2024 con talento e ASI", () => {
    const r = BackgroundRecord.safeParse({
      id: "sage-tbk", name: { en: "Sage" }, source: "TBK",
      originFeat: "Magic Initiate", abilityScores: ["INT", "CON", "WIS"],
      skills: ["Arcana", "History"], entries: [{ type: "text", text: "..." }],
    });
    expect(r.success).toBe(true);
  });

  it("PcRecord richiede specie/classe per la conformità 2024", () => {
    const ok = PcRecord.safeParse({
      id: "lyriane-l1", name: { it: "Lyriane" }, source: "Duelune",
      species: "Elfo d'oro", clazz: "Bardo", level: 1, background: "Ciarlatano",
    });
    expect(ok.success).toBe(true);
    const bad = PcRecord.safeParse({ id: "x", name: "x", source: "Duelune" });
    expect(bad.success).toBe(false); // manca species/clazz
  });

  it("DeityRecord valido e minimale", () => {
    const r = DeityRecord.safeParse({
      id: "naira", name: { it: "Nàira" }, source: "Duelune", domain: "Luna Piena",
    });
    expect(r.success).toBe(true);
  });

  it("SpeciesRecord / FeatRecord / ClassRecord / ConditionRecord / NpcRecord validano", () => {
    expect(SpeciesRecord.safeParse({ id: "elf", name: { en: "Elf" }, source: "TBK", size: "M", speed: 30 }).success).toBe(true);
    expect(FeatRecord.safeParse({ id: "alert", name: { en: "Alert" }, source: "TBK", category: "origin" }).success).toBe(true);
    expect(ClassRecord.safeParse({ id: "bard", name: { en: "Bard" }, source: "TBK", hitDie: 8 }).success).toBe(true);
    expect(ConditionRecord.safeParse({ id: "prone", name: { en: "Prone" }, source: "TBK" }).success).toBe(true);
    expect(NpcRecord.safeParse({ id: "nysha", name: { it: "Ny'sha" }, source: "Duelune", role: "esule" }).success).toBe(true);
  });

  it("SCHEMAS e DEFAULT_FILE_TYPE includono i nuovi tipi", () => {
    for (const t of ["species","background","feat","class","condition","deity","npc","pc"]) {
      expect(SCHEMAS[t]).toBeTruthy();
    }
    expect(DEFAULT_FILE_TYPE["backgrounds.json"]).toBe("background");
    expect(DEFAULT_FILE_TYPE["deities.json"]).toBe("deity");
    expect(DEFAULT_FILE_TYPE["pcs.json"]).toBe("pc");
  });
});

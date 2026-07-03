import { z } from "zod";
import { BaseRecord, LocalizableString } from "./common.js";

export const MonsterRecord = BaseRecord.extend({
  cr: z.union([z.string(), z.number()]),
  hp: z.number(),
  ac: z.number(),
  type: z.string().optional(),
});

export const SpellRecord = BaseRecord.extend({
  level: z.number().int().min(0).max(9),
  school: z.string().optional(),
});

export const ItemRecord = BaseRecord.extend({
  rarity: z.string().optional(),
  attunement: z.boolean().optional(),
  desc: LocalizableString.optional(),
});

// --- Tipi T2 (dati per i PG 2024) + tipi del compendio originale ---

export const SpeciesRecord = BaseRecord.extend({
  size: z.string().optional(),
  speed: z.union([z.number(), z.string()]).optional(),
});

export const BackgroundRecord = BaseRecord.extend({
  originFeat: z.string().optional(),
  abilityScores: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
});

export const FeatRecord = BaseRecord.extend({
  category: z.string().optional(),        // origin, general, fighting-style, epic-boon
  prerequisite: z.string().optional(),
});

export const ClassRecord = BaseRecord.extend({
  hitDie: z.union([z.number(), z.string()]).optional(),
  subclass: z.string().optional(),
});

export const ConditionRecord = BaseRecord.extend({});

export const DeityRecord = BaseRecord.extend({
  domain: z.string().optional(),
  alignment: z.string().optional(),
});

export const NpcRecord = BaseRecord.extend({
  role: z.string().optional(),
  cr: z.union([z.string(), z.number()]).optional(),
  hp: z.number().optional(),
  ac: z.number().optional(),
});

export const PcRecord = BaseRecord.extend({
  species: z.string(),
  clazz: z.string(),
  subclass: z.string().optional(),
  level: z.number().int().min(1).max(20).optional(),
  background: z.string().optional(),
  originFeat: z.string().optional(),
  conforms2024: z.boolean().optional(),
});

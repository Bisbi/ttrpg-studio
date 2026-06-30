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

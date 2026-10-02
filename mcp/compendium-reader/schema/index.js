import {
  MonsterRecord, SpellRecord, ItemRecord,
  SpeciesRecord, BackgroundRecord, FeatRecord, ClassRecord,
  ConditionRecord, DeityRecord, NpcRecord, PcRecord,
} from "./types.js";

export const SCHEMA_VERSION = "1.0";

export const SCHEMAS = {
  monster: MonsterRecord,
  spell: SpellRecord,
  item: ItemRecord,
  species: SpeciesRecord,
  background: BackgroundRecord,
  feat: FeatRecord,
  class: ClassRecord,
  condition: ConditionRecord,
  deity: DeityRecord,
  npc: NpcRecord,
  pc: PcRecord,
};

// Mappa file → tipo (default; sovrascrivibile da _manifest.json).
export const DEFAULT_FILE_TYPE = {
  "monsters.json": "monster",
  "spells.json": "spell",
  "items.json": "item",
  "species.json": "species",
  "backgrounds.json": "background",
  "feats.json": "feat",
  "classes.json": "class",
  "conditions.json": "condition",
  "deities.json": "deity",
  "npcs.json": "npc",
  "pcs.json": "pc",
};

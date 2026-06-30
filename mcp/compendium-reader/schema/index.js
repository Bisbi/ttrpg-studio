import { MonsterRecord, SpellRecord, ItemRecord } from "./types.js";

export const SCHEMA_VERSION = "1.0";

export const SCHEMAS = {
  monster: MonsterRecord,
  spell: SpellRecord,
  item: ItemRecord,
};

// Mappa file → tipo (default; sovrascrivibile da _manifest.json nel Task 9).
export const DEFAULT_FILE_TYPE = {
  "monsters.json": "monster",
  "spells.json": "spell",
  "items.json": "item",
};

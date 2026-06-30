import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ENTITY_DIRS = [
  "20-geography",
  "30-factions",
  join("30-factions", "_npcs"),
  "40-pantheon",
  "70-bestiary-custom",
];

export function collectKnownIds(settingPath) {
  const ids = [];
  for (const sub of ENTITY_DIRS) {
    const dir = join(settingPath, sub);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".md")) continue;
      if (f.startsWith("_")) continue; // _index.md ed entry tecniche
      ids.push(f.replace(/\.md$/, ""));
    }
  }
  return ids;
}

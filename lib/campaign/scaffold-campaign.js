import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { scaffoldSetting } from "../setting/scaffold.js";
import { writeFileSafe } from "../common/fs-atomic.js";

const OUTPUT_SUBS = ["dm-screens", "battle-maps", "handouts", "item-cards", "art", "wiki"];

const COMPENDIUM_MANIFEST = {
  schema_version: "1.0",
  files: {
    "monsters.json": "monster", "npcs.json": "npc", "deities.json": "deity",
    "items.json": "item", "pcs.json": "pc",
  },
};

export function scaffoldCampaign({ name, projectDir, referencePath, templatesDir, policy = "error", dryRun = false }) {
  const actions = [];
  const settingDir = join(projectDir, "setting");

  // 1. Setting Bible (riuso dello scaffold esistente)
  const bible = scaffoldSetting({ name, destDir: settingDir, templatesDir, policy, dryRun });
  actions.push(...bible.actions);

  // 2. Compendio ORIGINALE della campagna
  const compendiumDir = join(settingDir, "compendium");
  if (!dryRun) mkdirSync(compendiumDir, { recursive: true });
  actions.push(writeFileSafe(join(compendiumDir, "_manifest.json"),
    JSON.stringify(COMPENDIUM_MANIFEST, null, 2), { policy, dryRun }));

  // 3. Avventure + albero di output (una sottocartella per tipo)
  const dirs = [
    join(projectDir, "adventures"),
    join(projectDir, "docs", "superpowers", "specs"),
    ...OUTPUT_SUBS.map((s) => join(projectDir, "output", s)),
  ];
  for (const d of dirs) {
    if (!dryRun) mkdirSync(d, { recursive: true });
    actions.push({ action: dryRun ? "would-create" : "created", path: d });
  }

  // 4. settings.json con env di progetto (percorsi assoluti, GAME_DATA_PATH multi-root)
  const settings = {
    env: {
      GAME_DATA_PATH: `${referencePath};${compendiumDir}`,
      GAME_DATA_LANG: "it",
      SETTING_PATH: settingDir,
      ADVENTURE_PATH: join(projectDir, "adventures"),
      OUTPUT_DIR: join(projectDir, "output"),
    },
  };
  const claudeDir = join(projectDir, ".claude");
  if (!dryRun) mkdirSync(claudeDir, { recursive: true });
  actions.push(writeFileSafe(join(claudeDir, "settings.json"),
    JSON.stringify(settings, null, 2), { policy, dryRun }));

  return { actions };
}

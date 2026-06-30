import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { writeFileSafe } from "../common/fs-atomic.js";
import { parseRelations, serializeRelations } from "../relations/parse.js";
import { mergeEdges } from "../relations/graph.js";
import { slugify } from "../common/slug.js";

const SUBDIR = {
  region: "20-geography",
  faction: "30-factions",
  deity: "40-pantheon",
  npc: join("30-factions", "_npcs"),
  monster: "70-bestiary-custom",
};

export function applyGeneration({ settingPath, element, policy = "error", dryRun = false }) {
  const { kind, name, markdown, timelineEntry, edges } = element;
  const subdir = SUBDIR[kind];
  if (!subdir) throw new Error(`kind sconosciuto: ${kind}`);
  const actions = [];

  // 1) scheda
  const schedaPath = join(settingPath, subdir, `${slugify(name)}.md`);
  actions.push(writeFileSafe(schedaPath, markdown.endsWith("\n") ? markdown : markdown + "\n", { policy, dryRun }));

  // 2) timeline (append)
  if (timelineEntry) {
    const tlPath = join(settingPath, "60-timeline.md");
    actions.push(writeFileSafe(tlPath, `\n${timelineEntry}\n`, { policy: "append", dryRun }));
  }

  // 3) relazioni (merge → overwrite)
  if (edges && edges.length) {
    const relPath = join(settingPath, "_relations.md");
    const existingMd = existsSync(relPath) ? readFileSync(relPath, "utf8") : "# Relazioni\n\n```relations\n```\n";
    const merged = mergeEdges(parseRelations(existingMd), edges);
    const parts = existingMd.split("```relations");
    const header = parts[0];
    // Preserva il testo eventualmente presente dopo la chiusura del blocco.
    const suffix = (parts[1] ?? "").split("```").slice(1).join("```");
    const newMd = `${header}${serializeRelations(merged)}${suffix}`;
    actions.push(writeFileSafe(relPath, newMd, { policy: "overwrite", dryRun }));
  }

  return { actions };
}

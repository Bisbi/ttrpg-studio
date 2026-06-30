#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { parseRelations } from "../relations/parse.js";
import { checkCanon } from "../lorekeeper/check.js";
import { collectKnownIds } from "../lorekeeper/collect.js";
import { validateSettingConfig } from "../common/config.js";
import { createLogger } from "../common/logger.js";

export { collectKnownIds };

export function runLoreCheck(argv, env) {
  const logger = createLogger(env);
  let cfg;
  try {
    cfg = validateSettingConfig(env);
  } catch (e) {
    logger.error(e.message);
    return { code: 1, report: { discrepancies: [] } };
  }
  const relPath = join(cfg.settingPath, "_relations.md");
  const md = existsSync(relPath) ? readFileSync(relPath, "utf8") : "";
  const edges = parseRelations(md);
  const knownIds = collectKnownIds(cfg.settingPath);
  const report = checkCanon({ edges, knownIds });
  for (const d of report.discrepancies) logger.warn(`${d.code}: ${d.message}`);
  if (report.discrepancies.length === 0) logger.info("lore-check: canon coerente");
  return { code: report.discrepancies.length ? 2 : 0, report };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const { code } = runLoreCheck(process.argv.slice(2), process.env);
  process.exit(code);
}

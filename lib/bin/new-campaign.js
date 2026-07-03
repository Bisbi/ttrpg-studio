#!/usr/bin/env node
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { scaffoldCampaign } from "../campaign/scaffold-campaign.js";
import { createLogger } from "../common/logger.js";

export function runNewCampaign(argv, env) {
  const logger = createLogger(env);
  const dryRun = argv.includes("--dry-run");
  const pIdx = argv.indexOf("--policy");
  const policy = pIdx !== -1 ? argv[pIdx + 1] : "error";
  const rIdx = argv.indexOf("--reference");
  const referencePath = rIdx !== -1 ? argv[rIdx + 1]
    : (env.REFERENCE_COMPENDIUM ?? "C:/Users/giovannib/Documents/D&D/_compendium-5e-2024");
  // Escludi i flag e i valori che seguono --policy / --reference dai posizionali.
  const flagValueIdxs = new Set([pIdx + 1, rIdx + 1].filter((i) => i > 0));
  const args = argv.filter((a, i) => !a.startsWith("--") && !flagValueIdxs.has(i));
  const name = args[0];
  if (!name) {
    logger.error("Uso: new-campaign <nome> [--reference <path>] [--dry-run] [--policy skip|overwrite|append|error]");
    return { code: 1 };
  }

  const root = env.CLAUDE_PLUGIN_ROOT ?? process.cwd();
  const templatesDir = join(root, "templates", "setting-bible");
  const projectDir = env.PROJECT_DIR ?? process.cwd();
  try {
    const res = scaffoldCampaign({ name, projectDir, referencePath, templatesDir, policy, dryRun });
    for (const a of res.actions) logger.info(`${a.action} ${a.path}`);
    return { code: 0 };
  } catch (e) {
    logger.error(e.message);
    return { code: 1 };
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const { code } = runNewCampaign(process.argv.slice(2), process.env);
  process.exit(code);
}

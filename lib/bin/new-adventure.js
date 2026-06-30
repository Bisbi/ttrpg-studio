#!/usr/bin/env node
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { scaffoldAdventure } from "../adventure/scaffold.js";
import { validateAdventureConfig } from "../common/config.js";
import { createLogger } from "../common/logger.js";

export function runNewAdventure(argv, env) {
  const logger = createLogger(env);
  const dryRun = argv.includes("--dry-run");
  const pIdx = argv.indexOf("--policy");
  const policy = pIdx !== -1 ? argv[pIdx + 1] : "error";
  const policyValueIdx = pIdx !== -1 ? pIdx + 1 : -1;
  const args = argv.filter((a, i) => !a.startsWith("--") && i !== policyValueIdx);
  const title = args[0];
  if (!title) {
    logger.error("Uso: new-adventure \"<titolo>\" [--dry-run] [--policy skip|overwrite|append|error]");
    return { code: 1 };
  }
  let cfg;
  try {
    cfg = validateAdventureConfig(env);
  } catch (e) {
    logger.error(e.message);
    return { code: 1 };
  }
  const root = env.CLAUDE_PLUGIN_ROOT ?? process.cwd();
  const templatesDir = join(root, "templates", "adventure");
  try {
    const res = scaffoldAdventure({ title, destDir: cfg.adventurePath, templatesDir, policy, dryRun });
    for (const a of res.actions) logger.info(`${a.action} ${a.path}`);
    return { code: 0 };
  } catch (e) {
    logger.error(e.message);
    return { code: 1 };
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const { code } = runNewAdventure(process.argv.slice(2), process.env);
  process.exit(code);
}

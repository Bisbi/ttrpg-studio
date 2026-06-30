#!/usr/bin/env node
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { scaffoldSetting } from "../setting/scaffold.js";
import { validateSettingConfig } from "../common/config.js";
import { createLogger } from "../common/logger.js";

export function runNewSetting(argv, env) {
  const logger = createLogger(env);
  const args = argv.filter((a) => !a.startsWith("--"));
  const name = args[0];
  if (!name) {
    logger.error("Uso: new-setting <nome> [--dry-run] [--policy skip|overwrite|append|error]");
    return { code: 1 };
  }
  const dryRun = argv.includes("--dry-run");
  const pIdx = argv.indexOf("--policy");
  const policy = pIdx !== -1 ? argv[pIdx + 1] : "error";

  let cfg;
  try {
    cfg = validateSettingConfig(env);
  } catch (e) {
    logger.error(e.message);
    return { code: 1 };
  }
  const root = env.CLAUDE_PLUGIN_ROOT ?? process.cwd();
  const templatesDir = join(root, "templates", "setting-bible");
  try {
    const res = scaffoldSetting({ name, destDir: cfg.settingPath, templatesDir, policy, dryRun });
    for (const a of res.actions) logger.info(`${a.action} ${a.path}`);
    return { code: 0 };
  } catch (e) {
    logger.error(e.message);
    return { code: 1 };
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const { code } = runNewSetting(process.argv.slice(2), process.env);
  process.exit(code);
}

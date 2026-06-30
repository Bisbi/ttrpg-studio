#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { rollOnColumn, rollAll } from "../tables/roll.js";
import { createLogger } from "../common/logger.js";

export function resolveTablePath(name, env = {}) {
  const candidates = [];
  if (env.SETTING_PATH) candidates.push(join(env.SETTING_PATH, "80-tables", `${name}.json`));
  const root = env.CLAUDE_PLUGIN_ROOT ?? process.cwd();
  candidates.push(join(root, "templates", "tables", `${name}.json`));
  return candidates.find((p) => existsSync(p)) ?? null;
}

export function runRoll(argv, env = {}, rng = Math.random) {
  const logger = createLogger(env);
  const args = argv.filter((a) => !a.startsWith("--"));
  const name = args[0];
  if (!name) {
    logger.error("Uso: roll <tabella> [--col <colonna>]");
    return { code: 1, result: null };
  }
  const path = resolveTablePath(name, env);
  if (!path) {
    logger.error(`Tabella non trovata: ${name}`);
    return { code: 1, result: null };
  }
  const table = JSON.parse(readFileSync(path, "utf8"));
  const cIdx = argv.indexOf("--col");
  try {
    const result = cIdx !== -1
      ? { [argv[cIdx + 1]]: rollOnColumn(table, argv[cIdx + 1], rng) }
      : rollAll(table, rng);
    logger.info(`roll ${name}: ${JSON.stringify(result)}`);
    return { code: 0, result };
  } catch (e) {
    logger.error(e.message);
    return { code: 1, result: null };
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const { code } = runRoll(process.argv.slice(2), process.env);
  process.exit(code);
}

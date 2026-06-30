#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { extractOnePager } from "../session-prep/extract.js";
import { renderOnePager } from "../session-prep/render.js";
import { writeFileSafe } from "../common/fs-atomic.js";
import { validateAdventureConfig } from "../common/config.js";
import { createLogger } from "../common/logger.js";

export { renderOnePager };

export function runSessionPrep(argv, env) {
  const logger = createLogger(env);
  const slug = argv.filter((a) => !a.startsWith("--"))[0];
  if (!slug) {
    logger.error("Uso: session-prep <slug-avventura>");
    return { code: 1 };
  }
  let cfg;
  try {
    cfg = validateAdventureConfig(env);
  } catch (e) {
    logger.error(e.message);
    return { code: 1 };
  }
  const jsonPath = join(cfg.adventurePath, slug, "adventure.json");
  if (!existsSync(jsonPath)) {
    logger.error(`Avventura non trovata: ${jsonPath}`);
    return { code: 1 };
  }
  const doc = JSON.parse(readFileSync(jsonPath, "utf8"));
  const md = renderOnePager(extractOnePager(doc), doc.title ?? slug);
  const out = join(cfg.adventurePath, slug, "session-prep.md");
  const res = writeFileSafe(out, md, { policy: "overwrite" });
  logger.info(`${res.action} ${res.path}`);
  return { code: 0 };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const { code } = runSessionPrep(process.argv.slice(2), process.env);
  process.exit(code);
}

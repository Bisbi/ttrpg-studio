#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { cardModel } from "../item-card/model.js";
import { renderItemCardHtml } from "../item-card/render-html.js";
import { resolveOutputPath } from "../common/output.js";
import { writeFileSafe } from "../common/fs-atomic.js";
import { slugify } from "../common/slug.js";
import { createLogger } from "../common/logger.js";

function loadCss(root) {
  try { return readFileSync(join(root, "templates", "item-card", "card.css"), "utf8"); } catch { return ""; }
}

export function buildItemCard(item, env = {}) {
  const lang = env.GAME_DATA_LANG ?? "it";
  const root = env.CLAUDE_PLUGIN_ROOT ?? process.cwd();
  const model = cardModel(item, lang);
  const html = renderItemCardHtml(model, { css: loadCss(root) });
  const outDir = env.OUTPUT_DIR ?? join(process.cwd(), "output");
  const outPath = resolveOutputPath(outDir, `card-${slugify(model.name) || "oggetto"}`, ".png");
  return { html, outPath, model };
}

async function readStdin() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  const text = Buffer.concat(chunks).toString("utf8").trim();
  return text ? JSON.parse(text) : {};
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const logger = createLogger(process.env);
  try {
    const item = await readStdin();
    const { html, outPath } = buildItemCard(item, process.env);
    const { createRenderer } = await import("../../render/renderer.js");
    const png = await createRenderer().render(html, { width: 800, height: 1200 });
    writeFileSafe(outPath, png, { policy: "error" });
    logger.info(`carta scritta: ${outPath}`);
  } catch (e) {
    logger.error(e.message);
    process.exit(1);
  }
}

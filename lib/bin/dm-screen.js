#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { assembleScreen } from "../dm-screen/assemble.js";
import { renderScreenHtml } from "../dm-screen/render-html.js";
import { resolveOutputPath } from "../common/output.js";
import { writeFileSafe } from "../common/fs-atomic.js";
import { slugify } from "../common/slug.js";
import { createLogger } from "../common/logger.js";

function loadCss(root) {
  try { return readFileSync(join(root, "templates", "dm-screen", "screen.css"), "utf8"); } catch { return ""; }
}

export function buildDmScreen(input, env = {}, { format = "png" } = {}) {
  const root = env.CLAUDE_PLUGIN_ROOT ?? process.cwd();
  const screen = assembleScreen({ adventure: input.adventure ?? {}, monsters: input.monsters ?? [] });
  const html = renderScreenHtml(screen, { css: loadCss(root) });
  const outDir = env.OUTPUT_DIR ?? join(process.cwd(), "output");
  const ext = format === "pdf" ? ".pdf" : ".png";
  const outPath = resolveOutputPath(outDir, `dm-screen-${slugify(screen.title) || "schermo"}`, ext);
  return { html, outPath };
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
    const format = process.argv.includes("--pdf") ? "pdf" : "png";
    const input = await readStdin();
    const { html, outPath } = buildDmScreen(input, process.env, { format });
    const { createRenderer } = await import("../../render/renderer.js");
    const buf = await createRenderer().render(html, { width: 1920, height: 1080, format });
    writeFileSafe(outPath, buf, { policy: "error" });
    logger.info(`schermo scritto: ${outPath}`);
  } catch (e) {
    logger.error(e.message);
    process.exit(1);
  }
}

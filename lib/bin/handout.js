#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { playerSafe } from "../handout/sanitize.js";
import { renderHandoutHtml } from "../handout/render-html.js";
import { resolveOutputPath } from "../common/output.js";
import { writeFileSafe } from "../common/fs-atomic.js";
import { slugify } from "../common/slug.js";
import { createLogger } from "../common/logger.js";

function loadCss(root) {
  try { return readFileSync(join(root, "templates", "handout", "handout.css"), "utf8"); } catch { return ""; }
}

function contentToText(content) {
  if (typeof content === "string") return content;
  const safe = playerSafe(content);
  return Object.values(safe).map((v) => (typeof v === "string" ? v : JSON.stringify(v))).join("\n");
}

export function buildHandout(input, env = {}) {
  const root = env.CLAUDE_PLUGIN_ROOT ?? process.cwd();
  const kind = input.kind ?? "letter";
  const title = input.title ?? "";
  const content = contentToText(input.content ?? "");
  const html = renderHandoutHtml({ kind, title, content, css: loadCss(root) });
  const outDir = env.OUTPUT_DIR ?? join(process.cwd(), "output");
  const outPath = resolveOutputPath(outDir, `handout-${slugify(title) || kind}`, ".png");
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
    const input = await readStdin();
    const { html, outPath } = buildHandout(input, process.env);
    const { createRenderer } = await import("../../render/renderer.js");
    const png = await createRenderer().render(html, { width: 800, height: 1200 });
    writeFileSafe(outPath, png, { policy: "error" });
    logger.info(`handout scritto: ${outPath}`);
  } catch (e) {
    logger.error(e.message);
    process.exit(1);
  }
}

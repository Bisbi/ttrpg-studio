#!/usr/bin/env node
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { generateDungeon } from "../battlemap/generate.js";
import { mapToSvg } from "../battlemap/svg.js";
import { addGridToSvg, wrapImageWithGrid } from "../battlemap/add-grid.js";
import { htmlDocument } from "../render/html.js";
import { resolveOutputPath } from "../common/output.js";
import { writeFileSafe } from "../common/fs-atomic.js";
import { slugify } from "../common/slug.js";
import { createLogger } from "../common/logger.js";

export function buildBattleMap({ tier = 1, cols = 16, rows = 16, name = "mappa", imageHref, cellSize = 40, rng = Math.random } = {}, env = {}) {
  const outDir = env.OUTPUT_DIR ?? join(process.cwd(), "output");
  const base = `battle-map-${slugify(name) || "mappa"}`;
  let svg, map;
  let width, height;
  if (tier === 2) {
    if (!imageHref) throw new Error("Tier 2 richiede imageHref nell'input JSON.");
    width = cols * cellSize; height = rows * cellSize;
    svg = wrapImageWithGrid({ href: imageHref, width, height, cellSize });
  } else {
    map = generateDungeon({ cols, rows, rng });
    width = cols * cellSize; height = rows * cellSize;
    svg = addGridToSvg(mapToSvg(map, { cellSize }), { width, height, cellSize });
  }
  const html = htmlDocument({ title: name, body: svg, width, height });
  const outPath = resolveOutputPath(outDir, base, ".png");
  const jsonPath = tier === 1 ? resolveOutputPath(outDir, base, ".json") : undefined;
  return { svg, html, outPath, jsonPath, map, width, height };
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
    const argv = process.argv.slice(2);
    const tIdx = argv.indexOf("--tier");
    const tier = tIdx !== -1 ? Number(argv[tIdx + 1]) : 1;
    const input = await readStdin();
    const opts = { tier, ...input };
    const { html, outPath, jsonPath, map, width, height } = buildBattleMap(opts, process.env);
    if (jsonPath && map) writeFileSafe(jsonPath, JSON.stringify(map, null, 2) + "\n", { policy: "error" });
    const { createRenderer } = await import("../../render/renderer.js");
    const png = await createRenderer().render(html, { width, height });
    writeFileSafe(outPath, png, { policy: "error" });
    logger.info(`mappa scritta: ${outPath}`);
  } catch (e) {
    logger.error(e.message);
    process.exit(1);
  }
}

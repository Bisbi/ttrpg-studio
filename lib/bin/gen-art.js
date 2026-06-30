#!/usr/bin/env node
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { selectProvider } from "../image/select.js";
import { imageGenDisclaimer } from "../image/disclaimer.js";
import { apiGenerate } from "../image/api-provider.js";
import { browserGenerate } from "../image/browser-provider.js";
import { resolveOutputPath } from "../common/output.js";
import { writeFileSafe } from "../common/fs-atomic.js";
import { slugify } from "../common/slug.js";
import { createLogger } from "../common/logger.js";

export function planGenArt(prompt, env = {}) {
  const provider = selectProvider(env);
  const outDir = env.OUTPUT_DIR ?? join(process.cwd(), "output");
  const base = `art-${slugify(prompt).slice(0, 40) || "arte"}`;
  const outPath = resolveOutputPath(outDir, base, ".png");
  return { provider, outPath };
}

async function readPrompt() {
  const fromArg = process.argv.slice(2).filter((a) => !a.startsWith("--")).join(" ").trim();
  if (fromArg) return fromArg;
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString("utf8").trim();
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const logger = createLogger(process.env);
  try {
    const prompt = await readPrompt();
    if (!prompt) throw new Error("Prompt mancante. Uso: gen-art \"<descrizione>\"");
    const { provider, outPath } = planGenArt(prompt, process.env);
    let buf;
    if (provider === "api") {
      buf = await apiGenerate({ prompt, url: process.env.IMAGE_API_URL, key: process.env.IMAGE_API_KEY });
    } else if (provider === "browser") {
      logger.warn(imageGenDisclaimer());
      const { createRenderer } = await import("../../render/renderer.js");
      const pilot = async ({ url, prompt: p }) => {
        const target = url.includes("{prompt}") ? url.replace("{prompt}", encodeURIComponent(p)) : url;
        return createRenderer().render(`<iframe src="${target}" style="width:100%;height:100%;border:0"></iframe>`,
          { width: 1024, height: 1536, selector: null });
      };
      buf = await browserGenerate({ url: process.env.IMAGE_GEN_URL, prompt, selector: "img" }, { pilot });
    } else {
      throw new Error("Nessun provider: imposta IMAGE_API_URL (consigliato) o IMAGE_GEN_URL.");
    }
    writeFileSafe(outPath, buf, { policy: "error" });
    logger.info(`arte scritta: ${outPath}`);
  } catch (e) {
    logger.error(e.message);
    process.exit(1);
  }
}

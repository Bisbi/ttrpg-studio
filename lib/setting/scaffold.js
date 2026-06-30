import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { writeFileSafe } from "../common/fs-atomic.js";

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

export function scaffoldSetting({ name, destDir, templatesDir, policy = "error", dryRun = false }) {
  const files = walk(templatesDir);
  const created = [];
  const actions = [];
  for (const src of files) {
    const rel = relative(templatesDir, src);
    const dest = join(destDir, rel);
    const content = readFileSync(src, "utf8").replaceAll("{{SETTING_NAME}}", name);
    const res = writeFileSafe(dest, content, { policy, dryRun });
    actions.push(res);
    if (res.action !== "skipped") created.push(dest);
  }
  return { created, actions };
}

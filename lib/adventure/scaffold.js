import { readFileSync } from "node:fs";
import { join } from "node:path";
import { writeFileSafe } from "../common/fs-atomic.js";
import { slugify } from "../common/slug.js";

export function scaffoldAdventure({ title, destDir, templatesDir, policy = "error", dryRun = false }) {
  const slug = slugify(title);
  const advDir = join(destDir, slug);
  const created = [];
  const actions = [];

  const map = [
    ["adventure.template.json", "adventure.json"],
    ["adventure.template.md", "adventure.md"],
  ];
  for (const [srcName, destName] of map) {
    const content = readFileSync(join(templatesDir, srcName), "utf8")
      .replaceAll("{{TITLE}}", title)
      .replaceAll("{{SLUG}}", slug);
    const dest = join(advDir, destName);
    const res = writeFileSafe(dest, content, { policy, dryRun });
    actions.push(res);
    if (res.action !== "skipped") created.push(dest);
  }
  return { slug, created, actions };
}

#!/usr/bin/env node
// Command line entry point for the wiki tooling: the one place that reads the filesystem and asks git
// questions, then hands plain data to the checking modules. Keeping every effect here is what lets
// those modules stay pure and testable.
import { readFileSync, writeFileSync, readdirSync, existsSync, appendFileSync } from "node:fs";
import { join, posix } from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { createLogger } from "../common/logger.js";
import { parseWikiArgs } from "../wiki/cli-args.js";
import { parseFrontmatter } from "../wiki/frontmatter.js";
import { extractLinks } from "../wiki/links.js";
import { validateNode, RESERVED } from "../wiki/validate.js";
import { buildIndex, buildLogEntry } from "../wiki/index-gen.js";
import { checkBoundary } from "../wiki/boundary.js";
import { findStale } from "../wiki/stale.js";

function git(args, fallback = "") {
  try {
    return execFileSync("git", args, { encoding: "utf8" });
  } catch {
    return fallback;
  }
}

// Node paths are collected with forward slashes so they compare directly against git output, which
// uses them on every platform.
function collect(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const rel = posix.join(dir.split("\\").join("/"), entry.name);
    if (entry.isDirectory()) { out.push(...collect(full)); continue; }
    if (!entry.name.endsWith(".md") || RESERVED.includes(entry.name)) continue;
    const text = readFileSync(full, "utf8");
    let parsed;
    try {
      parsed = parseFrontmatter(text);
    } catch (err) {
      // The parser reports a line number but has no idea which file it was handed, and a bare
      // "line 4" sends the reader hunting through the whole bundle.
      err.message = `${rel}: ${err.message}`;
      throw err;
    }
    out.push({ file: rel, name: entry.name, dir: dir.split("\\").join("/"), data: parsed.data, body: parsed.body });
  }
  return out;
}

export function runWiki(argv, env) {
  const logger = createLogger(env);
  const { command, dirs, json } = parseWikiArgs(argv);
  if (!command) {
    logger.error("Usage: wiki <validate|index|boundary|stale|all> [--dir <path>]... [--json]");
    return { code: 1 };
  }

  let nodes = [];
  try {
    for (const dir of dirs) nodes.push(...collect(dir));
  } catch (err) {
    logger.error(err.message);
    return { code: 1 };
  }

  const problems = [];
  const run = (name) => command === "all" || command === name;

  if (run("validate")) {
    for (const node of nodes) problems.push(...validateNode(node, node.file));
    const known = new Set(nodes.map((n) => n.file));
    for (const node of nodes) {
      for (const target of extractLinks(node.body)) {
        const resolved = posix.normalize(posix.join(node.dir, target));
        if (!known.has(resolved) && !existsSync(resolved)) {
          problems.push(`${node.file}: broken link to ${target}`);
        }
      }
    }
  }

  if (run("boundary")) {
    const trackedFiles = new Set(git(["ls-files"]).split("\n").filter(Boolean));
    let localIgnored = true;
    try {
      execFileSync("git", ["check-ignore", "-q", "local"], { stdio: "ignore" });
    } catch {
      localIgnored = false;
    }
    problems.push(...checkBoundary({ nodes, trackedFiles, localIgnored }));
  }

  if (run("index")) {
    const byDir = new Map();
    for (const node of nodes) {
      if (!byDir.has(node.dir)) byDir.set(node.dir, []);
      byDir.get(node.dir).push({ file: node.name, data: node.data });
    }
    for (const [dir, entries] of byDir) {
      const indexPath = join(dir, "index.md");
      const next = buildIndex(entries);
      const current = existsSync(indexPath) ? readFileSync(indexPath, "utf8") : null;
      // Appending a log line on every run would bury the real history under entries that record
      // nothing happening, so the log only grows when the index actually changed.
      if (current === next) { logger.debug(`index unchanged: ${dir}`); continue; }
      writeFileSync(indexPath, next, "utf8");
      appendFileSync(join(dir, "log.md"), buildLogEntry({
        timestamp: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
        updated: ["index.md"],
      }), "utf8");
      logger.info(`index regenerated: ${dir}`);
    }
  }

  if (run("stale")) {
    const lastModified = (path) => {
      const out = git(["log", "-1", "--format=%cI", "--", path]).trim();
      if (!out) return null;
      // Git reports the committer date in whatever offset the machine is set to. Comparing that
      // against a node's UTC timestamp as plain text is meaningless: an offset sign sorts below "Z"
      // no matter which instant it denotes, so every comparison would come out the same way. The
      // value is therefore re-expressed in UTC at second precision, matching how nodes are written.
      const t = new Date(out);
      return Number.isNaN(t.getTime()) ? null : t.toISOString().replace(/\.\d+Z$/, "Z");
    };
    const stale = findStale(nodes, lastModified);
    if (json) process.stdout.write(JSON.stringify(stale, null, 2) + "\n");
    else for (const s of stale) logger.warn(`stale: ${s.file} covers ${s.path} changed ${s.coveredAt}`);
  }

  for (const p of problems) logger.error(p);
  return { code: problems.length > 0 ? 1 : 0 };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(runWiki(process.argv.slice(2), process.env).code);
}

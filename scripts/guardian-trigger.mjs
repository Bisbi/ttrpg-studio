// Decides whether the end-of-turn guardian is worth running at all.
// Most turns change nothing that could produce durable knowledge, and a guardian that speaks on every
// one of them becomes noise the reader learns to skip - which is how this kind of system dies.
import { execFileSync } from "node:child_process";

const changed = execFileSync("git", ["diff", "--name-only", "HEAD"], { encoding: "utf8" })
  .split("\n").filter(Boolean);

if (changed.length === 0) process.exit(0);

// Test-only and generated-file changes carry no knowledge a node would record.
const meaningful = changed.filter(
  (f) => !f.startsWith("lib/test/") && !f.endsWith("index.md") && !f.endsWith("log.md"),
);
if (meaningful.length === 0) process.exit(0);

process.stdout.write(JSON.stringify({ changed: meaningful }, null, 2) + "\n");

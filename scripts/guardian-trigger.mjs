// Decides whether the end-of-turn guardian is worth running at all.
// Most turns change nothing that could produce durable knowledge, and a guardian that speaks on every
// one of them becomes noise the reader learns to skip - which is how this kind of system dies.
//
// The comparison baseline is a commit SHA persisted inside the git directory, not HEAD itself. A turn
// that commits its own work leaves the working tree matching the new HEAD by the time this script
// runs, so diffing against HEAD would silently see nothing on exactly the turns that produced the
// most durable knowledge. Diffing against a stored prior commit catches both the commits made during
// the turn and any uncommitted edits left behind.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

let gitDir;
try {
  gitDir = git(["rev-parse", "--git-dir"]);
} catch {
  process.exit(0);
}

let head;
try {
  head = git(["rev-parse", "HEAD"]);
} catch {
  // A repository with no commits yet has nothing to diff against.
  process.exit(0);
}

const markerPath = path.join(gitDir, "ttrpg-guardian-baseline");

let baseline = head;
let reported = [];
try {
  const marker = JSON.parse(readFileSync(markerPath, "utf8"));
  git(["cat-file", "-e", `${marker.head}^{commit}`]);
  baseline = marker.head;
  reported = Array.isArray(marker.reported) ? marker.reported : [];
} catch {
  // Missing marker, unparsable marker, or a baseline commit that no longer exists (rewritten
  // history) - fall back to the current HEAD with nothing reported yet.
}

let changed;
try {
  changed = git(["diff", "--name-only", baseline]).split("\n").filter(Boolean);
} catch {
  process.exit(0);
}

// Test-only and generated-file changes carry no knowledge a node would record.
const meaningful = changed.filter(
  (f) => !f.startsWith("lib/test/") && !f.endsWith("index.md") && !f.endsWith("log.md"),
);

// Compare order-insensitively: the same set reported last time means nothing new to say, even if an
// uncommitted file would otherwise keep re-surfacing on every turn until it is committed. This
// dedupe only holds while the baseline itself hasn't moved: once a commit lands, the baseline read
// from the marker no longer equals the fresh HEAD, and that comparison is what tells apart "still the
// same pending edit" from "this got committed since we last looked", which is new durable state even
// when the file list happens to match.
const sameAsLastReport =
  baseline === head &&
  meaningful.length === reported.length &&
  [...meaningful].sort().every((f, i) => f === [...reported].sort()[i]);

try {
  writeFileSync(markerPath, JSON.stringify({ head, reported: meaningful }, null, 2));
} catch {
  // A marker write failure must never crash the turn it is merely trying to annotate.
}

if (meaningful.length === 0 || sameAsLastReport) process.exit(0);

process.stdout.write(JSON.stringify({ changed: meaningful }, null, 2) + "\n");

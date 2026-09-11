// Fails when a forbidden term appears anywhere in the publishable surface.
// Three exclusions are deliberate, and each one is narrow on purpose:
//   - docs/        -> internal design documents, which legitimately discuss the wider landscape;
//   - this script  -> it carries the forbidden terms as data;
//   - lockfiles    -> third-party package names outside our control.
// The scan reads file CONTENTS, not file NAMES: a file whose name carries a vendor name passes here
// while still being visible through git. Names are a separate concern, handled by keeping such code
// out of this repository entirely.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const DENY = ["5etools", "d&d", "dungeons & dragons", "wizards of the coast", "xphb", "xdmg", "xmm"];

const SELF = "scripts/check-denylist.mjs";
const isExcluded = (f) =>
  f.startsWith("docs/") ||
  f === SELF ||
  f.endsWith("package-lock.json");

const files = execSync("git ls-files", { encoding: "utf8" })
  .split("\n").filter(Boolean)
  .filter((f) => !isExcluded(f));

let bad = 0;
for (const f of files) {
  let text;
  try { text = readFileSync(f, "utf8").toLowerCase(); } catch { continue; }
  for (const term of DENY) {
    if (text.includes(term)) {
      console.error(`DENYLIST: "${term}" trovato in ${f}`);
      bad++;
    }
  }
}
if (bad) { console.error(`\n${bad} violazioni denylist.`); process.exit(1); }
console.log("denylist: pulito");

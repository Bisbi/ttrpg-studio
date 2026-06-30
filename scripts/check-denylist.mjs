// Fallisce se trova marchi/termini vietati nella SUPERFICIE PUBBLICABILE.
// Per decisione di progetto la scansione esclude:
//   - docs/        → spec e piani interni che citano legittimamente il panorama;
//   - questo script → contiene i termini come dati (denylist);
//   - i lockfile    → nomi di pacchetti di terze parti fuori dal nostro controllo.
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

#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { partyBudget } from "../encounter/budget.js";
import { proposeEncounters } from "../encounter/propose.js";
import { createLogger } from "../common/logger.js";

export function runEncounter({ levels, candidates = [], difficulty = "hard", maxResults = 5 }, env = {}) {
  const logger = createLogger(env);
  const budget = partyBudget(levels);
  const target = budget[difficulty];
  if (target === undefined) throw new Error(`Difficoltà non valida: ${difficulty} (easy|medium|hard|deadly).`);
  const proposals = proposeEncounters({ candidates, target, maxResults });
  logger.info(`budget ${difficulty}=${target}; ${proposals.length} proposte`);
  return { budget, target, proposals };
}

async function readStdin() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  const text = Buffer.concat(chunks).toString("utf8").trim();
  return text ? JSON.parse(text) : [];
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const argv = process.argv.slice(2);
  try {
    const lIdx = argv.indexOf("--levels");
    if (lIdx !== -1 && argv[lIdx + 1] === undefined) {
      throw new Error("--levels richiede un valore (es. 1,2,3).");
    }
    const levels = lIdx !== -1 ? argv[lIdx + 1].split(",").map(Number) : [];
    const dIdx = argv.indexOf("--difficulty");
    const difficulty = dIdx !== -1 ? argv[dIdx + 1] : "hard";
    const candidates = await readStdin();
    const out = runEncounter({ levels, candidates, difficulty }, process.env);
    process.stdout.write(JSON.stringify(out, null, 2) + "\n");
  } catch (e) {
    process.stderr.write(`[ttrpg-studio] ERROR ${e.message}\n`);
    process.exit(1);
  }
}

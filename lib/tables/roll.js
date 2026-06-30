import { ToolError, CODES } from "../common/errors.js";

function pick(entries, rng) {
  const idx = Math.min(entries.length - 1, Math.floor(rng() * entries.length));
  return entries[idx];
}

export function rollOnColumn(table, column, rng = Math.random) {
  const entries = table?.columns?.[column];
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new ToolError(CODES.NOT_FOUND, `Colonna assente o vuota: "${column}" nella tabella "${table?.table ?? "?"}".`, false);
  }
  return pick(entries, rng);
}

export function rollAll(table, rng = Math.random) {
  const out = {};
  for (const [col, entries] of Object.entries(table?.columns ?? {})) {
    if (Array.isArray(entries) && entries.length) out[col] = pick(entries, rng);
  }
  return out;
}

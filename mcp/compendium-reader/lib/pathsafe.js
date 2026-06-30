import { realpathSync } from "node:fs";
import { resolve, sep } from "node:path";
import { ToolError, CODES } from "./errors.js";

export function resolveWithin(root, relPath) {
  const realRoot = realpathSync(root);
  const candidate = resolve(realRoot, relPath);
  // Risolve i symlink quando il file esiste; se non esiste, usa il path resolved.
  let real;
  try {
    real = realpathSync(candidate);
  } catch {
    real = candidate;
  }
  const prefix = realRoot.endsWith(sep) ? realRoot : realRoot + sep;
  if (real !== realRoot && !real.startsWith(prefix)) {
    throw new ToolError(CODES.INVALID_INPUT, `Path fuori dalla cartella dati: ${relPath}`, false);
  }
  return real;
}

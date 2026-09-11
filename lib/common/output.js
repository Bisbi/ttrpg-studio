// Picks a free path for a new output file. Rather than overwrite an existing file with the same
// name, it appends an increasing numeric suffix until it finds one that doesn't exist yet, so
// repeated runs never silently destroy a previous result.
import { existsSync } from "node:fs";
import { join } from "node:path";

export function resolveOutputPath(outputDir, baseName, ext) {
  const clean = ext.startsWith(".") ? ext : `.${ext}`;
  let candidate = join(outputDir, `${baseName}${clean}`);
  let i = 1;
  while (existsSync(candidate)) {
    candidate = join(outputDir, `${baseName}-${i}${clean}`);
    i++;
  }
  return candidate;
}

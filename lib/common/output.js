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

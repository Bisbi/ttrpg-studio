// Writes files without ever leaving a half-written file behind if the process is interrupted
// mid-write. Content goes to a temp file first and is only moved into place with a rename, which
// is atomic on the same filesystem; also offers collision policies (skip/overwrite/append) and a
// dry-run mode that returns a diff instead of touching disk, for callers that want to preview
// changes before committing to them.
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync, unlinkSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { ToolError, CODES } from "./errors.js";

function atomicWrite(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = join(dirname(path), `.${basename(path)}.tmp-${process.pid}`);
  writeFileSync(tmp, content);
  try {
    renameSync(tmp, path);
  } catch (e) {
    // Clean up the temp file on failure; ignore if it's already gone so the original error surfaces.
    try { unlinkSync(tmp); } catch {}
    throw e;
  }
}

export function writeFileSafe(path, content, { policy = "error", dryRun = false } = {}) {
  const exists = existsSync(path);
  if (!exists) {
    if (dryRun) return { action: "created", path, diff: prefixLines(content, "+") };
    atomicWrite(path, content);
    return { action: "created", path };
  }
  const old = readFileSync(path, "utf8");
  switch (policy) {
    case "skip":
      return { action: "skipped", path };
    case "overwrite":
      if (dryRun) return { action: "overwritten", path, diff: diff(old, content) };
      atomicWrite(path, content);
      return { action: "overwritten", path };
    case "append": {
      const merged = old + content;
      if (dryRun) return { action: "appended", path, diff: prefixLines(content, "+") };
      atomicWrite(path, merged);
      return { action: "appended", path };
    }
    case "error":
    default:
      throw new ToolError(CODES.COLLISION, `Esiste già: ${path}. Usa --policy skip|overwrite|append.`, false);
  }
}

function prefixLines(text, sign) {
  return text.split("\n").map((l) => `${sign}${l}`).join("\n");
}
function diff(oldText, newText) {
  return `${prefixLines(oldText, "-")}\n${prefixLines(newText, "+")}`;
}

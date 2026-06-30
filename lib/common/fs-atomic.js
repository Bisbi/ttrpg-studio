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

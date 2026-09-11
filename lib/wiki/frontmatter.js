// Reads the YAML frontmatter block of a wiki node.
// The supported syntax is a deliberate subset - scalars and inline lists only - because this package
// carries no runtime dependencies and cannot pull in a YAML parser. Anything outside the subset is
// rejected loudly rather than guessed at: a silently misread field would corrupt the checks that
// depend on it.
import { ToolError, CODES } from "../common/errors.js";

const KEY = /^[A-Za-z][A-Za-z0-9_-]*$/;

function fail(message) {
  throw new ToolError(CODES.INVALID_INPUT, message);
}

function parseValue(raw, lineNo) {
  const v = raw.trim();
  if (v.startsWith("[")) {
    if (!v.endsWith("]")) fail(`unsupported frontmatter syntax at line ${lineNo}: unterminated list`);
    const inner = v.slice(1, -1).trim();
    if (inner === "") return [];
    return inner.split(",").map((s) => s.trim()).filter((s) => s !== "");
  }
  if (v.length >= 2 && (v[0] === '"' || v[0] === "'") && v[v.length - 1] === v[0]) {
    return v.slice(1, -1);
  }
  return v;
}

export function parseFrontmatter(text) {
  const lines = String(text).split("\n");
  if (lines[0].trim() !== "---") fail("missing frontmatter: the document must open with ---");

  const data = {};
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "---") { end = i; break; }
    const t = line.trim();
    if (t === "" || t.startsWith("#")) continue;
    // A leading space would mean a nested structure, which the subset does not cover.
    if (line !== line.trimStart()) fail(`unsupported frontmatter syntax at line ${i + 1}: indentation`);
    const sep = line.indexOf(":");
    if (sep === -1) fail(`unsupported frontmatter syntax at line ${i + 1}: expected key: value`);
    const key = line.slice(0, sep).trim();
    if (!KEY.test(key)) fail(`unsupported frontmatter syntax at line ${i + 1}: invalid key`);
    data[key] = parseValue(line.slice(sep + 1), i + 1);
  }
  if (end === -1) fail("missing closing --- for the frontmatter block");

  const body = lines.slice(end + 1).join("\n").replace(/^\n+/, "");
  return { data, body };
}

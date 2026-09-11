// Renders the two reserved OKF files, index.md and log.md, from the nodes present in a directory.
// They are generated rather than hand-written because a listing that drifts from the files it
// describes is worse than no listing: an agent trusts it and stops looking further.
import { NODE_TYPES } from "./validate.js";

// A missing field would otherwise be interpolated as the word "undefined", which reads like a real
// title and makes the listing wrong in a way nobody notices. Rendering the gap as a visible marker
// instead keeps a broken entry recognisable as broken to whoever opens the index.
const MISSING = "(missing)";
const field = (value) =>
  typeof value === "string" && value.trim() !== "" ? value : MISSING;

export function buildIndex(entries) {
  let out = "# Index\n";
  for (const type of NODE_TYPES) {
    const group = entries
      .filter((e) => e.data.type === type)
      .sort((a, b) => field(a.data.title).localeCompare(field(b.data.title)));
    if (group.length === 0) continue;
    out += `\n## ${type}\n\n`;
    for (const e of group) {
      out += `- [${field(e.data.title)}](${e.file}) — ${field(e.data.description)}\n`;
    }
  }
  return out;
}

export function buildLogEntry({ timestamp, added = [], updated = [], removed = [] }) {
  let out = `## ${timestamp}\n\n`;
  for (const [label, list] of [["added", added], ["updated", updated], ["removed", removed]]) {
    for (const f of list) out += `- ${label}: ${f}\n`;
  }
  return out;
}

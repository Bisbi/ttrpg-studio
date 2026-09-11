// Checks a single wiki node against the rules the automated tooling relies on.
// Every required field exists because something downstream reads it: scope drives the boundary
// check, covers drives the staleness check, timestamp compares against git history. A node missing
// one of them is not merely untidy - it silently opts out of a guarantee.
export const NODE_TYPES = ["Gotcha", "Decision", "Invariant", "Module", "Workflow"];
export const SCOPES = ["public", "local"];
export const RESERVED = ["index.md", "log.md"];

const REQUIRED = ["type", "title", "description", "scope", "covers", "tags", "timestamp"];
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
// A Decision must state what the standard prescribes, why this project departs from it, and what
// following it would break. Without all three the reader cannot judge whether it still applies.
const DECISION_SECTIONS = ["## Standard", "## Why not here", "## What breaks"];

export function validateNode({ data, body }, relPath) {
  const errors = [];
  const add = (msg) => errors.push(`${relPath}: ${msg}`);

  for (const f of REQUIRED) {
    if (data[f] === undefined || data[f] === "") add(`missing required field "${f}"`);
  }

  if (data.type !== undefined && !NODE_TYPES.includes(data.type)) {
    add(`field "type" must be one of ${NODE_TYPES.join(", ")}`);
  }
  if (data.scope !== undefined && !SCOPES.includes(data.scope)) {
    add(`field "scope" must be one of ${SCOPES.join(", ")}`);
  }
  if (data.covers !== undefined) {
    if (!Array.isArray(data.covers)) add(`field "covers" must be a list`);
    else if (data.covers.length === 0) add(`field "covers" must list at least one path`);
  }
  if (data.tags !== undefined && !Array.isArray(data.tags)) {
    add(`field "tags" must be a list`);
  }
  if (data.timestamp !== undefined && !ISO_UTC.test(String(data.timestamp))) {
    add(`field "timestamp" must be ISO 8601 UTC, e.g. 2026-09-11T10:00:00Z`);
  }

  if (data.type === "Decision") {
    for (const section of DECISION_SECTIONS) {
      if (!String(body).includes(section)) add(`a Decision node must contain the "${section}" section`);
    }
  }

  return errors;
}

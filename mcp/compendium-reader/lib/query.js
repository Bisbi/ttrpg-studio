import MiniSearch from "minisearch";
import { ToolError, CODES } from "./errors.js";
import { localize } from "../schema/common.js";

function encodeCursor(offset) {
  return Buffer.from(String(offset)).toString("base64");
}
function decodeCursor(cursor) {
  if (!cursor) return 0;
  const n = parseInt(Buffer.from(cursor, "base64").toString("utf8"), 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
export function project(record, fields) {
  if (!fields || fields.length === 0) return record;
  const out = {};
  for (const f of fields) if (f in record) out[f] = record[f];
  return out;
}

export class CompendiumQuery {
  constructor(store) {
    this.store = store;
    this.mini = new MiniSearch({
      fields: ["nameIt", "nameEn", "id"],
      storeFields: ["type", "id"],
      idField: "uid",
    });
    const docs = [];
    for (const type of store.getTypes()) {
      for (const rec of store.allOfType(type)) {
        docs.push({
          uid: `${type}:${rec.id}`,
          type,
          id: rec.id,
          nameIt: localize(rec.name, "it"),
          nameEn: localize(rec.name, "en"),
        });
      }
    }
    this.mini.addAll(docs);
  }

  get(type, idOrName, { lang = "it", fields } = {}) {
    const all = this.store.allOfType(type);
    const byId = all.find((r) => r.id === idOrName);
    if (byId) return project(byId, fields);
    const needle = String(idOrName).toLowerCase();
    const byName = all.filter(
      (r) =>
        localize(r.name, "it").toLowerCase() === needle ||
        localize(r.name, "en").toLowerCase() === needle
    );
    if (byName.length === 0) {
      throw new ToolError(CODES.NOT_FOUND, `Nessun ${type} con id/nome "${idOrName}".`, false);
    }
    if (byName.length > 1) {
      const sources = byName.map((r) => `${r.id} (${r.source})`).join(", ");
      throw new ToolError(CODES.AMBIGUOUS, `Più ${type} per "${idOrName}": ${sources}. Usa l'id.`, false);
    }
    return project(byName[0], fields);
  }

  list(type, { filters = {}, limit = 20, cursor, fields } = {}) {
    let rows = this.store.allOfType(type);
    for (const [k, v] of Object.entries(filters)) {
      rows = rows.filter((r) => String(r[k]) === String(v));
    }
    const total = rows.length;
    const offset = decodeCursor(cursor);
    const page = rows.slice(offset, offset + limit);
    const next = offset + limit < total ? encodeCursor(offset + limit) : null;
    return { results: page.map((r) => project(r, fields)), total, cursor: next };
  }

  search(query, { type, limit = 20, cursor, fields } = {}) {
    let hits = this.mini.search(query, { prefix: true, fuzzy: 0.2 });
    if (type) hits = hits.filter((h) => h.type === type);
    const total = hits.length;
    const offset = decodeCursor(cursor);
    const pageHits = hits.slice(offset, offset + limit);
    const results = [];
    for (const h of pageHits) {
      const rec = this.store.allOfType(h.type).find((r) => r.id === h.id);
      if (!rec) continue; // indice e store fuori sincrono: salta invece di emettere null
      results.push(project(rec, fields));
    }
    const next = offset + limit < total ? encodeCursor(offset + limit) : null;
    return { results, total, cursor: next };
  }
}

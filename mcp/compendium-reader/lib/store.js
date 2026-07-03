import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { SCHEMAS, SCHEMA_VERSION, DEFAULT_FILE_TYPE } from "../schema/index.js";
import { resolveWithin } from "./pathsafe.js";

export class CompendiumStore {
  constructor({ dataPaths, dataPath, lang, logger }) {
    // Retrocompatibile: accetta dataPaths[] o il vecchio dataPath singolo.
    this.dataPaths = Array.isArray(dataPaths) ? dataPaths : (dataPath ? [dataPath] : []);
    this.lang = lang;
    this.logger = logger;
    this.byType = new Map();
    this.mtimes = new Map();     // chiave: `${root}::${file}`
    this.fileTypes = new Map();  // chiave: file (per typeForFile)
  }

  _fileTypeMap(root) {
    const manifestPath = join(root, "_manifest.json");
    if (existsSync(manifestPath)) {
      const m = JSON.parse(readFileSync(manifestPath, "utf8"));
      return m.files ?? {};
    }
    // fallback: scansione cartella + mappa di default
    const map = {};
    for (const f of readdirSync(root)) {
      if (DEFAULT_FILE_TYPE[f]) map[f] = DEFAULT_FILE_TYPE[f];
    }
    return map;
  }

  load() {
    this.byType = new Map();
    this.mtimes = new Map();
    this.fileTypes = new Map();
    for (const root of this.dataPaths) {
      const files = this._fileTypeMap(root);
      for (const [file, type] of Object.entries(files)) {
        this.fileTypes.set(file, type);
        const full = resolveWithin(root, file);
        this.mtimes.set(`${root}::${file}`, statSync(full).mtimeMs);
        const data = JSON.parse(readFileSync(full, "utf8"));
        if (data.schema_version !== SCHEMA_VERSION) {
          this.logger.warn(`schema_version ${data.schema_version} != ${SCHEMA_VERSION} in ${root}/${file}`);
        }
        const schema = SCHEMAS[type];
        const bucket = this.byType.get(type) ?? new Map();
        for (const rec of data.records ?? []) {
          const parsed = schema.safeParse(rec);
          if (!parsed.success) {
            this.logger.warn(`record invalido in ${root}/${file}: ${parsed.error.issues[0]?.message}`);
            continue;
          }
          bucket.set(parsed.data.id, parsed.data); // ultimo root vince su id uguale
        }
        this.byType.set(type, bucket);
      }
    }
  }

  reloadIfStale() {
    // Set di file (per root) aggiunti/rimossi rispetto all'ultimo load().
    const current = [];
    for (const root of this.dataPaths) {
      for (const file of Object.keys(this._fileTypeMap(root))) current.push(`${root}::${file}`);
    }
    current.sort();
    const known = [...this.mtimes.keys()].sort();
    if (current.length !== known.length || current.some((k, i) => k !== known[i])) {
      this.logger.debug("reload: set di file cambiato");
      this.load();
      return true;
    }
    // File noti modificati o spariti.
    for (const [key, mtime] of this.mtimes) {
      const idx = key.indexOf("::");
      const root = key.slice(0, idx);
      const file = key.slice(idx + 2);
      const full = resolveWithin(root, file);
      if (!existsSync(full) || statSync(full).mtimeMs !== mtime) {
        this.logger.debug(`reload: ${key} cambiato`);
        this.load();
        return true;
      }
    }
    return false;
  }

  getTypes() {
    return [...this.byType.keys()];
  }

  allOfType(type) {
    return [...(this.byType.get(type)?.values() ?? [])];
  }

  // Tipo associato a un file dati (via manifest/mappa di default), o undefined.
  typeForFile(file) {
    return this.fileTypes.get(file);
  }
}

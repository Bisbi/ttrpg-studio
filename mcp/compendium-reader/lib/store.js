import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { SCHEMAS, SCHEMA_VERSION, DEFAULT_FILE_TYPE } from "../schema/index.js";
import { resolveWithin } from "./pathsafe.js";

export class CompendiumStore {
  constructor({ dataPath, lang, logger }) {
    this.dataPath = dataPath;
    this.lang = lang;
    this.logger = logger;
    this.byType = new Map();
    this.mtimes = new Map();
    this.fileTypes = new Map();
  }

  _fileTypeMap() {
    const manifestPath = join(this.dataPath, "_manifest.json");
    if (existsSync(manifestPath)) {
      const m = JSON.parse(readFileSync(manifestPath, "utf8"));
      return m.files ?? {};
    }
    // fallback: scansione cartella + mappa di default
    const map = {};
    for (const f of readdirSync(this.dataPath)) {
      if (DEFAULT_FILE_TYPE[f]) map[f] = DEFAULT_FILE_TYPE[f];
    }
    return map;
  }

  load() {
    this.byType = new Map();
    this.mtimes = new Map();
    const files = this._fileTypeMap();
    this.fileTypes = new Map(Object.entries(files));
    for (const [file, type] of Object.entries(files)) {
      const full = resolveWithin(this.dataPath, file);
      this.mtimes.set(file, statSync(full).mtimeMs);
      const data = JSON.parse(readFileSync(full, "utf8"));
      if (data.schema_version !== SCHEMA_VERSION) {
        this.logger.warn(`schema_version ${data.schema_version} != ${SCHEMA_VERSION} in ${file}`);
      }
      const schema = SCHEMAS[type];
      const bucket = this.byType.get(type) ?? new Map();
      for (const rec of data.records ?? []) {
        const parsed = schema.safeParse(rec);
        if (!parsed.success) {
          this.logger.warn(`record invalido in ${file}: ${parsed.error.issues[0]?.message}`);
          continue;
        }
        bucket.set(parsed.data.id, parsed.data);
      }
      this.byType.set(type, bucket);
    }
  }

  reloadIfStale() {
    // File aggiunti o rimossi rispetto all'ultimo load().
    const current = Object.keys(this._fileTypeMap()).sort();
    const known = [...this.mtimes.keys()].sort();
    if (current.length !== known.length || current.some((f, i) => f !== known[i])) {
      this.logger.debug("reload: set di file cambiato");
      this.load();
      return true;
    }
    // File noti modificati o spariti.
    for (const [file, mtime] of this.mtimes) {
      const full = resolveWithin(this.dataPath, file);
      if (!existsSync(full) || statSync(full).mtimeMs !== mtime) {
        this.logger.debug(`reload: ${file} cambiato`);
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

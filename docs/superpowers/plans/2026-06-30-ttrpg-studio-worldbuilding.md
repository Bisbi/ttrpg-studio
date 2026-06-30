# TTRPG Studio — Worldbuilding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Costruire il sottosistema "canon" del plugin: scaffold della Setting Bible (`/new-setting`), grafo relazioni tipizzato, generatori on-demand (`/gen-region|faction|deity|npc|monster`) con mutation contract (dry-run, policy di collisione, scrittura atomica), e l'agent `lore-keeper` come validatore semantico (`/lore-check`).

**Architecture:** Le utility deterministiche stanno in un nuovo package Node a livello repo (`lib/`, ESM, testato con vitest), separato dal package interno dell'MCP `compendium-reader`. Skill e comandi sono markdown: l'LLM legge il canon esistente e produce un oggetto strutturato (scheda + gancio + voce timeline + archi di relazione), che viene scritto nella Bible da una libreria di mutazione con scrittura atomica e policy di collisione. `lore-keeper` legge il grafo relazioni e il canon e produce un report di discrepanze semantiche, riusabile come gate pre-scrittura dei generatori.

**Tech Stack:** Node.js ≥20 (ESM), `vitest`. Nessuna nuova dipendenza runtime (solo `node:fs`/`node:path`/`node:os`). Apache-2.0 (codice) + CC-BY-4.0 (contenuti: `templates/`, scheletri Bible, seed tables).

## Global Constraints

- **Zero contenuti coperti da copyright** nel repo; **zero segreti** committati; **zero riferimenti a marchi/strumenti di terze parti** in codice, nomi tool/comandi e documentazione. Usare sempre **"compatibile con la Quinta Edizione" / "5E-compatible"**, mai "D&D".
- Esempi/seed: **solo homebrew inventato**; nessun valore riconducibile a prodotti commerciali.
- **Cross-platform:** solo `node:path` (`join`/`sep`); nessuna assunzione Windows; nessuna dipendenza Python.
- **Line-ending LF**: il repo ha `.gitattributes` con `eol=lf`; tutti i file generati nel working tree restano LF.
- **Scrittura su disco** sempre **atomica** (tmp nello stesso dir + `rename`) e con **policy di collisione esplicita**; ogni mutazione supporta `--dry-run`.
- **Logging su `stderr`** (mai stdout), flag `TTRPG_DEBUG`; errori in forma uniforme `{code, message, retriable}`.
- Node ESM: ogni `package.json` con `"type": "module"`.
- **Separazione vista-DM / vista-player**: nessun contenuto segreto va in output destinati ai giocatori (vincolo rilevante per i piani successivi; qui i generatori marcano i campi segreti).

---

### Task 1: Inizializzare il package Node `lib/` + CI

**Files:**
- Create: `lib/package.json`
- Create: `lib/vitest.config.js`
- Create: `lib/index.js` (placeholder eseguibile)
- Modify: `.github/workflows/ci.yml` (aggiungere install+test di `lib/`)

**Interfaces:**
- Consumes: niente.
- Produces: ambiente Node/ESM + test runner per tutte le utility worldbuilding; pipeline CI estesa.

- [ ] **Step 1: Creare `lib/package.json`**

```json
{
  "name": "ttrpg-studio-lib",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run"
  },
  "devDependencies": {
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Installare le dipendenze**

Run: `cd lib && npm install`
Expected: crea `node_modules/` e `package-lock.json` senza errori.

- [ ] **Step 3: Creare `lib/vitest.config.js`**

```js
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { environment: "node", include: ["test/**/*.test.js"] },
});
```

- [ ] **Step 4: Creare `lib/index.js` placeholder**

```js
// Entry point delle utility worldbuilding. I moduli sono in lib/common, lib/relations,
// lib/setting, lib/lorekeeper. Questo file riesporta le API pubbliche (popolato nei task seguenti).
export {};
```

- [ ] **Step 5: Verificare che il runner parta (nessun test ancora)**

Run: `cd lib && npx vitest run`
Expected: esce con "No test files found" (exit 0 o messaggio analogo), nessun crash.

- [ ] **Step 6: Estendere la CI con install+test di `lib/`**

In `.github/workflows/ci.yml`, dopo lo step "Test" di `mcp/compendium-reader`, aggiungere:
```yaml
      - name: Install (lib)
        working-directory: lib
        run: npm install
      - name: Test (lib)
        working-directory: lib
        run: npm test
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -s -m "chore: init Node package lib/ + CI worldbuilding"
```

---

### Task 2: `lib/common/errors.js` + `lib/common/logger.js`

**Files:**
- Create: `lib/common/errors.js`
- Create: `lib/common/logger.js`
- Test: `lib/test/common.test.js`

**Interfaces:**
- Consumes: niente.
- Produces:
  - `class ToolError extends Error` con `code: string`, `retriable: boolean`, `toJSON() → {code,message,retriable}`.
  - `CODES = { NOT_FOUND, AMBIGUOUS, INVALID_INPUT, COLLISION, INTERNAL }`.
  - `createLogger(env) → { debug, info, warn, error }` — tutte su `process.stderr`; `debug` no-op se `env.TTRPG_DEBUG` falsy.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/common.test.js`:
```js
import { describe, it, expect, vi } from "vitest";
import { ToolError, CODES } from "../common/errors.js";
import { createLogger } from "../common/logger.js";

describe("ToolError", () => {
  it("serializza in {code,message,retriable}", () => {
    const e = new ToolError(CODES.COLLISION, "esiste già", false);
    expect(e.toJSON()).toEqual({ code: "COLLISION", message: "esiste già", retriable: false });
  });
});

describe("logger", () => {
  it("scrive su stderr, mai su stdout", () => {
    const err = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const out = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    createLogger({}).info("ciao");
    expect(err).toHaveBeenCalled();
    expect(out).not.toHaveBeenCalled();
    err.mockRestore(); out.mockRestore();
  });
  it("debug no-op senza TTRPG_DEBUG", () => {
    const err = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    createLogger({}).debug("x");
    expect(err).not.toHaveBeenCalled();
    err.mockRestore();
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/common.test.js`
Expected: FAIL (moduli inesistenti).

- [ ] **Step 3: Implementare `lib/common/errors.js`**

```js
export const CODES = {
  NOT_FOUND: "NOT_FOUND",
  AMBIGUOUS: "AMBIGUOUS",
  INVALID_INPUT: "INVALID_INPUT",
  COLLISION: "COLLISION",
  INTERNAL: "INTERNAL",
};

export class ToolError extends Error {
  constructor(code, message, retriable = false) {
    super(message);
    this.name = "ToolError";
    this.code = code;
    this.retriable = retriable;
  }
  toJSON() {
    return { code: this.code, message: this.message, retriable: this.retriable };
  }
}
```

- [ ] **Step 4: Implementare `lib/common/logger.js`**

```js
export function createLogger(env = {}) {
  const debugOn = Boolean(env.TTRPG_DEBUG);
  const write = (level, args) =>
    process.stderr.write(`[ttrpg-studio] ${level} ${args.join(" ")}\n`);
  return {
    debug: (...a) => { if (debugOn) write("DEBUG", a); },
    info: (...a) => write("INFO", a),
    warn: (...a) => write("WARN", a),
    error: (...a) => write("ERROR", a),
  };
}
```

- [ ] **Step 5: Eseguire i test e verificare il successo**

Run: `cd lib && npx vitest run test/common.test.js`
Expected: PASS (3 test).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -s -m "feat(lib): ToolError uniforme + logger su stderr"
```

---

### Task 3: `lib/common/config.js` — validazione `SETTING_PATH`

**Files:**
- Create: `lib/common/config.js`
- Test: `lib/test/config.test.js`

**Interfaces:**
- Consumes: niente.
- Produces: `validateSettingConfig(env) → { settingPath: string, lang: "it"|"en" }`. Lancia `Error` azionabile se `SETTING_PATH` manca o non è una cartella; `lang` da `GAME_DATA_LANG`, default `"it"`, errore se non in `["it","en"]`.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/config.test.js`:
```js
import { describe, it, expect } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateSettingConfig } from "../common/config.js";

describe("validateSettingConfig", () => {
  it("ritorna settingPath e lang con env valida", () => {
    const dir = mkdtempSync(join(tmpdir(), "set-"));
    const cfg = validateSettingConfig({ SETTING_PATH: dir, GAME_DATA_LANG: "en" });
    expect(cfg.settingPath).toBe(dir);
    expect(cfg.lang).toBe("en");
  });
  it("default lang = it", () => {
    const dir = mkdtempSync(join(tmpdir(), "set-"));
    expect(validateSettingConfig({ SETTING_PATH: dir }).lang).toBe("it");
  });
  it("errore se SETTING_PATH manca", () => {
    expect(() => validateSettingConfig({})).toThrow(/SETTING_PATH/);
  });
  it("errore se la cartella non esiste", () => {
    expect(() => validateSettingConfig({ SETTING_PATH: "/no/such/xyz" })).toThrow(/non esiste|not found/i);
  });
  it("errore se lang non valida", () => {
    const dir = mkdtempSync(join(tmpdir(), "set-"));
    expect(() => validateSettingConfig({ SETTING_PATH: dir, GAME_DATA_LANG: "fr" })).toThrow(/it.*en|lang/i);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/config.test.js`
Expected: FAIL (`validateSettingConfig` non esiste).

- [ ] **Step 3: Implementare `lib/common/config.js`**

```js
import { statSync } from "node:fs";

export function validateSettingConfig(env = {}) {
  const settingPath = env.SETTING_PATH;
  if (!settingPath) {
    throw new Error(
      "Config: SETTING_PATH non impostata. Indica la cartella della Setting Bible " +
      "(es. ./setting)."
    );
  }
  let st;
  try {
    st = statSync(settingPath);
  } catch {
    throw new Error(`Config: SETTING_PATH non esiste o non è leggibile: ${settingPath}`);
  }
  if (!st.isDirectory()) {
    throw new Error(`Config: SETTING_PATH non è una cartella: ${settingPath}`);
  }
  const lang = env.GAME_DATA_LANG ?? "it";
  if (lang !== "it" && lang !== "en") {
    throw new Error(`Config: GAME_DATA_LANG deve essere "it" o "en" (ricevuto: "${lang}").`);
  }
  return { settingPath, lang };
}
```

- [ ] **Step 4: Eseguire il test e verificare il successo**

Run: `cd lib && npx vitest run test/config.test.js`
Expected: PASS (5 test).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "feat(lib): validazione SETTING_PATH con messaggi azionabili"
```

---

### Task 4: `lib/common/slug.js` — slug stabile per gli `id`

**Files:**
- Create: `lib/common/slug.js`
- Test: `lib/test/slug.test.js`

**Interfaces:**
- Consumes: niente.
- Produces: `slugify(name) → string` — minuscolo, ASCII, separatore `-`, rimuove accenti e caratteri non `[a-z0-9-]`, niente trattini doppi o ai bordi. Stabile e idempotente (`slugify(slugify(x)) === slugify(x)`).

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/slug.test.js`:
```js
import { describe, it, expect } from "vitest";
import { slugify } from "../common/slug.js";

describe("slugify", () => {
  it("minuscolo con trattini", () => {
    expect(slugify("Lega del Sale")).toBe("lega-del-sale");
  });
  it("rimuove accenti", () => {
    expect(slugify("Città di Cenere")).toBe("citta-di-cenere");
  });
  it("collassa separatori e bordi", () => {
    expect(slugify("  --A__B--  ")).toBe("a-b");
  });
  it("idempotente", () => {
    const s = slugify("Régno d'Ottone!");
    expect(slugify(s)).toBe(s);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/slug.test.js`
Expected: FAIL (`slugify` non esiste).

- [ ] **Step 3: Implementare `lib/common/slug.js`**

```js
export function slugify(name) {
  return String(name)
    .normalize("NFKD")               // separa i diacritici
    .replace(/[\u0300-\u036f]/g, "") // rimuove i segni diacritici combinanti
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")     // tutto il resto → separatore
    .replace(/-+/g, "-")             // niente trattini doppi
    .replace(/^-|-$/g, "");          // niente trattini ai bordi
}
```

- [ ] **Step 4: Eseguire il test e verificare il successo**

Run: `cd lib && npx vitest run test/slug.test.js`
Expected: PASS (4 test).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "feat(lib): slugify stabile e idempotente per gli id"
```

---

### Task 5: `lib/common/fs-atomic.js` — scrittura atomica + policy di collisione + dry-run

**Files:**
- Create: `lib/common/fs-atomic.js`
- Test: `lib/test/fs-atomic.test.js`

**Interfaces:**
- Consumes: `ToolError`, `CODES` da `lib/common/errors.js`.
- Produces: `writeFileSafe(path, content, { policy = "error", dryRun = false }) → { action, path, diff? }`.
  - `policy ∈ { "skip", "overwrite", "append", "error" }`.
  - Se il file non esiste: scrive (atomico: tmp nello stesso dir + `rename`); `action = "created"`.
  - Se esiste: `skip`→`{action:"skipped"}` (nessuna scrittura); `overwrite`→riscrive (`action:"overwritten"`); `append`→accoda (`action:"appended"`); `error`→`ToolError(CODES.COLLISION, ...)`.
  - `dryRun: true` non scrive mai e ritorna `action` previsto + `diff` (stringa: per "created" l'intero contenuto prefissato `+`; per overwrite/append una sintesi `- old / + new`).
  - Crea le cartelle intermedie mancanti.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/fs-atomic.test.js`:
```js
import { describe, it, expect } from "vitest";
import { mkdtempSync, readFileSync, existsSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFileSafe } from "../common/fs-atomic.js";
import { ToolError } from "../common/errors.js";

function tmp() { return mkdtempSync(join(tmpdir(), "fsa-")); }

describe("writeFileSafe", () => {
  it("crea un nuovo file e le cartelle intermedie", () => {
    const dir = tmp();
    const p = join(dir, "a", "b", "f.md");
    const r = writeFileSafe(p, "ciao", {});
    expect(r.action).toBe("created");
    expect(readFileSync(p, "utf8")).toBe("ciao");
  });
  it("policy error: collisione lancia ToolError", () => {
    const dir = tmp(); const p = join(dir, "f.md");
    writeFileSafe(p, "uno", {});
    expect(() => writeFileSafe(p, "due", { policy: "error" })).toThrow(ToolError);
  });
  it("policy skip: non sovrascrive", () => {
    const dir = tmp(); const p = join(dir, "f.md");
    writeFileSafe(p, "uno", {});
    const r = writeFileSafe(p, "due", { policy: "skip" });
    expect(r.action).toBe("skipped");
    expect(readFileSync(p, "utf8")).toBe("uno");
  });
  it("policy overwrite: riscrive", () => {
    const dir = tmp(); const p = join(dir, "f.md");
    writeFileSafe(p, "uno", {});
    const r = writeFileSafe(p, "due", { policy: "overwrite" });
    expect(r.action).toBe("overwritten");
    expect(readFileSync(p, "utf8")).toBe("due");
  });
  it("policy append: accoda", () => {
    const dir = tmp(); const p = join(dir, "f.md");
    writeFileSafe(p, "uno", {});
    const r = writeFileSafe(p, "\ndue", { policy: "append" });
    expect(r.action).toBe("appended");
    expect(readFileSync(p, "utf8")).toBe("uno\ndue");
  });
  it("dryRun: non scrive e ritorna il diff", () => {
    const dir = tmp(); const p = join(dir, "f.md");
    const r = writeFileSafe(p, "nuovo", { dryRun: true });
    expect(r.action).toBe("created");
    expect(r.diff).toContain("+nuovo");
    expect(existsSync(p)).toBe(false);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/fs-atomic.test.js`
Expected: FAIL (`writeFileSafe` non esiste).

- [ ] **Step 3: Implementare `lib/common/fs-atomic.js`**

```js
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
```

- [ ] **Step 4: Eseguire i test e verificare il successo**

Run: `cd lib && npx vitest run test/fs-atomic.test.js`
Expected: PASS (6 test).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "feat(lib): writeFileSafe atomico con policy di collisione e dry-run"
```

---

### Task 6: `lib/relations/parse.js` — parser/serializer del grafo relazioni

**Files:**
- Create: `lib/relations/parse.js`
- Test: `lib/test/relations-parse.test.js`

**Interfaces:**
- Consumes: niente.
- Produces:
  - `parseRelations(markdown) → Edge[]` dove `Edge = { source: string, type: string, target: string }`. Estrae le righe dentro il primo blocco ` ```relations ` … ` ``` `; ogni riga `A --tipo--> B`. Ignora righe vuote e commenti `#`.
  - `serializeRelations(edges) → string` — produce il blocco ` ```relations ` con una riga per arco, ordinate per `source,type,target`.
  - `RELATIONS_BLOCK_RE` non necessario in API; interno.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/relations-parse.test.js`:
```js
import { describe, it, expect } from "vitest";
import { parseRelations, serializeRelations } from "../relations/parse.js";

const md = [
  "# Relazioni",
  "",
  "```relations",
  "lega-del-sale --ostile--> corte-d-ottone",
  "# commento",
  "divinita-cenere --patrona--> lega-del-sale",
  "```",
  "",
  "testo dopo",
].join("\n");

describe("parseRelations", () => {
  it("estrae gli archi dal blocco relations", () => {
    const edges = parseRelations(md);
    expect(edges).toEqual([
      { source: "lega-del-sale", type: "ostile", target: "corte-d-ottone" },
      { source: "divinita-cenere", type: "patrona", target: "lega-del-sale" },
    ]);
  });
  it("ritorna [] senza blocco", () => {
    expect(parseRelations("nessun blocco")).toEqual([]);
  });
});

describe("serializeRelations", () => {
  it("round-trip ordinato", () => {
    const edges = parseRelations(md);
    const out = serializeRelations(edges);
    const reparsed = parseRelations(out);
    expect(reparsed.sort((a,b)=>a.source.localeCompare(b.source)))
      .toEqual(edges.sort((a,b)=>a.source.localeCompare(b.source)));
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/relations-parse.test.js`
Expected: FAIL (moduli inesistenti).

- [ ] **Step 3: Implementare `lib/relations/parse.js`**

```js
const EDGE_RE = /^(.+?)\s*--(.+?)-->\s*(.+?)\s*$/;

export function parseRelations(markdown) {
  const lines = String(markdown).split("\n");
  const start = lines.findIndex((l) => l.trim() === "```relations");
  if (start === -1) return [];
  const edges = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "```") break;
    if (!line || line.startsWith("#")) continue;
    const m = line.match(EDGE_RE);
    if (m) edges.push({ source: m[1].trim(), type: m[2].trim(), target: m[3].trim() });
  }
  return edges;
}

export function serializeRelations(edges) {
  const sorted = [...edges].sort(
    (a, b) =>
      a.source.localeCompare(b.source) ||
      a.type.localeCompare(b.type) ||
      a.target.localeCompare(b.target)
  );
  const body = sorted.map((e) => `${e.source} --${e.type}--> ${e.target}`).join("\n");
  return "```relations\n" + body + "\n```\n";
}
```

- [ ] **Step 4: Eseguire i test e verificare il successo**

Run: `cd lib && npx vitest run test/relations-parse.test.js`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "feat(lib): parser/serializer del grafo relazioni (_relations.md)"
```

---

### Task 7: `lib/relations/graph.js` — query e merge degli archi

**Files:**
- Create: `lib/relations/graph.js`
- Test: `lib/test/relations-graph.test.js`

**Interfaces:**
- Consumes: `Edge` da `lib/relations/parse.js` (solo forma `{source,type,target}`).
- Produces:
  - `neighbors(edges, node) → Edge[]` — archi con `source === node` o `target === node`.
  - `outgoing(edges, node, type?) → Edge[]` — archi con `source === node` (filtrati per `type` se passato).
  - `mergeEdges(existing, incoming) → Edge[]` — unione senza duplicati esatti (`source|type|target`), preserva l'ordine di inserimento.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/relations-graph.test.js`:
```js
import { describe, it, expect } from "vitest";
import { neighbors, outgoing, mergeEdges } from "../relations/graph.js";

const edges = [
  { source: "a", type: "ostile", target: "b" },
  { source: "c", type: "patrona", target: "a" },
  { source: "a", type: "alleata", target: "d" },
];

describe("query", () => {
  it("neighbors include archi entranti e uscenti", () => {
    expect(neighbors(edges, "a").length).toBe(3);
  });
  it("outgoing filtra per tipo", () => {
    expect(outgoing(edges, "a", "alleata")).toEqual([{ source: "a", type: "alleata", target: "d" }]);
  });
});

describe("mergeEdges", () => {
  it("unisce senza duplicati esatti", () => {
    const out = mergeEdges(edges, [
      { source: "a", type: "ostile", target: "b" }, // dup
      { source: "b", type: "ostile", target: "a" }, // nuovo
    ]);
    expect(out.length).toBe(4);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/relations-graph.test.js`
Expected: FAIL (moduli inesistenti).

- [ ] **Step 3: Implementare `lib/relations/graph.js`**

```js
const key = (e) => `${e.source}|${e.type}|${e.target}`;

export function neighbors(edges, node) {
  return edges.filter((e) => e.source === node || e.target === node);
}

export function outgoing(edges, node, type) {
  return edges.filter((e) => e.source === node && (type ? e.type === type : true));
}

export function mergeEdges(existing, incoming) {
  const seen = new Set(existing.map(key));
  const out = [...existing];
  for (const e of incoming) {
    if (!seen.has(key(e))) {
      seen.add(key(e));
      out.push(e);
    }
  }
  return out;
}
```

- [ ] **Step 4: Eseguire i test e verificare il successo**

Run: `cd lib && npx vitest run test/relations-graph.test.js`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "feat(lib): query e merge del grafo relazioni"
```

---

### Task 8: Template della Setting Bible

**Files:**
- Create: `templates/setting-bible/_index.md`
- Create: `templates/setting-bible/00-overview.md`
- Create: `templates/setting-bible/10-cosmology.md`
- Create: `templates/setting-bible/20-geography/_index.md`
- Create: `templates/setting-bible/30-factions/_index.md`
- Create: `templates/setting-bible/40-pantheon/_index.md`
- Create: `templates/setting-bible/50-peoples.md`
- Create: `templates/setting-bible/60-timeline.md`
- Create: `templates/setting-bible/70-bestiary-custom/_index.md`
- Create: `templates/setting-bible/80-tables/_index.md`
- Create: `templates/setting-bible/90-glossary.md`
- Create: `templates/setting-bible/_relations.md`

**Interfaces:**
- Consumes: niente (file statici).
- Produces: scheletro copiato da `scaffoldSetting` (Task 9). Ogni file usa il placeholder `{{SETTING_NAME}}` dove serve il nome.

- [ ] **Step 1: Creare i file radice della Bible**

`templates/setting-bible/_index.md`:
```markdown
# {{SETTING_NAME}} — Setting Bible

Fonte di verità unica dell'ambientazione. Tutti i produttori (avventure, carte,
schermo del master) attingono da qui per la coerenza (canon).

- [Overview](00-overview.md)
- [Cosmologia](10-cosmology.md)
- [Geografia](20-geography/_index.md)
- [Fazioni](30-factions/_index.md)
- [Pantheon](40-pantheon/_index.md)
- [Popoli](50-peoples.md)
- [Timeline](60-timeline.md)
- [Bestiario custom](70-bestiary-custom/_index.md)
- [Tabelle](80-tables/_index.md)
- [Glossario](90-glossary.md)
- [Relazioni](_relations.md)
```

`templates/setting-bible/00-overview.md`:
```markdown
# {{SETTING_NAME}} — Overview

> Pitch in una frase: _…_

## Temi
-

## Toni
-

## Domande aperte
-
```

`templates/setting-bible/10-cosmology.md`:
```markdown
# Cosmologia

## Piani / Reami
-

## Forze fondamentali
-
```

`templates/setting-bible/50-peoples.md`:
```markdown
# Popoli

> Una voce per popolo: nome, dove vive, valori, attriti.
```

`templates/setting-bible/60-timeline.md`:
```markdown
# Timeline

> Voci in ordine cronologico. Formato: `AnnoEra — evento`.
```

`templates/setting-bible/90-glossary.md`:
```markdown
# Glossario

> Termini dell'ambientazione + dizionario IT↔EN dei termini di gioco
> (es. Tiro Salvezza ↔ Saving Throw) per coerenza bilingue.

| IT | EN | Note |
|----|----|------|
```

- [ ] **Step 2: Creare gli `_index.md` delle sottocartelle**

`templates/setting-bible/20-geography/_index.md`:
```markdown
# Geografia

> Una regione per file in questa cartella. Indice generato/mantenuto qui.
```

`templates/setting-bible/30-factions/_index.md`:
```markdown
# Fazioni

> Una fazione per file in questa cartella.
```

`templates/setting-bible/40-pantheon/_index.md`:
```markdown
# Pantheon

> Una divinità per file in questa cartella.
```

`templates/setting-bible/70-bestiary-custom/_index.md`:
```markdown
# Bestiario custom

> Mostri custom dell'ambientazione (possono derivare da record del compendio).
```

`templates/setting-bible/80-tables/_index.md`:
```markdown
# Tabelle

> Random table riutilizzabili. Usabili live con `/roll <tabella>`.
```

- [ ] **Step 3: Creare `_relations.md` con il blocco vuoto**

`templates/setting-bible/_relations.md`:
```markdown
# Relazioni

Grafo tipizzato tra entità del canon. Una riga per arco: `sorgente --tipo--> destinazione`.
Gli `id` sono slug (vedi i file delle entità). `lore-keeper` valida questo grafo.

```relations
```
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -s -m "feat(templates): scheletro della Setting Bible"
```

---

### Task 9: `lib/setting/scaffold.js` — logica di `/new-setting`

**Files:**
- Create: `lib/setting/scaffold.js`
- Test: `lib/test/scaffold.test.js`

**Interfaces:**
- Consumes: `writeFileSafe` da `lib/common/fs-atomic.js`; `ToolError`, `CODES` da `lib/common/errors.js`.
- Produces: `scaffoldSetting({ name, destDir, templatesDir, policy = "error", dryRun = false }) → { created: string[], actions: object[] }`. Copia ricorsivamente `templatesDir` in `destDir`, sostituendo `{{SETTING_NAME}}` con `name`, applicando `writeFileSafe` per ogni file (policy/dryRun propagati). Ritorna i path creati e le azioni.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/scaffold.test.js`:
```js
import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scaffoldSetting } from "../setting/scaffold.js";

function fakeTemplates() {
  const dir = mkdtempSync(join(tmpdir(), "tpl-"));
  writeFileSync(join(dir, "_index.md"), "# {{SETTING_NAME}} — Bible");
  mkdirSync(join(dir, "30-factions"));
  writeFileSync(join(dir, "30-factions", "_index.md"), "# Fazioni");
  return dir;
}

describe("scaffoldSetting", () => {
  it("crea l'albero sostituendo il nome", () => {
    const templatesDir = fakeTemplates();
    const destDir = join(mkdtempSync(join(tmpdir(), "dst-")), "setting");
    const res = scaffoldSetting({ name: "Cenere", destDir, templatesDir });
    expect(existsSync(join(destDir, "_index.md"))).toBe(true);
    expect(readFileSync(join(destDir, "_index.md"), "utf8")).toContain("Cenere — Bible");
    expect(existsSync(join(destDir, "30-factions", "_index.md"))).toBe(true);
    expect(res.created.length).toBe(2);
  });

  it("dryRun non scrive nulla", () => {
    const templatesDir = fakeTemplates();
    const destDir = join(mkdtempSync(join(tmpdir(), "dst-")), "setting");
    const res = scaffoldSetting({ name: "X", destDir, templatesDir, dryRun: true });
    expect(existsSync(destDir)).toBe(false);
    expect(res.actions.every((a) => a.action === "created")).toBe(true);
  });

  it("policy error: fallisce se un file esiste già", () => {
    const templatesDir = fakeTemplates();
    const destDir = join(mkdtempSync(join(tmpdir(), "dst-")), "setting");
    scaffoldSetting({ name: "X", destDir, templatesDir });
    expect(() => scaffoldSetting({ name: "X", destDir, templatesDir, policy: "error" })).toThrow();
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/scaffold.test.js`
Expected: FAIL (`scaffoldSetting` non esiste).

- [ ] **Step 3: Implementare `lib/setting/scaffold.js`**

```js
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { writeFileSafe } from "../common/fs-atomic.js";

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

export function scaffoldSetting({ name, destDir, templatesDir, policy = "error", dryRun = false }) {
  const files = walk(templatesDir);
  const created = [];
  const actions = [];
  for (const src of files) {
    const rel = relative(templatesDir, src);
    const dest = join(destDir, rel);
    const content = readFileSync(src, "utf8").replaceAll("{{SETTING_NAME}}", name);
    const res = writeFileSafe(dest, content, { policy, dryRun });
    actions.push(res);
    if (res.action !== "skipped") created.push(dest);
  }
  return { created, actions };
}
```

- [ ] **Step 4: Eseguire i test e verificare il successo**

Run: `cd lib && npx vitest run test/scaffold.test.js`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "feat(lib): scaffoldSetting (copia template + sostituzione nome)"
```

---

### Task 10: `bin/new-setting.js` — CLI di scaffold + `/new-setting` command + skill worldbuilding

**Files:**
- Create: `lib/bin/new-setting.js`
- Create: `commands/new-setting.md`
- Create: `skills/worldbuilding/SKILL.md`
- Test: `lib/test/new-setting-cli.test.js`

**Interfaces:**
- Consumes: `scaffoldSetting` da `lib/setting/scaffold.js`; `validateSettingConfig` da `lib/common/config.js`; `createLogger` da `lib/common/logger.js`.
- Produces: `runNewSetting(argv, env) → { code: number }` (testabile senza processo). CLI: `node lib/bin/new-setting.js <nome> [--dry-run] [--policy skip|overwrite|append|error]`. Usa `SETTING_PATH` come destinazione (default `./setting`), `templates/setting-bible` come sorgente (path risolto relativo alla root del plugin via `CLAUDE_PLUGIN_ROOT` o cwd).

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/new-setting-cli.test.js`:
```js
import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runNewSetting } from "../bin/new-setting.js";

function fakeRoot() {
  const root = mkdtempSync(join(tmpdir(), "root-"));
  const tpl = join(root, "templates", "setting-bible");
  mkdirSync(tpl, { recursive: true });
  writeFileSync(join(tpl, "_index.md"), "# {{SETTING_NAME}}");
  return root;
}

describe("runNewSetting", () => {
  it("scaffolda nella SETTING_PATH", () => {
    const root = fakeRoot();
    const settingPath = join(mkdtempSync(join(tmpdir(), "sp-")), "setting");
    mkdirSync(settingPath, { recursive: true });
    const { code } = runNewSetting(["Cenere"], {
      SETTING_PATH: settingPath, CLAUDE_PLUGIN_ROOT: root,
    });
    expect(code).toBe(0);
    expect(existsSync(join(settingPath, "_index.md"))).toBe(true);
  });

  it("ritorna code 1 senza nome", () => {
    const root = fakeRoot();
    const settingPath = mkdtempSync(join(tmpdir(), "sp-"));
    const { code } = runNewSetting([], { SETTING_PATH: settingPath, CLAUDE_PLUGIN_ROOT: root });
    expect(code).toBe(1);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/new-setting-cli.test.js`
Expected: FAIL (`runNewSetting` non esiste).

- [ ] **Step 3: Implementare `lib/bin/new-setting.js`**

```js
#!/usr/bin/env node
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { scaffoldSetting } from "../setting/scaffold.js";
import { validateSettingConfig } from "../common/config.js";
import { createLogger } from "../common/logger.js";

export function runNewSetting(argv, env) {
  const logger = createLogger(env);
  const args = argv.filter((a) => !a.startsWith("--"));
  const name = args[0];
  if (!name) {
    logger.error("Uso: new-setting <nome> [--dry-run] [--policy skip|overwrite|append|error]");
    return { code: 1 };
  }
  const dryRun = argv.includes("--dry-run");
  const pIdx = argv.indexOf("--policy");
  const policy = pIdx !== -1 ? argv[pIdx + 1] : "error";

  let cfg;
  try {
    cfg = validateSettingConfig(env);
  } catch (e) {
    logger.error(e.message);
    return { code: 1 };
  }
  const root = env.CLAUDE_PLUGIN_ROOT ?? process.cwd();
  const templatesDir = join(root, "templates", "setting-bible");
  try {
    const res = scaffoldSetting({ name, destDir: cfg.settingPath, templatesDir, policy, dryRun });
    for (const a of res.actions) logger.info(`${a.action} ${a.path}`);
    return { code: 0 };
  } catch (e) {
    logger.error(e.message);
    return { code: 1 };
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const { code } = runNewSetting(process.argv.slice(2), process.env);
  process.exit(code);
}
```

- [ ] **Step 4: Eseguire i test e verificare il successo**

Run: `cd lib && npx vitest run test/new-setting-cli.test.js`
Expected: PASS (2 test).

- [ ] **Step 5: Creare il comando `/new-setting`**

`commands/new-setting.md`:
```markdown
---
description: Crea lo scheletro di una nuova Setting Bible
argument-hint: <nome-ambientazione>
---

Crea la struttura della Setting Bible per l'ambientazione "$ARGUMENTS".

Esegui:
`node ${CLAUDE_PLUGIN_ROOT}/lib/bin/new-setting.js "$ARGUMENTS"`

La destinazione è `SETTING_PATH` (default `./setting`). Se la cartella contiene
già una Bible, riporta l'errore di collisione e proponi `--policy skip` o
`--dry-run` per vedere cosa cambierebbe. Dopo lo scaffold, riassumi i file creati
e suggerisci i prossimi passi (`/gen-region`, `/gen-faction`).
```

- [ ] **Step 6: Creare la skill `worldbuilding`**

`skills/worldbuilding/SKILL.md`:
```markdown
---
name: worldbuilding
description: Crea e fa evolvere un'ambientazione 5E-compatible (Setting Bible, regioni, fazioni, divinità, PNG, mostri) mantenendo il canon coerente. Usa quando l'utente vuole costruire un mondo, generare elementi d'ambientazione, o controllare la coerenza del canon.
---

# Worldbuilding

La **Setting Bible** (`SETTING_PATH`) è la fonte di verità unica. Ogni generazione
**legge il canon esistente e crea in tensione con esso** — niente "fantasy generico".

## Comandi
- `/new-setting <nome>` — scaffold della Bible.
- `/gen-region`, `/gen-faction`, `/gen-deity`, `/gen-npc`, `/gen-monster` — generano
  un elemento con input strutturati + seed table, e lo salvano nella Bible.
- `/lore-check` — `lore-keeper` valida la coerenza semantica del canon.

## Principi
1. **Input strutturati obbligatori** prima di generare (vedi ogni comando).
2. **Mutation contract:** ogni scrittura supporta `--dry-run`, ha una policy di
   collisione (`skip|overwrite|append|error`) ed è atomica.
3. **Archi di relazione:** ogni elemento generato dichiara i suoi archi
   (`sorgente --tipo--> destinazione`) che confluiscono in `_relations.md`.
4. **Campi segreti** marcati esplicitamente: non finiranno mai negli handout giocatori.
5. **Bilingue:** termini di gioco coerenti col glossario IT↔EN.
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -s -m "feat(worldbuilding): CLI/command /new-setting + skill worldbuilding"
```

---

### Task 11: Seed tables homebrew per i generatori

**Files:**
- Create: `templates/tables/faction-seed.json`
- Create: `templates/tables/region-seed.json`
- Create: `templates/tables/deity-seed.json`
- Create: `templates/tables/npc-seed.json`
- Test: `lib/test/seed-tables.test.js`

**Interfaces:**
- Consumes: niente.
- Produces: file JSON `{ "schema_version": "1.0", "table": "<nome>", "columns": { "<col>": [voci...] } }`. Tutte le voci sono **homebrew inventate**, neutre, riusabili. Usati dai generatori come seed d100 (la skill estrae voci a caso o su scelta dell'utente).

- [ ] **Step 1: Creare `templates/tables/faction-seed.json`**

```json
{
  "schema_version": "1.0",
  "table": "faction-seed",
  "columns": {
    "movente": ["vendetta antica", "purezza dottrinale", "controllo di una risorsa", "sopravvivenza", "ascesa sociale", "conoscenza proibita"],
    "metodo": ["infiltrazione", "forza aperta", "corruzione economica", "rituale", "propaganda", "alleanze mutevoli"],
    "simbolo": ["spirale di sale", "mano aperta bruciata", "chiave spezzata", "occhio cucito", "corona di ruggine", "nodo doppio"],
    "segreto": ["il capo è già morto", "servono una potenza esterna", "una scissione imminente", "un debito impagabile", "un ostaggio illustre", "un'eresia interna"]
  }
}
```

- [ ] **Step 2: Creare `templates/tables/region-seed.json`**

```json
{
  "schema_version": "1.0",
  "table": "region-seed",
  "columns": {
    "biomateria": ["paludi saline", "altopiani di cenere", "foreste sommerse", "deserto di vetro", "fiordi di basalto", "pianure di gesso"],
    "risorsa": ["sale rituale", "legno cavo", "minerale cantante", "acqua dolce", "spezia narcotica", "ossa fossili"],
    "minaccia": ["maree improvvise", "predoni nomadi", "muffa senziente", "crollo di gallerie", "nebbia che disorienta", "bestie migratorie"],
    "meraviglia": ["un faro che non si spegne", "un ponte vivente", "una voragine che canta", "rovine galleggianti", "un albero-calendario", "una porta murata"]
  }
}
```

- [ ] **Step 3: Creare `templates/tables/deity-seed.json`**

```json
{
  "schema_version": "1.0",
  "table": "deity-seed",
  "columns": {
    "dominio": ["soglie", "raccolto e carestia", "patti e debiti", "maree", "memoria", "fuoco domestico"],
    "simbolo": ["chiave di osso", "covone capovolto", "bilancia incrinata", "conchiglia spezzata", "filo rosso", "braciere coperto"],
    "richiesta": ["un silenzio annuale", "un dono bruciato", "un nome dimenticato", "una veglia in mare", "un debito onorato", "una porta lasciata aperta"],
    "tabu": ["spezzare il pane al buio", "contare le onde", "rifiutare un ospite", "spegnere un focolare altrui", "mentire su una soglia", "nominare i morti a tavola"]
  }
}
```

- [ ] **Step 4: Creare `templates/tables/npc-seed.json`**

```json
{
  "schema_version": "1.0",
  "table": "npc-seed",
  "columns": {
    "ruolo": ["mediatore", "contrabbandiere", "archivista", "guaritore", "esattore", "cartografo"],
    "tic": ["conta gli oggetti", "non guarda negli occhi", "cita proverbi inventati", "tocca un amuleto", "ride a sproposito", "parla in terza persona"],
    "vuole": ["riscattare un errore", "proteggere un segreto", "salire di rango", "ritrovare qualcuno", "saldare un debito", "fuggire lontano"],
    "segreto": ["è una spia", "ha tradito un alleato", "deve un favore impagabile", "nasconde un'identità", "ha rubato una reliquia", "sa di una morte non naturale"]
  }
}
```

- [ ] **Step 5: Scrivere il test che valida le seed table**

`lib/test/seed-tables.test.js`:
```js
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "templates", "tables");

describe("seed tables", () => {
  const files = readdirSync(dir).filter((f) => f.endsWith("-seed.json"));
  it("ci sono almeno 4 seed table", () => {
    expect(files.length).toBeGreaterThanOrEqual(4);
  });
  for (const f of ["faction-seed.json", "region-seed.json", "deity-seed.json", "npc-seed.json"]) {
    it(`${f} è ben formato e non vuoto`, () => {
      const data = JSON.parse(readFileSync(join(dir, f), "utf8"));
      expect(data.schema_version).toBe("1.0");
      expect(typeof data.table).toBe("string");
      const cols = Object.values(data.columns);
      expect(cols.length).toBeGreaterThanOrEqual(3);
      for (const entries of cols) expect(entries.length).toBeGreaterThanOrEqual(6);
    });
  }
});
```

- [ ] **Step 6: Eseguire il test e verificare il successo**

Run: `cd lib && npx vitest run test/seed-tables.test.js`
Expected: PASS (5 test).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -s -m "feat(templates): seed table homebrew per i generatori"
```

---

### Task 12: `lib/setting/apply-generation.js` — scrittura di un elemento generato nella Bible

**Files:**
- Create: `lib/setting/apply-generation.js`
- Test: `lib/test/apply-generation.test.js`

**Interfaces:**
- Consumes: `writeFileSafe` da `lib/common/fs-atomic.js`; `parseRelations`, `serializeRelations` da `lib/relations/parse.js`; `mergeEdges` da `lib/relations/graph.js`; `slugify` da `lib/common/slug.js`.
- Produces: `applyGeneration({ settingPath, element, policy = "error", dryRun = false }) → { actions: object[] }`.
  - `element = { kind, name, markdown, timelineEntry?, edges? }` con `kind ∈ {"region","faction","deity","npc","monster"}`.
  - Mappa `kind → subdir`: `region→20-geography`, `faction→30-factions`, `deity→40-pantheon`, `npc→30-factions/npcs` *(no: vedi sotto)*, `monster→70-bestiary-custom`. Per `npc` usa `30-factions/_npcs`. La scheda va in `<subdir>/<slug(name)>.md` (per region/faction/deity/monster) — gli npc in `<subdir>/_npcs/<slug>.md`.
  - Se `timelineEntry`, accoda una riga a `60-timeline.md` (policy `append`).
  - Se `edges`, fa merge in `_relations.md` (read → mergeEdges → serialize → overwrite atomico). In `dryRun` non scrive e riporta le azioni previste.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/apply-generation.test.js`:
```js
import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { applyGeneration } from "../setting/apply-generation.js";

function settingDir() {
  const dir = mkdtempSync(join(tmpdir(), "set-"));
  mkdirSync(join(dir, "30-factions"), { recursive: true });
  writeFileSync(join(dir, "60-timeline.md"), "# Timeline\n");
  writeFileSync(join(dir, "_relations.md"), "# Relazioni\n\n```relations\n```\n");
  return dir;
}

describe("applyGeneration", () => {
  it("scrive la scheda fazione, accoda timeline e fa merge relazioni", () => {
    const settingPath = settingDir();
    const res = applyGeneration({
      settingPath,
      element: {
        kind: "faction",
        name: "Lega del Sale",
        markdown: "# Lega del Sale\n\nFazione mercantile.",
        timelineEntry: "120 EC — fondazione della Lega del Sale",
        edges: [{ source: "lega-del-sale", type: "ostile", target: "corte-d-ottone" }],
      },
    });
    const scheda = join(settingPath, "30-factions", "lega-del-sale.md");
    expect(existsSync(scheda)).toBe(true);
    expect(readFileSync(join(settingPath, "60-timeline.md"), "utf8")).toContain("Lega del Sale");
    expect(readFileSync(join(settingPath, "_relations.md"), "utf8")).toContain("lega-del-sale --ostile--> corte-d-ottone");
    expect(res.actions.length).toBeGreaterThanOrEqual(3);
  });

  it("dryRun non scrive nulla", () => {
    const settingPath = settingDir();
    applyGeneration({
      settingPath, dryRun: true,
      element: { kind: "region", name: "Altopiano", markdown: "# Altopiano" },
    });
    expect(existsSync(join(settingPath, "20-geography", "altopiano.md"))).toBe(false);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/apply-generation.test.js`
Expected: FAIL (`applyGeneration` non esiste).

- [ ] **Step 3: Implementare `lib/setting/apply-generation.js`**

```js
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { writeFileSafe } from "../common/fs-atomic.js";
import { parseRelations, serializeRelations } from "../relations/parse.js";
import { mergeEdges } from "../relations/graph.js";
import { slugify } from "../common/slug.js";

const SUBDIR = {
  region: "20-geography",
  faction: "30-factions",
  deity: "40-pantheon",
  npc: join("30-factions", "_npcs"),
  monster: "70-bestiary-custom",
};

export function applyGeneration({ settingPath, element, policy = "error", dryRun = false }) {
  const { kind, name, markdown, timelineEntry, edges } = element;
  const subdir = SUBDIR[kind];
  if (!subdir) throw new Error(`kind sconosciuto: ${kind}`);
  const actions = [];

  // 1) scheda
  const schedaPath = join(settingPath, subdir, `${slugify(name)}.md`);
  actions.push(writeFileSafe(schedaPath, markdown.endsWith("\n") ? markdown : markdown + "\n", { policy, dryRun }));

  // 2) timeline (append)
  if (timelineEntry) {
    const tlPath = join(settingPath, "60-timeline.md");
    actions.push(writeFileSafe(tlPath, `\n${timelineEntry}\n`, { policy: "append", dryRun }));
  }

  // 3) relazioni (merge → overwrite)
  if (edges && edges.length) {
    const relPath = join(settingPath, "_relations.md");
    const existingMd = existsSync(relPath) ? readFileSync(relPath, "utf8") : "# Relazioni\n\n```relations\n```\n";
    const merged = mergeEdges(parseRelations(existingMd), edges);
    const header = existingMd.split("```relations")[0];
    const newMd = `${header}${serializeRelations(merged)}`;
    actions.push(writeFileSafe(relPath, newMd, { policy: "overwrite", dryRun }));
  }

  return { actions };
}
```

- [ ] **Step 4: Eseguire i test e verificare il successo**

Run: `cd lib && npx vitest run test/apply-generation.test.js`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "feat(lib): applyGeneration (scheda + timeline + merge relazioni)"
```

---

### Task 13: Comandi dei generatori `/gen-*`

**Files:**
- Create: `commands/gen-region.md`
- Create: `commands/gen-faction.md`
- Create: `commands/gen-deity.md`
- Create: `commands/gen-npc.md`
- Create: `commands/gen-monster.md`

**Interfaces:**
- Consumes: la skill `worldbuilding`; le seed table in `templates/tables/`; `lib/setting/apply-generation.js` (invocato dall'LLM via script Node inline o tramite un piccolo entry point — qui i comandi descrivono input/seed/contratto; l'integrazione runtime con `applyGeneration` è descritta nel comando).
- Produces: comandi slash con input strutturati obbligatori e contratto di mutazione documentato. Nessun test automatico (markdown).

- [ ] **Step 1: Creare `commands/gen-faction.md`**

```markdown
---
description: Genera una fazione coerente col canon e la salva nella Setting Bible
argument-hint: [regione] [risorsa-contesa]
---

Genera una **fazione** per l'ambientazione attiva (`SETTING_PATH`).

## Input obbligatori (chiedili se mancano)
- **Regione** di radicamento (deve esistere in `20-geography/`).
- **Risorsa contesa**.
- **Attrito** con ≥1 fazione esistente (leggi `30-factions/`).
- **Debolezza interna**.

## Seed (usa `templates/tables/faction-seed.json`)
Estrai o fai scegliere: `movente`, `metodo`, `simbolo`, `segreto`.

## Output
1. Una **scheda** markdown: nome, pitch, movente, metodo, struttura, simbolo,
   **segreto** (campo marcato `> SEGRETO (vista-DM):`), debolezza.
2. **1 gancio d'avventura**.
3. **1 voce timeline** (`Anno — evento`).
4. **Archi di relazione**: almeno l'attrito dichiarato, come
   `slug-fazione --ostile--> slug-altra`.

## Scrittura (mutation contract)
Costruisci l'oggetto `element = { kind:"faction", name, markdown, timelineEntry, edges }`
e scrivilo con `applyGeneration`. **Prima** mostra un `--dry-run` (diff) e chiedi
conferma; in caso di collisione proponi `--policy skip|overwrite|append`.
Poi, opzionale, lancia `/lore-check` per validare la coerenza.
```

- [ ] **Step 2: Creare `commands/gen-region.md`**

```markdown
---
description: Genera una regione coerente col canon e la salva nella Setting Bible
argument-hint: [tema]
---

Genera una **regione** per l'ambientazione attiva (`SETTING_PATH`).

## Input obbligatori (chiedili se mancano)
- **Tema/funzione** della regione nella campagna.
- **Confine** con ≥1 entità esistente (regione o fazione).

## Seed (usa `templates/tables/region-seed.json`)
Estrai o fai scegliere: `biomateria`, `risorsa`, `minaccia`, `meraviglia`.

## Output
1. **Scheda** markdown: nome, geografia, risorsa, minaccia, meraviglia, insediamenti.
2. **1 gancio d'avventura** legato alla minaccia o alla meraviglia.
3. **1 voce timeline** opzionale.
4. **Archi di relazione** verso le entità confinanti.

## Scrittura
`element = { kind:"region", name, markdown, timelineEntry?, edges? }` →
`applyGeneration` con `--dry-run` + conferma prima della scrittura.
```

- [ ] **Step 3: Creare `commands/gen-deity.md`**

```markdown
---
description: Genera una divinità coerente col canon e la salva nel pantheon
argument-hint: [dominio]
---

Genera una **divinità** per l'ambientazione attiva (`SETTING_PATH`).

## Input obbligatori (chiedili se mancano)
- **Dominio** principale.
- **Relazione** con ≥1 fazione o popolo esistente (patrona/avversa).

## Seed (usa `templates/tables/deity-seed.json`)
Estrai o fai scegliere: `dominio`, `simbolo`, `richiesta`, `tabu`.

## Output
1. **Scheda**: nome, dominio, simbolo, culto, richiesta, tabu, **segreto** (vista-DM).
2. **Archi di relazione** (`slug-divinita --patrona--> slug-fazione`).

## Scrittura
`element = { kind:"deity", name, markdown, edges? }` → `applyGeneration`
(`--dry-run` + conferma).
```

- [ ] **Step 4: Creare `commands/gen-npc.md`**

```markdown
---
description: Genera un PNG coerente col canon e lo salva nella Setting Bible
argument-hint: [ruolo]
---

Genera un **PNG** per l'ambientazione attiva (`SETTING_PATH`).

## Input obbligatori (chiedili se mancano)
- **Fazione/luogo** di appartenenza (deve esistere).
- **Funzione** nella storia (alleato, ostacolo, jolly).

## Seed (usa `templates/tables/npc-seed.json`)
Estrai o fai scegliere: `ruolo`, `tic`, `vuole`, `segreto`.

## Output
1. **Scheda**: nome, ruolo, voce/tic, cosa vuole, **segreto** (vista-DM), fazione.
2. **Archi di relazione** (`slug-png --subordinato--> slug-fazione`).

## Scrittura
`element = { kind:"npc", name, markdown, edges? }` → `applyGeneration`
(salva in `30-factions/_npcs/`, `--dry-run` + conferma).
```

- [ ] **Step 5: Creare `commands/gen-monster.md`**

```markdown
---
description: Genera un mostro custom coerente col canon e lo salva nel bestiario
argument-hint: [nicchia]
---

Genera un **mostro custom** per l'ambientazione attiva (`SETTING_PATH`).

## Input obbligatori (chiedili se mancano)
- **Nicchia ecologica/narrativa** (predatore d'agguato, guardiano, simbionte…).
- **Legame** con una regione o fazione esistente.

## Output
1. **Scheda**: nome, descrizione, comportamento, gancio d'uso. Se servono valori di
   gioco, restano **compatibili con la Quinta Edizione** e coerenti (CR/HP/AC
   plausibili); il sanity-check CR completo è backlog.
2. **Archi di relazione** verso la regione/fazione legata.

## Scrittura
`element = { kind:"monster", name, markdown, edges? }` → `applyGeneration`
(salva in `70-bestiary-custom/`, `--dry-run` + conferma).
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -s -m "feat(worldbuilding): comandi /gen-region|faction|deity|npc|monster"
```

---

### Task 14: `lib/lorekeeper/check.js` — controlli semantici sul grafo

**Files:**
- Create: `lib/lorekeeper/check.js`
- Test: `lib/test/lorekeeper.test.js`

**Interfaces:**
- Consumes: `Edge` da `lib/relations/parse.js` (forma `{source,type,target}`).
- Produces: `checkCanon({ edges, knownIds }) → { discrepancies: Discrepancy[] }` con `Discrepancy = { code, message, nodes }`.
  - **DANGLING_REF**: arco che punta a un `id` non in `knownIds`.
  - **CONTRADICTION**: stessa coppia `(source,target)` con tipi mutuamente esclusivi (`ostile` + `alleata`).
  - **SELF_LOOP**: `source === target`.
  - `EXCLUSIVE = [["ostile","alleata"]]` (estendibile). Confronto simmetrico sulla coppia non orientata.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/lorekeeper.test.js`:
```js
import { describe, it, expect } from "vitest";
import { checkCanon } from "../lorekeeper/check.js";

describe("checkCanon", () => {
  it("segnala riferimenti pendenti", () => {
    const r = checkCanon({
      edges: [{ source: "a", type: "ostile", target: "ignoto" }],
      knownIds: ["a"],
    });
    expect(r.discrepancies.some((d) => d.code === "DANGLING_REF")).toBe(true);
  });

  it("segnala contraddizione ostile+alleata sulla stessa coppia", () => {
    const r = checkCanon({
      edges: [
        { source: "a", type: "ostile", target: "b" },
        { source: "b", type: "alleata", target: "a" },
      ],
      knownIds: ["a", "b"],
    });
    expect(r.discrepancies.some((d) => d.code === "CONTRADICTION")).toBe(true);
  });

  it("segnala self-loop", () => {
    const r = checkCanon({ edges: [{ source: "a", type: "ostile", target: "a" }], knownIds: ["a"] });
    expect(r.discrepancies.some((d) => d.code === "SELF_LOOP")).toBe(true);
  });

  it("canon pulito → nessuna discrepanza", () => {
    const r = checkCanon({
      edges: [{ source: "a", type: "alleata", target: "b" }],
      knownIds: ["a", "b"],
    });
    expect(r.discrepancies).toEqual([]);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/lorekeeper.test.js`
Expected: FAIL (`checkCanon` non esiste).

- [ ] **Step 3: Implementare `lib/lorekeeper/check.js`**

```js
const EXCLUSIVE = [["ostile", "alleata"]];

function pairKey(a, b) {
  return [a, b].sort().join("|");
}

export function checkCanon({ edges, knownIds }) {
  const known = new Set(knownIds);
  const discrepancies = [];

  // DANGLING_REF + SELF_LOOP
  for (const e of edges) {
    if (e.source === e.target) {
      discrepancies.push({ code: "SELF_LOOP", message: `Arco su sé stesso: ${e.source} --${e.type}--> ${e.target}`, nodes: [e.source] });
    }
    for (const node of [e.source, e.target]) {
      if (!known.has(node)) {
        discrepancies.push({ code: "DANGLING_REF", message: `Riferimento a id sconosciuto: ${node}`, nodes: [node] });
      }
    }
  }

  // CONTRADICTION: tipi mutuamente esclusivi sulla stessa coppia non orientata
  const byPair = new Map();
  for (const e of edges) {
    const k = pairKey(e.source, e.target);
    if (!byPair.has(k)) byPair.set(k, new Set());
    byPair.get(k).add(e.type);
  }
  for (const [k, types] of byPair) {
    for (const [x, y] of EXCLUSIVE) {
      if (types.has(x) && types.has(y)) {
        discrepancies.push({ code: "CONTRADICTION", message: `Coppia ${k} ha tipi mutuamente esclusivi: ${x} + ${y}`, nodes: k.split("|") });
      }
    }
  }

  return { discrepancies };
}
```

- [ ] **Step 4: Eseguire i test e verificare il successo**

Run: `cd lib && npx vitest run test/lorekeeper.test.js`
Expected: PASS (4 test).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "feat(lib): lore-keeper checkCanon (dangling/contraddizioni/self-loop)"
```

---

### Task 15: `lib/bin/lore-check.js` + agent + comando `/lore-check`

**Files:**
- Create: `lib/lorekeeper/collect.js`
- Create: `lib/bin/lore-check.js`
- Create: `agents/lore-keeper.md`
- Create: `commands/lore-check.md`
- Test: `lib/test/lore-check-cli.test.js`

**Interfaces:**
- Consumes: `parseRelations` da `lib/relations/parse.js`; `checkCanon` da `lib/lorekeeper/check.js`; `validateSettingConfig` da `lib/common/config.js`; `createLogger` da `lib/common/logger.js`.
- Produces:
  - `collectKnownIds(settingPath) → string[]` — slug dei file `.md` (senza estensione) nelle sottocartelle di entità (`20-geography`, `30-factions`, `30-factions/_npcs`, `40-pantheon`, `70-bestiary-custom`), esclusi gli `_index.md`/`_*`.
  - `runLoreCheck(argv, env) → { code, report }` — legge `_relations.md`, raccoglie gli id noti, esegue `checkCanon`, stampa un report su stderr; `code` = 0 se nessuna discrepanza, 2 se ce ne sono.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/lore-check-cli.test.js`:
```js
import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { collectKnownIds, runLoreCheck } from "../bin/lore-check.js";

function setup(relations) {
  const dir = mkdtempSync(join(tmpdir(), "lc-"));
  mkdirSync(join(dir, "30-factions"), { recursive: true });
  writeFileSync(join(dir, "30-factions", "_index.md"), "# Fazioni");
  writeFileSync(join(dir, "30-factions", "lega-del-sale.md"), "# Lega del Sale");
  writeFileSync(join(dir, "30-factions", "corte-d-ottone.md"), "# Corte d'Ottone");
  writeFileSync(join(dir, "_relations.md"), "# Relazioni\n\n```relations\n" + relations + "\n```\n");
  return dir;
}

describe("collectKnownIds", () => {
  it("raccoglie gli slug delle entità, esclude gli _index", () => {
    const dir = setup("");
    const ids = collectKnownIds(dir);
    expect(ids).toContain("lega-del-sale");
    expect(ids).toContain("corte-d-ottone");
    expect(ids).not.toContain("_index");
  });
});

describe("runLoreCheck", () => {
  it("code 0 su canon pulito", () => {
    const dir = setup("lega-del-sale --ostile--> corte-d-ottone");
    const { code } = runLoreCheck([], { SETTING_PATH: dir });
    expect(code).toBe(0);
  });
  it("code 2 con riferimento pendente", () => {
    const dir = setup("lega-del-sale --ostile--> fantasma");
    const { code, report } = runLoreCheck([], { SETTING_PATH: dir });
    expect(code).toBe(2);
    expect(report.discrepancies.some((d) => d.code === "DANGLING_REF")).toBe(true);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/lore-check-cli.test.js`
Expected: FAIL (moduli inesistenti).

- [ ] **Step 3: Implementare `lib/lorekeeper/collect.js`**

```js
import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ENTITY_DIRS = [
  "20-geography",
  "30-factions",
  join("30-factions", "_npcs"),
  "40-pantheon",
  "70-bestiary-custom",
];

export function collectKnownIds(settingPath) {
  const ids = [];
  for (const sub of ENTITY_DIRS) {
    const dir = join(settingPath, sub);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".md")) continue;
      if (f.startsWith("_")) continue; // _index.md ed entry tecniche
      ids.push(f.replace(/\.md$/, ""));
    }
  }
  return ids;
}
```

- [ ] **Step 4: Implementare `lib/bin/lore-check.js`**

```js
#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { parseRelations } from "../relations/parse.js";
import { checkCanon } from "../lorekeeper/check.js";
import { collectKnownIds } from "../lorekeeper/collect.js";
import { validateSettingConfig } from "../common/config.js";
import { createLogger } from "../common/logger.js";

export { collectKnownIds };

export function runLoreCheck(argv, env) {
  const logger = createLogger(env);
  let cfg;
  try {
    cfg = validateSettingConfig(env);
  } catch (e) {
    logger.error(e.message);
    return { code: 1, report: { discrepancies: [] } };
  }
  const relPath = join(cfg.settingPath, "_relations.md");
  const md = existsSync(relPath) ? readFileSync(relPath, "utf8") : "";
  const edges = parseRelations(md);
  const knownIds = collectKnownIds(cfg.settingPath);
  const report = checkCanon({ edges, knownIds });
  for (const d of report.discrepancies) logger.warn(`${d.code}: ${d.message}`);
  if (report.discrepancies.length === 0) logger.info("lore-check: canon coerente");
  return { code: report.discrepancies.length ? 2 : 0, report };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const { code } = runLoreCheck(process.argv.slice(2), process.env);
  process.exit(code);
}
```

- [ ] **Step 5: Eseguire i test e verificare il successo**

Run: `cd lib && npx vitest run test/lore-check-cli.test.js`
Expected: PASS (3 test).

- [ ] **Step 6: Creare l'agent `lore-keeper`**

`agents/lore-keeper.md`:
```markdown
---
name: lore-keeper
description: Validatore semantico del canon di un'ambientazione. Usa il grafo relazioni e le schede della Setting Bible per rilevare incoerenze di design (nemici che collaborano, riferimenti pendenti, timeline impossibili). Read-only sulla Bible.
tools: Read, Glob, Grep, Bash
---

Sei **lore-keeper**, custode della coerenza del canon. Lavori **read-only** sulla
Setting Bible (`SETTING_PATH`).

## Procedura
1. Esegui il check meccanico: `node ${CLAUDE_PLUGIN_ROOT}/lib/bin/lore-check.js`.
   Riporta le discrepanze strutturali (DANGLING_REF, CONTRADICTION, SELF_LOOP).
2. Oltre al check meccanico, leggi le schede coinvolte e valuta incoerenze
   **semantiche** che lo script non coglie: miracoli fuori dominio di una divinità,
   alleanze incompatibili coi moventi dichiarati, eventi di timeline causalmente
   impossibili, segreti che si contraddicono.
3. Produci un **report di discrepanze** ordinato per gravità, con i file/entità
   coinvolti e una proposta di correzione per ciascuna. Non modificare nulla.
```

- [ ] **Step 7: Creare il comando `/lore-check`**

`commands/lore-check.md`:
```markdown
---
description: Verifica la coerenza semantica del canon (lore-keeper)
---

Invoca l'agent **lore-keeper** per validare il canon dell'ambientazione attiva
(`SETTING_PATH`).

Per prima cosa lancia il check meccanico:
`node ${CLAUDE_PLUGIN_ROOT}/lib/bin/lore-check.js`

Poi chiedi a lore-keeper di completare con l'analisi semantica e di restituire un
report di discrepanze con proposte di correzione (read-only, nessuna modifica).
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -s -m "feat(worldbuilding): lore-keeper CLI + agent + comando /lore-check"
```

---

### Task 16: Integrazione — riesporti `lib/index.js`, README, denylist, suite completa

**Files:**
- Modify: `lib/index.js` (riesporta le API pubbliche)
- Modify: `README.md` (sezione Worldbuilding)
- Test: `lib/test/index.test.js`

**Interfaces:**
- Consumes: tutte le API pubbliche dei task precedenti.
- Produces: punto di import unico `lib/index.js`; documentazione utente; verifica che denylist e suite completa siano verdi.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/index.test.js`:
```js
import { describe, it, expect } from "vitest";
import * as api from "../index.js";

describe("lib/index", () => {
  it("riesporta le API pubbliche worldbuilding", () => {
    for (const name of ["slugify", "writeFileSafe", "validateSettingConfig",
      "parseRelations", "serializeRelations", "mergeEdges", "scaffoldSetting",
      "applyGeneration", "checkCanon"]) {
      expect(typeof api[name]).toBe("function");
    }
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/index.test.js`
Expected: FAIL (riesporti assenti).

- [ ] **Step 3: Implementare i riesporti in `lib/index.js`**

```js
export { slugify } from "./common/slug.js";
export { writeFileSafe } from "./common/fs-atomic.js";
export { validateSettingConfig } from "./common/config.js";
export { ToolError, CODES } from "./common/errors.js";
export { createLogger } from "./common/logger.js";
export { parseRelations, serializeRelations } from "./relations/parse.js";
export { neighbors, outgoing, mergeEdges } from "./relations/graph.js";
export { scaffoldSetting } from "./setting/scaffold.js";
export { applyGeneration } from "./setting/apply-generation.js";
export { checkCanon } from "./lorekeeper/check.js";
export { collectKnownIds } from "./lorekeeper/collect.js";
```

- [ ] **Step 4: Eseguire il test e verificare il successo**

Run: `cd lib && npx vitest run test/index.test.js`
Expected: PASS (1 test).

- [ ] **Step 5: Aggiornare il README con la sezione Worldbuilding**

In `README.md`, dopo la tabella di configurazione, aggiungere:
```markdown
## Worldbuilding

Crea un'ambientazione e mantienila coerente:

    SETTING_PATH=./setting   # cartella della tua Setting Bible

- `/new-setting <nome>` — crea lo scheletro della Setting Bible.
- `/gen-region`, `/gen-faction`, `/gen-deity`, `/gen-npc`, `/gen-monster` —
  generano elementi coerenti col canon (input strutturati + seed table). Ogni
  scrittura supporta `--dry-run` e una policy di collisione (`skip|overwrite|append|error`).
- `/lore-check` — `lore-keeper` valida la coerenza semantica del canon.

Le utility deterministiche stanno in `lib/` (Node ESM, testate con vitest).
```

- [ ] **Step 6: Verificare denylist e suite completa**

Run: `node scripts/check-denylist.mjs`
Expected: `denylist: pulito`.

Run: `cd lib && npx vitest run`
Expected: PASS (tutti i file: common, config, slug, fs-atomic, relations-parse, relations-graph, scaffold, new-setting-cli, seed-tables, apply-generation, lorekeeper, lore-check-cli, index).

Run: `cd mcp/compendium-reader && npx vitest run`
Expected: PASS (35 test invariati — nessuna regressione).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -s -m "feat(worldbuilding): riesporti lib/index + README + verifica suite/denylist"
```

---

## Self-Review

**1. Spec coverage (§ dello spec → task):**
- §5.1 Setting Bible scaffold (`/new-setting`, struttura cartelle) → Task 8 (template) + 9 (scaffold) + 10 (CLI/command) ✓
- §5.2 Grafo relazioni (`_relations.md`, archi tipizzati) → Task 6 (parse/serialize) + 7 (query/merge) + 8 (template blocco) ✓
- §5.3 Generatori on-demand (input strutturati + seed table) → Task 11 (seed) + 13 (comandi `/gen-*`) ✓
- §5.3 Mutation contract (`--dry-run`, policy collisione, write atomico) → Task 5 (fs-atomic) + 12 (apply-generation) ✓
- §11 lore-keeper validatore semantico (grafo) → Task 14 (checkCanon) + 15 (CLI/agent/comando) ✓
- §14 config-validation (`SETTING_PATH`) + logging stderr → Task 2 (logger/errors) + 3 (config) ✓
- §4.1 `id` stabile (slug) — riuso del principio per le entità Bible → Task 4 (slugify) ✓
- §15 denylist/compliance su nuova superficie → Task 16 (verifica denylist) ✓; CI estesa → Task 1 ✓
- Vincoli cross-platform / LF / ESM → Global Constraints, rispettati nei moduli (`node:path`, `pathToFileURL`) ✓
- Fuori scope worldbuilding (per decisione): §12 output condivisi (session-prep/handout/tables `/roll`), §6 adventure, §7–§10 produzione/visuals → piani successivi.

**2. Placeholder scan:** ogni step ha codice o comando concreto; nessun "TBD"/"add error handling" generico. ✓ (Nota: i comandi `/gen-*` e le skill sono markdown senza test automatico — esplicitamente dichiarato; la logica testabile sta nelle lib.)

**3. Type consistency:**
- `Edge {source,type,target}` coerente tra Task 6, 7, 12, 14.
- `writeFileSafe(path, content, {policy,dryRun})` → `{action,path,diff?}` usato in Task 9, 12 come definito in Task 5.
- `scaffoldSetting({name,destDir,templatesDir,policy,dryRun})` coerente tra Task 9 e 10.
- `applyGeneration({settingPath,element,policy,dryRun})` con `element={kind,name,markdown,timelineEntry?,edges?}` coerente tra Task 12 e i comandi (Task 13).
- `checkCanon({edges,knownIds})→{discrepancies}` coerente tra Task 14 e 15.
- `validateSettingConfig→{settingPath,lang}` usato in Task 10 e 15 come da Task 3.
- `slugify` usato in Task 12 come da Task 4.
- `collectKnownIds(settingPath)→string[]` definito in Task 15 (collect.js) e riesportato in Task 16. ✓

> Nota implementativa: l'integrazione runtime dei comandi `/gen-*` con `applyGeneration` è descritta nei comandi (markdown) e affidata all'LLM che costruisce l'oggetto `element` e invoca la lib; non c'è un singolo entry point `gen.js` perché il contenuto della scheda è generato dall'LLM, non deterministico. La parte deterministica (scrittura/merge/atomicità) è interamente testata in Task 12.

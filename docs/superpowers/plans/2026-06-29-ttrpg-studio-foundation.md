# TTRPG Studio — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Costruire le fondamenta del plugin TTRPG Studio: scheletro del repo open-source + il server MCP `compendium-reader` (schema dati formale, store con indice/cache, tool read-only), con dataset homebrew d'esempio e CI.

**Architecture:** Plugin Claude Code in un repo git autonomo. Il cuore della Foundation è un server MCP Node (stdio) che legge una cartella "compendio" fornita dall'utente (`GAME_DATA_PATH`), la valida contro JSON Schema derivati da Zod, la indicizza in memoria con cache invalidata da `mtime`, ed espone tool `search`/`list`/`get`/`read_file` con paginazione e proiezione campi. Nessun dato di gioco coperto da copyright nel repo: solo un dataset d'esempio 100% homebrew, usato anche come fixture di test.

**Tech Stack:** Node.js ≥20 (ESM), `@modelcontextprotocol/sdk`, `zod`, `zod-to-json-schema`, `minisearch`, `vitest`. Apache-2.0 (codice) + CC-BY-4.0 (contenuti).

## Global Constraints

- **Zero contenuti coperti da copyright** nel repo; **zero segreti** committati; **zero riferimenti a marchi/strumenti di terze parti** in codice, nomi tool e documentazione.
- Esempi di dato: **solo homebrew inventato**; campo `source` negli esempi = `"HomebrewExample"`.
- Compatibilità nominativa: usare sempre **"compatibile con la Quinta Edizione" / "5E-compatible"**, mai "D&D"/"D&D 5e".
- **Licenza dual:** codice **Apache-2.0** (`LICENSE`), contenuti/asset **CC-BY-4.0** (`LICENSE-CONTENT`).
- **Cross-platform:** solo `path.join`/`path.sep`/`node:path`; nessuna assunzione Windows; nessuna dipendenza Python.
- **MCP stdio:** stdout è riservato al protocollo — ogni log va su **stderr**.
- Ogni file dati ha `"schema_version": "1.0"`; ogni record ha `id` stabile e univoco distinto dal `name`.
- Tutti i tool del reader sono **read-only e idempotenti**; errori in forma uniforme `{code, message, retriable}`.
- Node ESM: `package.json` con `"type": "module"`.

---

### Task 1: Scaffolding repo + file di compliance open-source

**Files:**
- Create: `LICENSE` (Apache-2.0 testo integrale)
- Create: `LICENSE-CONTENT` (CC-BY-4.0 — riferimento + testo deed)
- Create: `NOTICE`
- Create: `DISCLAIMER.md`
- Create: `CONTRIBUTING.md`
- Create: `CODE_OF_CONDUCT.md`
- Create: `SECURITY.md`
- Create: `README.md`
- Create: `CHANGELOG.md`
- Create: `.claude-plugin/plugin.json`
- Modify: `.gitignore` (già presente con base; aggiungere voci)

**Interfaces:**
- Consumes: niente.
- Produces: `.claude-plugin/plugin.json` (manifest consumato da Claude Code); struttura repo per i task successivi.

- [ ] **Step 1: Creare `LICENSE` con il testo integrale di Apache-2.0**

Scaricare/incollare il testo ufficiale Apache License 2.0 (https://www.apache.org/licenses/LICENSE-2.0.txt). Nella sezione "APPENDIX → copyright notice" usare:
```
Copyright 2026 Giobbo

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

- [ ] **Step 2: Creare `LICENSE-CONTENT` per gli asset/contenuti**

```markdown
# Content License — CC BY 4.0

Tutti i **contenuti e asset** di questo repository — i template in `templates/`,
gli scheletri della Setting Bible, e i dati d'esempio in `examples/` — sono
rilasciati sotto **Creative Commons Attribution 4.0 International (CC BY 4.0)**.

Testo completo: https://creativecommons.org/licenses/by/4.0/legalcode
Sintesi (deed): https://creativecommons.org/licenses/by/4.0/

Il **codice** (tutto il resto) è invece rilasciato sotto Apache-2.0 — vedi `LICENSE`.

Attribuzione suggerita:
> "TTRPG Studio" content by Giobbo, CC BY 4.0.
```

- [ ] **Step 3: Creare `NOTICE` con attribuzioni e stringhe SRD pronte**

```markdown
# NOTICE

TTRPG Studio
Copyright 2026 Giobbo

Codice: Apache License 2.0 (vedi LICENSE).
Contenuti/asset: CC BY 4.0 (vedi LICENSE-CONTENT).

Questo progetto NON distribuisce contenuti di gioco coperti da copyright e non
è affiliato né approvato da alcun editore.

---

## Uso di dati SRD (a cura dell'utente)

Se popoli la tua cartella dati con materiale tratto dal System Reference Document,
sei tu responsabile dell'attribuzione richiesta dalla relativa licenza:

- SRD 5.1 — disponibile sotto CC BY 4.0:
  "This work includes material from the System Reference Document 5.1
   ... licensed under the Creative Commons Attribution 4.0 International License."

- SRD 5.2 — disponibile sotto CC BY 4.0:
  "This work includes material from the System Reference Document 5.2
   ... licensed under the Creative Commons Attribution 4.0 International License."

(Inserisci la stringa di attribuzione completa fornita dal documento che usi.)
```

- [ ] **Step 4: Creare `DISCLAIMER.md` (bilingue)**

```markdown
# Disclaimer / Avvertenze

**IT** — TTRPG Studio è uno strumento generico. Non distribuisce contenuti di
gioco. Sei responsabile di possedere i diritti sui dati che indichi tramite
`GAME_DATA_PATH`. Il progetto non è affiliato, sponsorizzato o approvato da
Wizards of the Coast / Hasbro né da alcun servizio terzo automatizzabile dal
plugin. L'arte generata da provider esterni e l'eventuale automazione di servizi
web sono soggette ai rispettivi Termini di Servizio e licenze, di cui sei
responsabile. Questo non è un parere legale.

**EN** — TTRPG Studio is a general-purpose tool. It does not distribute game
content. You are responsible for holding the rights to any data you point it to
via `GAME_DATA_PATH`. This project is not affiliated with, sponsored by, or
endorsed by Wizards of the Coast / Hasbro, nor by any third-party service the
plugin may automate. Art generated by external providers and any web-service
automation are subject to their own Terms of Service and licenses, for which you
are responsible. This is not legal advice.
```

- [ ] **Step 5: Creare `CONTRIBUTING.md` con IP gate + DCO**

```markdown
# Contributing

Grazie per il contributo! Regole non negoziabili (IP gate):

1. **Niente contenuti coperti da copyright** in PR (stat block, testo di
   manuali commerciali, ecc.).
2. **Niente nomi di marchi o prodotti di terze parti** in codice, nomi di
   funzioni/tool, o documentazione. Usa "5E-compatible".
3. **Niente segreti** (chiavi, token) nei commit.
4. Tutti gli esempi di dato sono **homebrew inventato** o **SRD sotto CC-BY** con
   attribuzione; `source` negli esempi = `"HomebrewExample"`.

## DCO
Ogni commit deve essere firmato con `Signed-off-by` (Developer Certificate of
Origin): usa `git commit -s`.

## Checklist PR
- [ ] No segreti  - [ ] No dati coperti  - [ ] No marchi terzi  - [ ] Test verdi
```

- [ ] **Step 6: Creare `CODE_OF_CONDUCT.md` e `SECURITY.md`**

`CODE_OF_CONDUCT.md`: incollare il testo standard **Contributor Covenant v2.1** (https://www.contributor-covenant.org/version/2/1/code_of_conduct/), con contatto `giovanni.bibbo@gmail.com`.

`SECURITY.md`:
```markdown
# Security Policy

## Segnalare una vulnerabilità o un segreto committato per errore
Scrivi a **giovanni.bibbo@gmail.com**. Non aprire issue pubbliche per segnalazioni
di sicurezza o per chiavi/segreti finiti nella git history.

## Chiavi dei provider
Le chiavi (es. `IMAGE_API_KEY`) si forniscono solo via variabili d'ambiente, mai
nel repo. Vedi README → Configurazione.
```

- [ ] **Step 7: Creare `README.md` (bilingue, neutro)**

```markdown
# TTRPG Studio

Plugin Claude Code per creare e produrre materiale di gioco **compatibile con la
Quinta Edizione (5E-compatible)**: worldbuilding, avventure, carte oggetto,
schermo del master, mappe e arte.

> Non affiliato né approvato da alcun editore. Non distribuisce contenuti di
> gioco — leggi i tuoi dati da una cartella che fornisci tu. Vedi `DISCLAIMER.md`.

## Licenza
Codice: **Apache-2.0** (`LICENSE`). Contenuti/asset: **CC BY 4.0**
(`LICENSE-CONTENT`).

## Quickstart (5 minuti)
Il plugin include un piccolo dataset **homebrew** in `examples/compendium-homebrew/`
per provarlo senza dati esterni:

    GAME_DATA_PATH=./examples/compendium-homebrew GAME_DATA_LANG=it

## Configurazione
| Env | Significato |
|-----|-------------|
| `GAME_DATA_PATH` | cartella del tuo compendio (vedi `mcp/compendium-reader/schema/SCHEMA.md`) |
| `GAME_DATA_LANG` | `it` o `en` (fallback per-campo `it→en`) |
| `TTRPG_DEBUG` | `1` per log di debug su stderr |
```

(README sarà esteso dai piani successivi; per ora copre Foundation.)

- [ ] **Step 8: Creare `CHANGELOG.md`**

```markdown
# Changelog

## [Unreleased]
### Added
- Foundation: scheletro repo, file di compliance, MCP `compendium-reader`,
  dataset homebrew d'esempio, CI.
```

- [ ] **Step 9: Creare `.claude-plugin/plugin.json`**

```json
{
  "name": "ttrpg-studio",
  "version": "0.1.0",
  "description": "Worldbuilding e produzione di materiale 5E-compatible: avventure, carte, schermo del master, mappe, arte.",
  "license": "Apache-2.0",
  "keywords": ["ttrpg", "5e-compatible", "worldbuilding", "claude-code-plugin"],
  "mcpServers": {
    "compendium-reader": {
      "type": "stdio",
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/mcp/compendium-reader/index.js"],
      "env": {}
    }
  }
}
```

- [ ] **Step 10: Aggiornare `.gitignore`**

Assicurarsi che contenga (aggiungere le voci mancanti):
```
# Dati di gioco e Setting Bible utente (mai committare)
/data/
/setting/
# Segreti
.env
*.key
# Output generati
/output/
*.pdf
# Node
node_modules/
# eccezione: il dataset d'esempio homebrew DEVE essere versionato
!examples/compendium-homebrew/**
```

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -s -m "chore: repo scaffolding + open-source compliance files"
```

---

### Task 2: Inizializzare il progetto Node del server MCP

**Files:**
- Create: `mcp/compendium-reader/package.json`
- Create: `vitest.config.js`
- Create: `mcp/compendium-reader/index.js` (placeholder eseguibile)

**Interfaces:**
- Consumes: niente.
- Produces: ambiente Node/ESM con dipendenze e test runner per tutti i task seguenti.

- [ ] **Step 1: Creare `mcp/compendium-reader/package.json`**

```json
{
  "name": "compendium-reader",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "bin": { "compendium-reader": "index.js" },
  "scripts": {
    "test": "vitest run",
    "schema": "node schema/emit-json-schema.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "minisearch": "^7.0.0",
    "zod": "^3.23.0",
    "zod-to-json-schema": "^3.23.0"
  },
  "devDependencies": {
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Installare le dipendenze**

Run: `cd mcp/compendium-reader && npm install`
Expected: crea `node_modules/` e `package-lock.json` senza errori.

- [ ] **Step 3: Creare `vitest.config.js` nella root del server MCP**

`mcp/compendium-reader/vitest.config.js`:
```js
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { environment: "node", include: ["test/**/*.test.js"] },
});
```

- [ ] **Step 4: Creare `index.js` placeholder eseguibile**

`mcp/compendium-reader/index.js`:
```js
#!/usr/bin/env node
// Entry point del server MCP compendium-reader. Implementato nel Task 10.
console.error("[compendium-reader] entry point — not yet wired");
```

- [ ] **Step 5: Verificare che il runner parta (nessun test ancora)**

Run: `cd mcp/compendium-reader && npx vitest run`
Expected: esce con "No test files found" (exit 0 o messaggio analogo), nessun crash.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -s -m "chore: init Node project for compendium-reader MCP"
```

---

### Task 3: `lib/config.js` — validazione configurazione

**Files:**
- Create: `mcp/compendium-reader/lib/config.js`
- Test: `mcp/compendium-reader/test/config.test.js`

**Interfaces:**
- Consumes: niente.
- Produces: `validateConfig(env) → { dataPath: string, lang: "it"|"en" }`. Lancia `Error` con messaggio azionabile se `GAME_DATA_PATH` manca o non è una cartella leggibile; `lang` default `"it"` se assente, errore se valore non in `["it","en"]`.

- [ ] **Step 1: Scrivere il test che fallisce**

`mcp/compendium-reader/test/config.test.js`:
```js
import { describe, it, expect } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateConfig } from "../lib/config.js";

describe("validateConfig", () => {
  it("ritorna dataPath e lang con env valida", () => {
    const dir = mkdtempSync(join(tmpdir(), "cr-"));
    const cfg = validateConfig({ GAME_DATA_PATH: dir, GAME_DATA_LANG: "en" });
    expect(cfg.dataPath).toBe(dir);
    expect(cfg.lang).toBe("en");
  });

  it("default lang = it quando assente", () => {
    const dir = mkdtempSync(join(tmpdir(), "cr-"));
    expect(validateConfig({ GAME_DATA_PATH: dir }).lang).toBe("it");
  });

  it("errore azionabile se GAME_DATA_PATH manca", () => {
    expect(() => validateConfig({})).toThrow(/GAME_DATA_PATH/);
  });

  it("errore se la cartella non esiste", () => {
    expect(() => validateConfig({ GAME_DATA_PATH: "/no/such/dir/xyz" }))
      .toThrow(/non esiste|not found/i);
  });

  it("errore se lang non valida", () => {
    const dir = mkdtempSync(join(tmpdir(), "cr-"));
    expect(() => validateConfig({ GAME_DATA_PATH: dir, GAME_DATA_LANG: "fr" }))
      .toThrow(/it.*en|lang/i);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd mcp/compendium-reader && npx vitest run test/config.test.js`
Expected: FAIL (`validateConfig` non esiste / import error).

- [ ] **Step 3: Implementare `lib/config.js`**

```js
import { statSync } from "node:fs";

export function validateConfig(env = {}) {
  const dataPath = env.GAME_DATA_PATH;
  if (!dataPath) {
    throw new Error(
      "Config: GAME_DATA_PATH non impostata. Indica la cartella del tuo compendio " +
      "(es. ./examples/compendium-homebrew)."
    );
  }
  let st;
  try {
    st = statSync(dataPath);
  } catch {
    throw new Error(`Config: GAME_DATA_PATH non esiste o non è leggibile: ${dataPath}`);
  }
  if (!st.isDirectory()) {
    throw new Error(`Config: GAME_DATA_PATH non è una cartella: ${dataPath}`);
  }
  const lang = env.GAME_DATA_LANG ?? "it";
  if (lang !== "it" && lang !== "en") {
    throw new Error(`Config: GAME_DATA_LANG deve essere "it" o "en" (ricevuto: "${lang}").`);
  }
  return { dataPath, lang };
}
```

- [ ] **Step 4: Eseguire il test e verificare il successo**

Run: `cd mcp/compendium-reader && npx vitest run test/config.test.js`
Expected: PASS (5 test).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "feat(reader): config validation con messaggi azionabili"
```

---

### Task 4: `lib/logger.js` + `lib/errors.js` — log su stderr ed errori uniformi

**Files:**
- Create: `mcp/compendium-reader/lib/logger.js`
- Create: `mcp/compendium-reader/lib/errors.js`
- Test: `mcp/compendium-reader/test/logger-errors.test.js`

**Interfaces:**
- Consumes: niente.
- Produces:
  - `createLogger(env) → { debug, info, warn, error }` — tutte scrivono su `process.stderr`; `debug` no-op se `env.TTRPG_DEBUG` falsy.
  - `class ToolError extends Error` con campi `code: string`, `retriable: boolean`; metodo `toJSON() → { code, message, retriable }`.
  - costanti `CODES = { NOT_FOUND, AMBIGUOUS, INVALID_INPUT, INTERNAL }`.

- [ ] **Step 1: Scrivere il test che fallisce**

`mcp/compendium-reader/test/logger-errors.test.js`:
```js
import { describe, it, expect, vi } from "vitest";
import { createLogger } from "../lib/logger.js";
import { ToolError, CODES } from "../lib/errors.js";

describe("logger", () => {
  it("scrive su stderr, mai su stdout", () => {
    const err = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const out = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const log = createLogger({});
    log.info("ciao");
    expect(err).toHaveBeenCalled();
    expect(out).not.toHaveBeenCalled();
    err.mockRestore(); out.mockRestore();
  });

  it("debug è no-op senza TTRPG_DEBUG", () => {
    const err = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    createLogger({}).debug("x");
    expect(err).not.toHaveBeenCalled();
    err.mockRestore();
  });

  it("debug attivo con TTRPG_DEBUG", () => {
    const err = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    createLogger({ TTRPG_DEBUG: "1" }).debug("x");
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });
});

describe("ToolError", () => {
  it("serializza in {code,message,retriable}", () => {
    const e = new ToolError(CODES.NOT_FOUND, "non trovato", false);
    expect(e.toJSON()).toEqual({ code: "NOT_FOUND", message: "non trovato", retriable: false });
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd mcp/compendium-reader && npx vitest run test/logger-errors.test.js`
Expected: FAIL (moduli inesistenti).

- [ ] **Step 3: Implementare `lib/errors.js`**

```js
export const CODES = {
  NOT_FOUND: "NOT_FOUND",
  AMBIGUOUS: "AMBIGUOUS",
  INVALID_INPUT: "INVALID_INPUT",
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

- [ ] **Step 4: Implementare `lib/logger.js`**

```js
export function createLogger(env = {}) {
  const debugOn = Boolean(env.TTRPG_DEBUG);
  const write = (level, args) =>
    process.stderr.write(`[compendium-reader] ${level} ${args.join(" ")}\n`);
  return {
    debug: (...a) => { if (debugOn) write("DEBUG", a); },
    info: (...a) => write("INFO", a),
    warn: (...a) => write("WARN", a),
    error: (...a) => write("ERROR", a),
  };
}
```

- [ ] **Step 5: Eseguire i test e verificare il successo**

Run: `cd mcp/compendium-reader && npx vitest run test/logger-errors.test.js`
Expected: PASS (4 test).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -s -m "feat(reader): logger su stderr + ToolError uniforme"
```

---

### Task 5: `lib/pathsafe.js` — containment dei path sotto la root

**Files:**
- Create: `mcp/compendium-reader/lib/pathsafe.js`
- Test: `mcp/compendium-reader/test/pathsafe.test.js`

**Interfaces:**
- Consumes: niente.
- Produces: `resolveWithin(root, relPath) → string` (path assoluto reale). Lancia `ToolError(CODES.INVALID_INPUT, ...)` se il path risolto esce dalla `root` (anche via `..` o symlink).

- [ ] **Step 1: Scrivere il test che fallisce**

`mcp/compendium-reader/test/pathsafe.test.js`:
```js
import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveWithin } from "../lib/pathsafe.js";
import { ToolError } from "../lib/errors.js";

describe("resolveWithin", () => {
  const root = mkdtempSync(join(tmpdir(), "root-"));
  writeFileSync(join(root, "ok.json"), "{}");

  it("risolve un file dentro la root", () => {
    expect(resolveWithin(root, "ok.json")).toBe(join(root, "ok.json"));
  });

  it("blocca il path traversal con ..", () => {
    expect(() => resolveWithin(root, "../../etc/passwd")).toThrow(ToolError);
  });

  it("blocca path assoluti fuori dalla root", () => {
    expect(() => resolveWithin(root, "/etc/passwd")).toThrow(ToolError);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd mcp/compendium-reader && npx vitest run test/pathsafe.test.js`
Expected: FAIL (`resolveWithin` non esiste).

- [ ] **Step 3: Implementare `lib/pathsafe.js`**

```js
import { realpathSync } from "node:fs";
import { resolve, sep } from "node:path";
import { ToolError, CODES } from "./errors.js";

export function resolveWithin(root, relPath) {
  const realRoot = realpathSync(root);
  const candidate = resolve(realRoot, relPath);
  // Risolve i symlink quando il file esiste; se non esiste, usa il path resolved.
  let real;
  try {
    real = realpathSync(candidate);
  } catch {
    real = candidate;
  }
  const prefix = realRoot.endsWith(sep) ? realRoot : realRoot + sep;
  if (real !== realRoot && !real.startsWith(prefix)) {
    throw new ToolError(CODES.INVALID_INPUT, `Path fuori dalla cartella dati: ${relPath}`, false);
  }
  return real;
}
```

- [ ] **Step 4: Eseguire il test e verificare il successo**

Run: `cd mcp/compendium-reader && npx vitest run test/pathsafe.test.js`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "feat(reader): path-safety con realpath + containment"
```

---

### Task 6: Schema Zod + localizzazione + registry dei tipi

**Files:**
- Create: `mcp/compendium-reader/schema/common.js`
- Create: `mcp/compendium-reader/schema/types.js`
- Create: `mcp/compendium-reader/schema/index.js`
- Test: `mcp/compendium-reader/test/schema.test.js`

**Interfaces:**
- Consumes: niente.
- Produces:
  - `common.js`: `LocalizableString` (Zod: `string | {it?:string,en?:string}`), `EntryNode` (Zod ricorsivo: `{type:"text", text:LocalizableString}` | `{type:"list", items:EntryNode[]}` | `{type:"table", headers:string[], rows:string[][]}` | `{type:"entries", name?:LocalizableString, entries:EntryNode[]}`), `BaseRecord` (`{id:string, name:LocalizableString, source:string, entries?:EntryNode[]}`), e `localize(value, lang) → string`.
  - `types.js`: `MonsterRecord`, `SpellRecord`, `ItemRecord` (estendono `BaseRecord`).
  - `index.js`: `SCHEMAS = { monster, spell, item }` (map `type → ZodSchema`); `SCHEMA_VERSION = "1.0"`.

- [ ] **Step 1: Scrivere il test che fallisce**

`mcp/compendium-reader/test/schema.test.js`:
```js
import { describe, it, expect } from "vitest";
import { localize, BaseRecord, EntryNode } from "../schema/common.js";
import { SCHEMAS, SCHEMA_VERSION } from "../schema/index.js";

describe("localize", () => {
  it("ritorna la stringa così com'è", () => {
    expect(localize("Goblin", "it")).toBe("Goblin");
  });
  it("sceglie la lingua richiesta", () => {
    expect(localize({ it: "Folletto", en: "Goblin" }, "it")).toBe("Folletto");
  });
  it("fallback it→en quando manca la lingua", () => {
    expect(localize({ en: "Goblin" }, "it")).toBe("Goblin");
  });
});

describe("schema", () => {
  it("SCHEMA_VERSION è 1.0", () => {
    expect(SCHEMA_VERSION).toBe("1.0");
  });
  it("valida un mostro minimale", () => {
    const r = SCHEMAS.monster.parse({
      id: "goblin-homebrew", name: "Goblin", source: "HomebrewExample",
      cr: "1/4", hp: 7, ac: 15,
    });
    expect(r.id).toBe("goblin-homebrew");
  });
  it("EntryNode accetta un nodo testo annidato", () => {
    expect(() => EntryNode.parse({ type: "text", text: "ciao" })).not.toThrow();
  });
  it("rifiuta un record senza id", () => {
    expect(() => SCHEMAS.spell.parse({ name: "X", source: "HomebrewExample" })).toThrow();
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd mcp/compendium-reader && npx vitest run test/schema.test.js`
Expected: FAIL (moduli inesistenti).

- [ ] **Step 3: Implementare `schema/common.js`**

```js
import { z } from "zod";

export const LocalizableString = z.union([
  z.string(),
  z.object({ it: z.string().optional(), en: z.string().optional() }),
]);

export function localize(value, lang) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    return value[lang] ?? value.en ?? value.it ?? "";
  }
  return "";
}

export const EntryNode = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({ type: z.literal("text"), text: LocalizableString }),
    z.object({ type: z.literal("list"), items: z.array(EntryNode) }),
    z.object({
      type: z.literal("table"),
      headers: z.array(z.string()),
      rows: z.array(z.array(z.string())),
    }),
    z.object({
      type: z.literal("entries"),
      name: LocalizableString.optional(),
      entries: z.array(EntryNode),
    }),
  ])
);

export const BaseRecord = z.object({
  id: z.string().min(1),
  name: LocalizableString,
  source: z.string().min(1),
  entries: z.array(EntryNode).optional(),
});
```

- [ ] **Step 4: Implementare `schema/types.js`**

```js
import { z } from "zod";
import { BaseRecord, LocalizableString } from "./common.js";

export const MonsterRecord = BaseRecord.extend({
  cr: z.union([z.string(), z.number()]),
  hp: z.number(),
  ac: z.number(),
  type: z.string().optional(),
});

export const SpellRecord = BaseRecord.extend({
  level: z.number().int().min(0).max(9),
  school: z.string().optional(),
});

export const ItemRecord = BaseRecord.extend({
  rarity: z.string().optional(),
  attunement: z.boolean().optional(),
  desc: LocalizableString.optional(),
});
```

- [ ] **Step 5: Implementare `schema/index.js`**

```js
import { MonsterRecord, SpellRecord, ItemRecord } from "./types.js";

export const SCHEMA_VERSION = "1.0";

export const SCHEMAS = {
  monster: MonsterRecord,
  spell: SpellRecord,
  item: ItemRecord,
};

// Mappa file → tipo (default; sovrascrivibile da _manifest.json nel Task 9).
export const DEFAULT_FILE_TYPE = {
  "monsters.json": "monster",
  "spells.json": "spell",
  "items.json": "item",
};
```

- [ ] **Step 6: Eseguire i test e verificare il successo**

Run: `cd mcp/compendium-reader && npx vitest run test/schema.test.js`
Expected: PASS (7 test).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -s -m "feat(reader): schema Zod (monster/spell/item) + localize + registry"
```

---

### Task 7: Generazione JSON Schema + `SCHEMA.md`

**Files:**
- Create: `mcp/compendium-reader/schema/emit-json-schema.js`
- Create (generati): `mcp/compendium-reader/schema/monster.schema.json`, `spell.schema.json`, `item.schema.json`
- Create: `mcp/compendium-reader/schema/SCHEMA.md`

**Interfaces:**
- Consumes: `SCHEMAS` da `schema/index.js`.
- Produces: file `*.schema.json` (JSON Schema) per ogni tipo; documento `SCHEMA.md` per gli utenti.

- [ ] **Step 1: Implementare lo script `schema/emit-json-schema.js`**

```js
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { zodToJsonSchema } from "zod-to-json-schema";
import { SCHEMAS, SCHEMA_VERSION } from "./index.js";

const here = dirname(fileURLToPath(import.meta.url));
for (const [type, schema] of Object.entries(SCHEMAS)) {
  const js = zodToJsonSchema(schema, { name: `${type}` });
  js.$comment = `schema_version ${SCHEMA_VERSION}`;
  writeFileSync(join(here, `${type}.schema.json`), JSON.stringify(js, null, 2) + "\n");
  process.stderr.write(`generated ${type}.schema.json\n`);
}
```

- [ ] **Step 2: Eseguire lo script**

Run: `cd mcp/compendium-reader && node schema/emit-json-schema.js`
Expected: stampa "generated monster.schema.json", ecc.; crea i 3 file `*.schema.json`.

- [ ] **Step 3: Verificare che i file JSON Schema siano JSON validi**

Run: `cd mcp/compendium-reader && node -e "['monster','spell','item'].forEach(t=>JSON.parse(require('fs').readFileSync('schema/'+t+'.schema.json')));console.log('ok')"`
Expected: stampa `ok`.

- [ ] **Step 4: Scrivere `schema/SCHEMA.md`**

```markdown
# Formato del compendio (schema_version 1.0)

La cartella indicata da `GAME_DATA_PATH` contiene file JSON, uno per tipo.
Tutti gli esempi qui sotto sono **homebrew fittizi** (`source: "HomebrewExample"`).

## File supportati (default)
- `monsters.json` → tipo `monster`
- `spells.json` → tipo `spell`
- `items.json` → tipo `item`

Un `_manifest.json` opzionale può mappare file → tipo in modo esplicito.

## Struttura di un file
```json
{ "schema_version": "1.0", "records": [ { "id": "...", "name": "...", "source": "HomebrewExample" } ] }
```

## Campi comuni (`BaseRecord`)
| Campo | Tipo | Note |
|-------|------|------|
| `id` | string | **univoco e stabile** (slug), distinto da `name` |
| `name` | string \| `{it,en}` | localizzabile |
| `source` | string | negli esempi sempre `"HomebrewExample"` |
| `entries` | EntryNode[] | testo strutturato (vedi sotto) |

### Localizzazione
Un campo localizzabile può essere `"Goblin"` oppure `{ "it": "Folletto", "en": "Goblin" }`.
Fallback per-campo: lingua richiesta → `en` → `it`.

### EntryNode (testo neutro, niente markup proprietario)
- `{ "type": "text", "text": "..." }`
- `{ "type": "list", "items": [EntryNode, ...] }`
- `{ "type": "table", "headers": ["A","B"], "rows": [["1","2"]] }`
- `{ "type": "entries", "name": "...", "entries": [EntryNode, ...] }`

## Tipi specifici
- `monster`: + `cr`, `hp`, `ac`, `type?`
- `spell`: + `level` (0–9), `school?`
- `item`: + `rarity?`, `attunement?`, `desc?`

I JSON Schema formali sono in `monster.schema.json`, `spell.schema.json`, `item.schema.json`.
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "docs(reader): genera JSON Schema + SCHEMA.md del compendio"
```

---

### Task 8: Dataset homebrew d'esempio (fixture + onboarding)

**Files:**
- Create: `examples/compendium-homebrew/_manifest.json`
- Create: `examples/compendium-homebrew/monsters.json`
- Create: `examples/compendium-homebrew/spells.json`
- Create: `examples/compendium-homebrew/items.json`
- Test: `mcp/compendium-reader/test/examples.test.js`

**Interfaces:**
- Consumes: `SCHEMAS`, `SCHEMA_VERSION` da `schema/index.js`.
- Produces: cartella dati valida usata da onboarding e da tutti i test di store/search/tools.

- [ ] **Step 1: Creare `_manifest.json`**

```json
{ "schema_version": "1.0", "files": { "monsters.json": "monster", "spells.json": "spell", "items.json": "item" } }
```

- [ ] **Step 2: Creare `monsters.json` (homebrew puro)**

```json
{
  "schema_version": "1.0",
  "records": [
    { "id": "muffa-cantante-homebrew", "name": { "it": "Muffa Cantante", "en": "Singing Mold" },
      "source": "HomebrewExample", "type": "plant", "cr": "1/2", "hp": 22, "ac": 11,
      "entries": [ { "type": "text", "text": { "it": "Emette un canto ipnotico.", "en": "Emits a hypnotic song." } } ] },
    { "id": "guardiano-ottone-homebrew", "name": { "it": "Guardiano d'Ottone", "en": "Brass Sentinel" },
      "source": "HomebrewExample", "type": "construct", "cr": "3", "hp": 45, "ac": 16 }
  ]
}
```

- [ ] **Step 3: Creare `spells.json`**

```json
{
  "schema_version": "1.0",
  "records": [
    { "id": "lampo-di-cenere-homebrew", "name": { "it": "Lampo di Cenere", "en": "Ash Flash" },
      "source": "HomebrewExample", "level": 1, "school": "evocation",
      "entries": [ { "type": "text", "text": { "it": "Un lampo di cenere acceca.", "en": "A flash of ash blinds." } } ] }
  ]
}
```

- [ ] **Step 4: Creare `items.json`**

```json
{
  "schema_version": "1.0",
  "records": [
    { "id": "tonico-cenere-homebrew", "name": { "it": "Tonico di Cenere", "en": "Ash Tonic" },
      "source": "HomebrewExample", "rarity": "uncommon", "attunement": false,
      "desc": { "it": "Cura e lascia un retrogusto di fumo.", "en": "Heals with a smoky aftertaste." } }
  ]
}
```

- [ ] **Step 5: Scrivere il test che valida il dataset contro lo schema**

`mcp/compendium-reader/test/examples.test.js`:
```js
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SCHEMAS, SCHEMA_VERSION } from "../schema/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "examples", "compendium-homebrew");
const manifest = JSON.parse(readFileSync(join(root, "_manifest.json"), "utf8"));

describe("dataset homebrew d'esempio", () => {
  for (const [file, type] of Object.entries(manifest.files)) {
    it(`${file} valida contro lo schema ${type}`, () => {
      const data = JSON.parse(readFileSync(join(root, file), "utf8"));
      expect(data.schema_version).toBe(SCHEMA_VERSION);
      for (const rec of data.records) {
        expect(rec.source).toBe("HomebrewExample");
        expect(() => SCHEMAS[type].parse(rec)).not.toThrow();
      }
    });
  }
});
```

- [ ] **Step 6: Eseguire il test e verificare il successo**

Run: `cd mcp/compendium-reader && npx vitest run test/examples.test.js`
Expected: PASS (3 test).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -s -m "feat(examples): dataset homebrew d'esempio validato contro lo schema"
```

---

### Task 9: `lib/store.js` — caricamento, indicizzazione, cache

**Files:**
- Create: `mcp/compendium-reader/lib/store.js`
- Test: `mcp/compendium-reader/test/store.test.js`

**Interfaces:**
- Consumes: `SCHEMAS`, `SCHEMA_VERSION`, `DEFAULT_FILE_TYPE` da `schema/index.js`; `resolveWithin` da `lib/pathsafe.js`; `ToolError`, `CODES` da `lib/errors.js`.
- Produces: `class CompendiumStore`:
  - `constructor({ dataPath, lang, logger })`
  - `load()` → popola `this.byType: Map<type, Map<id, record>>`; usa `_manifest.json` se presente, altrimenti `DEFAULT_FILE_TYPE`; valida `schema_version` e ogni record con Zod (record invalidi → warn + skip); registra `this.mtimes`.
  - `reloadIfStale()` → ricarica se cambiano i file.
  - `getTypes() → string[]`
  - `allOfType(type) → record[]`

- [ ] **Step 1: Scrivere il test che fallisce**

`mcp/compendium-reader/test/store.test.js`:
```js
import { describe, it, expect } from "vitest";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CompendiumStore } from "../lib/store.js";

const dataPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "examples", "compendium-homebrew");
const logger = { debug(){}, info(){}, warn(){}, error(){} };

describe("CompendiumStore", () => {
  it("carica i tipi dal manifest", () => {
    const s = new CompendiumStore({ dataPath, lang: "it", logger });
    s.load();
    expect(s.getTypes().sort()).toEqual(["item", "monster", "spell"]);
  });
  it("indicizza i record per id", () => {
    const s = new CompendiumStore({ dataPath, lang: "it", logger });
    s.load();
    const monsters = s.allOfType("monster");
    expect(monsters.length).toBe(2);
    expect(monsters.find(m => m.id === "guardiano-ottone-homebrew")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd mcp/compendium-reader && npx vitest run test/store.test.js`
Expected: FAIL (`CompendiumStore` non esiste).

- [ ] **Step 3: Implementare `lib/store.js`**

```js
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
    for (const [file, mtime] of this.mtimes) {
      const full = join(this.dataPath, file);
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
}
```

- [ ] **Step 4: Eseguire i test e verificare il successo**

Run: `cd mcp/compendium-reader && npx vitest run test/store.test.js`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "feat(reader): CompendiumStore con load/index/cache (mtime)"
```

---

### Task 10: `lib/query.js` — get/list/search con paginazione e proiezione

**Files:**
- Create: `mcp/compendium-reader/lib/query.js`
- Test: `mcp/compendium-reader/test/query.test.js`

**Interfaces:**
- Consumes: `CompendiumStore` (via istanza); `ToolError`, `CODES` da `lib/errors.js`; `localize` da `schema/common.js`; `MiniSearch` da `minisearch`.
- Produces: `class CompendiumQuery`:
  - `constructor(store)` — costruisce un indice MiniSearch sui record (campi cercabili: `name` localizzato in it+en, `id`).
  - `get(type, idOrName, { lang, fields }) → record` — match per `id` esatto, poi per `name` (case-insensitive su it/en); `NOT_FOUND` se nessuno, `AMBIGUOUS` (con lista `source`) se più match per name.
  - `list(type, { filters, lang, limit=20, cursor, fields }) → { results, total, cursor }`
  - `search(query, { type, lang, limit=20, cursor, fields }) → { results, total, cursor }`
  - helper `project(record, fields)` e cursor opaco (base64 dell'offset).

- [ ] **Step 1: Scrivere il test che fallisce**

`mcp/compendium-reader/test/query.test.js`:
```js
import { describe, it, expect, beforeAll } from "vitest";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CompendiumStore } from "../lib/store.js";
import { CompendiumQuery } from "../lib/query.js";
import { ToolError } from "../lib/errors.js";

const dataPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "examples", "compendium-homebrew");
const logger = { debug(){}, info(){}, warn(){}, error(){} };
let q;
beforeAll(() => {
  const s = new CompendiumStore({ dataPath, lang: "it", logger });
  s.load();
  q = new CompendiumQuery(s);
});

describe("get", () => {
  it("trova per id", () => {
    expect(q.get("monster", "guardiano-ottone-homebrew", { lang: "it" }).hp).toBe(45);
  });
  it("trova per nome localizzato (it)", () => {
    expect(q.get("monster", "Muffa Cantante", { lang: "it" }).id).toBe("muffa-cantante-homebrew");
  });
  it("NOT_FOUND se assente", () => {
    expect(() => q.get("monster", "Drago", { lang: "it" })).toThrow(ToolError);
  });
  it("proietta solo i campi richiesti", () => {
    const r = q.get("monster", "guardiano-ottone-homebrew", { lang: "it", fields: ["id", "hp"] });
    expect(Object.keys(r).sort()).toEqual(["hp", "id"]);
  });
});

describe("list", () => {
  it("pagina con limit e cursor", () => {
    const p1 = q.list("monster", { limit: 1 });
    expect(p1.results.length).toBe(1);
    expect(p1.total).toBe(2);
    const p2 = q.list("monster", { limit: 1, cursor: p1.cursor });
    expect(p2.results[0].id).not.toBe(p1.results[0].id);
  });
});

describe("search", () => {
  it("trova per testo nel nome", () => {
    const r = q.search("cantante", { lang: "it" });
    expect(r.results.some(x => x.id === "muffa-cantante-homebrew")).toBe(true);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd mcp/compendium-reader && npx vitest run test/query.test.js`
Expected: FAIL (`CompendiumQuery` non esiste).

- [ ] **Step 3: Implementare `lib/query.js`**

```js
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
function project(record, fields) {
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
    const results = pageHits.map((h) => {
      const rec = this.store.allOfType(h.type).find((r) => r.id === h.id);
      return project(rec, fields);
    });
    const next = offset + limit < total ? encodeCursor(offset + limit) : null;
    return { results, total, cursor: next };
  }
}
```

- [ ] **Step 4: Eseguire i test e verificare il successo**

Run: `cd mcp/compendium-reader && npx vitest run test/query.test.js`
Expected: PASS (7 test).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "feat(reader): query get/list/search con paginazione e proiezione"
```

---

### Task 11: `index.js` — wiring del server MCP

**Files:**
- Modify: `mcp/compendium-reader/index.js` (sostituire il placeholder)
- Test: `mcp/compendium-reader/test/server.test.js`

**Interfaces:**
- Consumes: `validateConfig`, `createLogger`, `CompendiumStore`, `CompendiumQuery`, `ToolError`; `@modelcontextprotocol/sdk`.
- Produces: factory `buildServer(env) → { server, refresh }` testabile senza stdio; più il bootstrap stdio quando eseguito come entry point. Espone 4 tool MCP: `search`, `list`, `get`, `read_file`.

- [ ] **Step 1: Scrivere il test che fallisce (factory testabile)**

`mcp/compendium-reader/test/server.test.js`:
```js
import { describe, it, expect } from "vitest";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildServer } from "../index.js";

const dataPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "examples", "compendium-homebrew");

describe("buildServer", () => {
  it("costruisce il server e i tool sono invocabili via handler interni", async () => {
    const { handlers } = buildServer({ GAME_DATA_PATH: dataPath, GAME_DATA_LANG: "it" });
    const got = await handlers.get({ type: "monster", idOrName: "guardiano-ottone-homebrew" });
    expect(got.hp).toBe(45);
    const found = await handlers.search({ query: "cantante" });
    expect(found.total).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd mcp/compendium-reader && npx vitest run test/server.test.js`
Expected: FAIL (`buildServer` non esportato).

- [ ] **Step 3: Implementare `index.js`**

```js
#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { validateConfig } from "./lib/config.js";
import { createLogger } from "./lib/logger.js";
import { CompendiumStore } from "./lib/store.js";
import { CompendiumQuery } from "./lib/query.js";
import { ToolError, CODES } from "./lib/errors.js";

export function buildServer(env) {
  const logger = createLogger(env);
  const cfg = validateConfig(env);
  let store = new CompendiumStore({ ...cfg, logger });
  store.load();
  let query = new CompendiumQuery(store);

  const refresh = () => {
    if (store.reloadIfStale()) query = new CompendiumQuery(store);
  };

  const handlers = {
    async search({ query: q, type, limit, cursor, fields }) {
      refresh();
      return query.search(q, { type, limit, cursor, fields, lang: cfg.lang });
    },
    async list({ type, filters, limit, cursor, fields }) {
      refresh();
      return query.list(type, { filters, limit, cursor, fields, lang: cfg.lang });
    },
    async get({ type, idOrName, fields }) {
      refresh();
      return query.get(type, idOrName, { fields, lang: cfg.lang });
    },
    async read_file({ file, root_key, fields }) {
      refresh();
      const rows = store.allOfType(file.replace(/\.json$/, "").replace(/s$/, ""));
      return { results: rows };
    },
  };

  const TOOLS = [
    { name: "search", description: "Cerca record nel compendio (full-text).",
      inputSchema: { type: "object", properties: {
        query: { type: "string" }, type: { type: "string" },
        limit: { type: "number" }, cursor: { type: "string" },
        fields: { type: "array", items: { type: "string" } } }, required: ["query"] } },
    { name: "list", description: "Elenca/filtra record di un tipo.",
      inputSchema: { type: "object", properties: {
        type: { type: "string" }, filters: { type: "object" },
        limit: { type: "number" }, cursor: { type: "string" },
        fields: { type: "array", items: { type: "string" } } }, required: ["type"] } },
    { name: "get", description: "Recupera un singolo record per id o nome.",
      inputSchema: { type: "object", properties: {
        type: { type: "string" }, idOrName: { type: "string" },
        fields: { type: "array", items: { type: "string" } } }, required: ["type", "idOrName"] } },
    { name: "read_file", description: "Accesso grezzo ai record di un file.",
      inputSchema: { type: "object", properties: {
        file: { type: "string" }, root_key: { type: "string" },
        fields: { type: "array", items: { type: "string" } } }, required: ["file"] } },
  ];

  const server = new Server({ name: "compendium-reader", version: "0.1.0" }, { capabilities: { tools: {} } });
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const fn = handlers[req.params.name];
    try {
      if (!fn) throw new ToolError(CODES.INVALID_INPUT, `Tool sconosciuto: ${req.params.name}`, false);
      const result = await fn(req.params.arguments ?? {});
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (e) {
      const err = e instanceof ToolError ? e.toJSON() : { code: CODES.INTERNAL, message: String(e?.message ?? e), retriable: false };
      logger.error(err.code, err.message);
      return { isError: true, content: [{ type: "text", text: JSON.stringify(err) }] };
    }
  });

  return { server, handlers, refresh };
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`;
if (isMain) {
  try {
    const { server } = buildServer(process.env);
    const transport = new StdioServerTransport();
    await server.connect(transport);
    process.stderr.write("[compendium-reader] connesso\n");
  } catch (e) {
    process.stderr.write(`[compendium-reader] avvio fallito: ${e.message}\n`);
    process.exit(1);
  }
}
```

- [ ] **Step 4: Eseguire il test e verificare il successo**

Run: `cd mcp/compendium-reader && npx vitest run test/server.test.js`
Expected: PASS (1 test).

- [ ] **Step 5: Eseguire l'intera suite**

Run: `cd mcp/compendium-reader && npx vitest run`
Expected: PASS (tutti i file: config, logger-errors, pathsafe, schema, examples, store, query, server).

- [ ] **Step 6: Smoke test del server come entry point**

Run: `cd mcp/compendium-reader && GAME_DATA_PATH=../../examples/compendium-homebrew node index.js & sleep 1; kill %1`
Expected: su stderr "[compendium-reader] connesso" (nessun output su stdout).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -s -m "feat(reader): wiring server MCP (search/list/get/read_file)"
```

---

### Task 12: CI — lint, test, secret-scan, denylist marchi

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `scripts/check-denylist.mjs`

**Interfaces:**
- Consumes: la suite di test del Task 11.
- Produces: pipeline CI che gira su ogni push/PR: install + test + scan segreti + denylist marchi.

- [ ] **Step 1: Creare `scripts/check-denylist.mjs`**

```js
// Fallisce se trova marchi/termini vietati nei file tracciati (esclude node_modules, .git, lockfile).
import { execSync } from "node:child_process";

const DENY = ["5etools", "d&d", "dungeons & dragons", "wizards of the coast", "xphb", "xdmg", "xmm"];
const files = execSync("git ls-files", { encoding: "utf8" })
  .split("\n").filter(Boolean)
  .filter((f) => !f.endsWith("package-lock.json"));

let bad = 0;
const { readFileSync } = await import("node:fs");
for (const f of files) {
  let text;
  try { text = readFileSync(f, "utf8").toLowerCase(); } catch { continue; }
  for (const term of DENY) {
    if (text.includes(term)) {
      console.error(`DENYLIST: "${term}" trovato in ${f}`);
      bad++;
    }
  }
}
if (bad) { console.error(`\n${bad} violazioni denylist.`); process.exit(1); }
console.log("denylist: pulito");
```

- [ ] **Step 2: Verificare la denylist in locale**

Run: `node scripts/check-denylist.mjs`
Expected: stampa `denylist: pulito` (exit 0). Se fallisce, correggere i file segnalati.

- [ ] **Step 3: Creare `.github/workflows/ci.yml`**

```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20" }
      - name: Install (compendium-reader)
        working-directory: mcp/compendium-reader
        run: npm install
      - name: Test
        working-directory: mcp/compendium-reader
        run: npm test
      - name: Denylist marchi
        run: node scripts/check-denylist.mjs
      - name: Secret scan (gitleaks)
        if: matrix.os == 'ubuntu-latest'
        uses: gitleaks/gitleaks-action@v2
        env: { GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} }
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -s -m "ci: test multi-OS + denylist marchi + secret scan"
```

---

## Self-Review

**1. Spec coverage (§ dello spec → task):**
- §2 vincoli pubblicabilità → Task 1 (file compliance) + Task 12 (denylist/secret-scan) ✓
- §3 struttura repo → Task 1, 2 ✓ (cartelle skill/templates/lib non-foundation create dai piani 2-5)
- §4.1 schema formale → Task 6, 7 ✓
- §4.2 reader index/cache/path-safety/cross-platform → Task 5, 9 ✓
- §4.3 firme tool (pagination/projection/errori) → Task 10, 11 ✓
- §4.4 adapter → fuori Foundation (documentato in CONTRIBUTING, Task 1) ✓
- §14 config/logging → Task 3, 4 ✓
- §15 dual-license + file community + CI → Task 1, 12 ✓
- §16 Apache-2.0 / examples homebrew → Task 1, 8 ✓
- Worldbuilding/adventure/produzione/visuals (§5–§13) → **fuori scope Foundation**, piani 2-5.

**2. Placeholder scan:** nessun "TBD"/"handle errors" generico; ogni step ha codice o comando concreto. ✓

**3. Type consistency:** `validateConfig→{dataPath,lang}` usato in Task 11; `CompendiumStore.{load,reloadIfStale,getTypes,allOfType}` usati in Task 10/11; `CompendiumQuery.{get,list,search}` firme coerenti tra Task 10 e 11; `ToolError.toJSON()` usato in Task 11; `SCHEMAS/SCHEMA_VERSION/DEFAULT_FILE_TYPE` coerenti tra Task 6, 8, 9. ✓

> Nota implementativa per `read_file` (Task 11): nella Foundation è una versione minimale che mappa un nome file al tipo; sarà rifinita quando i piani successivi ne avranno bisogno (registrato come debito tecnico, non placeholder funzionale — il tool è operativo).

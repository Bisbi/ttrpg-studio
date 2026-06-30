# TTRPG Studio — Adventure Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Costruire la pipeline d'avventura "tavolo pronto": adventure-writer con template-as-data validato, encounter-builder (budget XP 5E-compatible), session-prep one-page, random tables con `/roll`, loot legato all'avventura, e il puntatore campaign-context alla Setting Bible.

**Architecture:** Le utility deterministiche stanno nel package Node esistente `lib/` (ESM, vitest, zero dipendenze runtime). L'avventura è una **struttura dati JSON** (`adventure.json`) validata da regole in JS puro (conteggi: ≥8 segreti, 3–5 luoghi con ≥3 dettagli sensoriali, ≥3 ganci, PNG con campi obbligatori) — non prosa. L'encounter-builder incorpora le soglie XP per livello e i moltiplicatori come **dati neutri** (fatti meccanici del sistema, nessun marchio né prosa) e propone combinazioni di mostri entro budget, ricevendo i mostri candidati dal chiamante (che li ottiene dal `compendium-reader`). Skill e comandi sono markdown: l'LLM riempie i contenuti creativi e invoca le lib; ogni scrittura è atomica con `--dry-run` e policy di collisione.

**Tech Stack:** Node.js ≥20 (ESM), `vitest`. Nessuna nuova dipendenza runtime (solo `node:fs`/`node:path`). Riusa `lib/common/{fs-atomic,config,logger,errors,slug}.js` dal piano worldbuilding. Apache-2.0 (codice) + CC-BY-4.0 (contenuti: `templates/`).

## Global Constraints

- **Zero contenuti coperti da copyright** nel repo; **zero segreti**; **zero riferimenti a marchi/strumenti di terze parti** in codice, nomi tool/comandi e documentazione. Usare sempre **"compatibile con la Quinta Edizione" / "5E-compatible"**, mai "D&D".
- **Numeri di regola** (soglie XP, moltiplicatori): inclusi come **dati neutri** del sistema, senza prosa/marchi. Sono fatti funzionali, non espressione.
- Esempi/tabelle: **solo homebrew inventato**, neutro.
- **Cross-platform:** solo `node:path`; nessuna assunzione Windows; nessuna dipendenza Python.
- **Line-ending LF** (repo con `.gitattributes eol=lf`); entry point con shebang usano `pathToFileURL` per `isMain` (cross-platform).
- **Scrittura su disco** sempre **atomica** (`writeFileSafe`) e con **policy di collisione** esplicita; ogni mutazione supporta `--dry-run`.
- **Logging su `stderr`** (mai stdout); errori uniformi `{code, message, retriable}`.
- **Separazione vista-DM / vista-player**: i campi segreti (`secret`, segreti PNG, `secrets_and_clues`) sono marcati e non finiscono nei deliverable per i giocatori (qui rilevante per session-prep; l'handout è nel piano produzione).
- Node ESM: `"type": "module"`.

---

### Task 1: `validateAdventureConfig` — validazione `ADVENTURE_PATH`

**Files:**
- Modify: `lib/common/config.js` (aggiungere una funzione)
- Test: `lib/test/config-adventure.test.js`

**Interfaces:**
- Consumes: niente.
- Produces: `validateAdventureConfig(env) → { adventurePath: string, lang: "it"|"en" }`. Lancia `Error` azionabile se `ADVENTURE_PATH` manca o non è una cartella; `lang` da `GAME_DATA_LANG`, default `"it"`, errore se non in `["it","en"]`.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/config-adventure.test.js`:
```js
import { describe, it, expect } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateAdventureConfig } from "../common/config.js";

describe("validateAdventureConfig", () => {
  it("ritorna adventurePath e lang con env valida", () => {
    const dir = mkdtempSync(join(tmpdir(), "adv-"));
    const cfg = validateAdventureConfig({ ADVENTURE_PATH: dir, GAME_DATA_LANG: "en" });
    expect(cfg.adventurePath).toBe(dir);
    expect(cfg.lang).toBe("en");
  });
  it("default lang = it", () => {
    const dir = mkdtempSync(join(tmpdir(), "adv-"));
    expect(validateAdventureConfig({ ADVENTURE_PATH: dir }).lang).toBe("it");
  });
  it("errore se ADVENTURE_PATH manca", () => {
    expect(() => validateAdventureConfig({})).toThrow(/ADVENTURE_PATH/);
  });
  it("errore se la cartella non esiste", () => {
    expect(() => validateAdventureConfig({ ADVENTURE_PATH: "/no/such/xyz" })).toThrow(/non esiste|not found/i);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/config-adventure.test.js`
Expected: FAIL (`validateAdventureConfig` non esiste).

- [ ] **Step 3: Implementare la funzione in `lib/common/config.js`**

Aggiungere in fondo al file (lasciando `validateSettingConfig` invariata):
```js
export function validateAdventureConfig(env = {}) {
  const adventurePath = env.ADVENTURE_PATH;
  if (!adventurePath) {
    throw new Error(
      "Config: ADVENTURE_PATH non impostata. Indica la cartella delle avventure " +
      "(es. ./adventures)."
    );
  }
  let st;
  try {
    st = statSync(adventurePath);
  } catch {
    throw new Error(`Config: ADVENTURE_PATH non esiste o non è leggibile: ${adventurePath}`);
  }
  if (!st.isDirectory()) {
    throw new Error(`Config: ADVENTURE_PATH non è una cartella: ${adventurePath}`);
  }
  const lang = env.GAME_DATA_LANG ?? "it";
  if (lang !== "it" && lang !== "en") {
    throw new Error(`Config: GAME_DATA_LANG deve essere "it" o "en" (ricevuto: "${lang}").`);
  }
  return { adventurePath, lang };
}
```
(`statSync` è già importato in `config.js` dal piano worldbuilding.)

- [ ] **Step 4: Eseguire il test e verificare il successo**

Run: `cd lib && npx vitest run test/config-adventure.test.js`
Expected: PASS (4 test).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "feat(lib): validazione ADVENTURE_PATH"
```

---

### Task 2: `lib/adventure/validate.js` — validazione template-as-data

**Files:**
- Create: `lib/adventure/validate.js`
- Test: `lib/test/adventure-validate.test.js`

**Interfaces:**
- Consumes: niente.
- Produces:
  - costanti `RULES = { SECRETS_MIN: 8, LOCATIONS_MIN: 3, LOCATIONS_MAX: 5, SENSORY_MIN: 3, HOOKS_MIN: 3, NPC_REQUIRED: ["name","role","voice","wants","secret"] }`.
  - `validateAdventure(doc) → { ok: boolean, issues: Issue[] }` con `Issue = { code, message }`. Codici: `MISSING_FIELD`, `TOO_FEW_SECRETS`, `LOCATIONS_OUT_OF_RANGE`, `LOCATION_SENSORY`, `TOO_FEW_HOOKS`, `NPC_FIELD`. `ok = issues.length === 0`.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/adventure-validate.test.js`:
```js
import { describe, it, expect } from "vitest";
import { validateAdventure } from "../adventure/validate.js";

function validDoc() {
  return {
    title: "La Cripta di Sale",
    strong_start: "Il pavimento cede e il gruppo precipita in una cripta allagata.",
    secrets_and_clues: Array.from({ length: 8 }, (_, i) => `Segreto ${i + 1}`),
    fantastic_locations: [
      { name: "Sala A", sensory: ["sale scricchiola", "odore di iodio", "luce verde"] },
      { name: "Sala B", sensory: ["eco lontana", "aria fredda", "muschio umido"] },
      { name: "Sala C", sensory: ["acqua nera", "gocciolio", "riflessi"] },
    ],
    npcs: [{ name: "Vera", role: "guida", voice: "sussurra", wants: "fuggire", secret: "è una spia" }],
    monsters: [{ id: "muffa-cantante-homebrew", role: "imboscata" }],
    encounters: [{ name: "Agguato", monsters: ["muffa-cantante-homebrew"] }],
    hooks: ["Un debito", "Una mappa", "Una sparizione"],
    consequences: [{ ifPcs: "liberano la muffa", then: "il porto si ammala" }],
    reward_loot: { items: [], nonItem: [] },
  };
}

describe("validateAdventure", () => {
  it("documento valido → ok", () => {
    const r = validateAdventure(validDoc());
    expect(r.ok).toBe(true);
    expect(r.issues).toEqual([]);
  });
  it("meno di 8 segreti → TOO_FEW_SECRETS", () => {
    const doc = validDoc(); doc.secrets_and_clues = ["uno"];
    const r = validateAdventure(doc);
    expect(r.ok).toBe(false);
    expect(r.issues.some((i) => i.code === "TOO_FEW_SECRETS")).toBe(true);
  });
  it("luoghi fuori range → LOCATIONS_OUT_OF_RANGE", () => {
    const doc = validDoc(); doc.fantastic_locations = [doc.fantastic_locations[0]];
    expect(validateAdventure(doc).issues.some((i) => i.code === "LOCATIONS_OUT_OF_RANGE")).toBe(true);
  });
  it("luogo con <3 dettagli sensoriali → LOCATION_SENSORY", () => {
    const doc = validDoc(); doc.fantastic_locations[0].sensory = ["solo uno"];
    expect(validateAdventure(doc).issues.some((i) => i.code === "LOCATION_SENSORY")).toBe(true);
  });
  it("PNG senza campo obbligatorio → NPC_FIELD", () => {
    const doc = validDoc(); delete doc.npcs[0].secret;
    expect(validateAdventure(doc).issues.some((i) => i.code === "NPC_FIELD")).toBe(true);
  });
  it("campo top-level mancante → MISSING_FIELD", () => {
    const doc = validDoc(); delete doc.strong_start;
    expect(validateAdventure(doc).issues.some((i) => i.code === "MISSING_FIELD")).toBe(true);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/adventure-validate.test.js`
Expected: FAIL (`validateAdventure` non esiste).

- [ ] **Step 3: Implementare `lib/adventure/validate.js`**

```js
export const RULES = {
  SECRETS_MIN: 8,
  LOCATIONS_MIN: 3,
  LOCATIONS_MAX: 5,
  SENSORY_MIN: 3,
  HOOKS_MIN: 3,
  NPC_REQUIRED: ["name", "role", "voice", "wants", "secret"],
};

const TOP_FIELDS = [
  "title", "strong_start", "secrets_and_clues", "fantastic_locations",
  "npcs", "monsters", "encounters", "hooks", "consequences", "reward_loot",
];

export function validateAdventure(doc) {
  const issues = [];
  const add = (code, message) => issues.push({ code, message });
  const d = doc ?? {};

  for (const f of TOP_FIELDS) {
    if (d[f] === undefined || d[f] === null || d[f] === "") {
      add("MISSING_FIELD", `Campo obbligatorio mancante: ${f}`);
    }
  }

  if (Array.isArray(d.secrets_and_clues) && d.secrets_and_clues.length < RULES.SECRETS_MIN) {
    add("TOO_FEW_SECRETS", `Servono almeno ${RULES.SECRETS_MIN} voci in secrets_and_clues (trovate ${d.secrets_and_clues.length}).`);
  }

  if (Array.isArray(d.fantastic_locations)) {
    const n = d.fantastic_locations.length;
    if (n < RULES.LOCATIONS_MIN || n > RULES.LOCATIONS_MAX) {
      add("LOCATIONS_OUT_OF_RANGE", `fantastic_locations deve avere ${RULES.LOCATIONS_MIN}–${RULES.LOCATIONS_MAX} voci (trovate ${n}).`);
    }
    d.fantastic_locations.forEach((loc, i) => {
      const sensory = loc?.sensory;
      if (!Array.isArray(sensory) || sensory.length < RULES.SENSORY_MIN) {
        add("LOCATION_SENSORY", `Il luogo #${i + 1} (${loc?.name ?? "?"}) deve avere almeno ${RULES.SENSORY_MIN} dettagli sensoriali.`);
      }
    });
  }

  if (Array.isArray(d.hooks) && d.hooks.length < RULES.HOOKS_MIN) {
    add("TOO_FEW_HOOKS", `Servono almeno ${RULES.HOOKS_MIN} ganci (trovati ${d.hooks.length}).`);
  }

  if (Array.isArray(d.npcs)) {
    d.npcs.forEach((npc, i) => {
      for (const f of RULES.NPC_REQUIRED) {
        if (!npc || npc[f] === undefined || npc[f] === null || npc[f] === "") {
          add("NPC_FIELD", `Il PNG #${i + 1} (${npc?.name ?? "?"}) manca del campo "${f}".`);
        }
      }
    });
  }

  return { ok: issues.length === 0, issues };
}
```

- [ ] **Step 4: Eseguire i test e verificare il successo**

Run: `cd lib && npx vitest run test/adventure-validate.test.js`
Expected: PASS (6 test).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "feat(lib): validazione adventure template-as-data (conteggi/regole)"
```

---

### Task 3: Template d'avventura + SCHEMA + campaign-context

**Files:**
- Create: `templates/adventure/adventure.template.json`
- Create: `templates/adventure/adventure.template.md`
- Create: `templates/adventure/campaign-context.md`
- Create: `templates/adventure/SCHEMA.md`

**Interfaces:**
- Consumes: niente.
- Produces: scheletro JSON + vista markdown + puntatore alla Bible, copiati da `scaffoldAdventure` (Task 4). Placeholder `{{TITLE}}` e `{{SLUG}}`.

- [ ] **Step 1: Creare `adventure.template.json`**

```json
{
  "schema_version": "1.0",
  "title": "{{TITLE}}",
  "slug": "{{SLUG}}",
  "level_range": "1-3",
  "strong_start": "",
  "secrets_and_clues": [],
  "fantastic_locations": [],
  "npcs": [],
  "monsters": [],
  "encounters": [],
  "hooks": [],
  "consequences": [],
  "reward_loot": { "items": [], "nonItem": [], "budget_by_level": {} }
}
```

- [ ] **Step 2: Creare `adventure.template.md`**

```markdown
# {{TITLE}}

> Vista umana dell'avventura. La fonte di verità è `adventure.json` (template-as-data).
> Rigenera questa vista dopo ogni modifica ai dati.

## Strong start
_(1 scena, max 3 frasi)_

## Segreti e indizi
_(≥8 voci — three-clue rule per i nodi investigativi)_

## Luoghi fantastici
_(3–5, ognuno con ≥3 dettagli sensoriali)_

## PNG
_(nome, ruolo, voce/tic, vuole, **segreto (vista-DM)**, fazione)_

## Mostri e incontri
_(dal compendio; budget XP via `/encounter`)_

## Ganci d'ingresso
_(≥3)_

## Conseguenze
_(albero a cascata: se i PG fanno X → Y)_

## Ricompense
_(reward_loot: oggetti + ricompense non-oggetto)_
```

- [ ] **Step 3: Creare `campaign-context.md`**

```markdown
# Campaign Context

> Puntatore all'ambientazione attiva. Compila il path della Setting Bible da cui
> questa avventura attinge per il canon (PNG, fazioni, luoghi, divinità).

- **Setting Bible attiva:** `{{SETTING_PATH}}`
- **Lingua:** segue `GAME_DATA_LANG` (it/en).

Tutti i nomi propri (PNG, fazioni, luoghi) devono esistere nella Setting Bible o
esservi aggiunti via i comandi `/gen-*` del worldbuilding.
```

- [ ] **Step 4: Creare `SCHEMA.md`**

```markdown
# Formato avventura (schema_version 1.0)

Un'avventura è una **struttura dati** in `adventure.json`, validata da regole
(`lib/adventure/validate.js`). La vista umana (`adventure.md`) è derivata.

## Campi
| Campo | Tipo | Regola |
|-------|------|--------|
| `title` | string | obbligatorio |
| `strong_start` | string | obbligatorio, 1 scena (max 3 frasi) |
| `secrets_and_clues` | string[] | **≥8** |
| `fantastic_locations` | {name, sensory[]}[] | **3–5**, ogni `sensory` **≥3** |
| `npcs` | obj[] | ogni PNG: `name, role, voice, wants, secret` (+ `faction?`) |
| `monsters` | {id, role}[] | `id` dal compendio |
| `encounters` | {name, monsters[], terrain?, objective?, victory?}[] | budget via `/encounter` |
| `hooks` | string[] | **≥3** |
| `consequences` | {ifPcs, then}[] | albero a cascata |
| `reward_loot` | {items[], nonItem[], budget_by_level} | vedi `/item-card` (piano produzione) |

I campi **segreti** (`secret`, `secrets_and_clues`) sono vista-DM: non finiscono nei
deliverable per i giocatori.
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "feat(templates): scheletro avventura (json+md) + SCHEMA + campaign-context"
```

---

### Task 4: `lib/adventure/scaffold.js` — logica di `/new-adventure`

**Files:**
- Create: `lib/adventure/scaffold.js`
- Test: `lib/test/adventure-scaffold.test.js`

**Interfaces:**
- Consumes: `writeFileSafe` da `lib/common/fs-atomic.js`; `slugify` da `lib/common/slug.js`.
- Produces: `scaffoldAdventure({ title, destDir, templatesDir, policy = "error", dryRun = false }) → { slug, created: string[], actions: object[] }`. Crea `<destDir>/<slug>/adventure.json` (con `{{TITLE}}`/`{{SLUG}}` sostituiti) e `<destDir>/<slug>/adventure.md`. `slug = slugify(title)`.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/adventure-scaffold.test.js`:
```js
import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scaffoldAdventure } from "../adventure/scaffold.js";

function fakeTemplates() {
  const dir = mkdtempSync(join(tmpdir(), "advtpl-"));
  writeFileSync(join(dir, "adventure.template.json"), '{ "title": "{{TITLE}}", "slug": "{{SLUG}}" }');
  writeFileSync(join(dir, "adventure.template.md"), "# {{TITLE}}");
  return dir;
}

describe("scaffoldAdventure", () => {
  it("crea la cartella avventura con json e md", () => {
    const templatesDir = fakeTemplates();
    const destDir = mkdtempSync(join(tmpdir(), "adv-"));
    const res = scaffoldAdventure({ title: "La Cripta di Sale", destDir, templatesDir });
    expect(res.slug).toBe("la-cripta-di-sale");
    const jsonPath = join(destDir, "la-cripta-di-sale", "adventure.json");
    expect(existsSync(jsonPath)).toBe(true);
    expect(readFileSync(jsonPath, "utf8")).toContain('"title": "La Cripta di Sale"');
    expect(readFileSync(jsonPath, "utf8")).toContain('"slug": "la-cripta-di-sale"');
    expect(existsSync(join(destDir, "la-cripta-di-sale", "adventure.md"))).toBe(true);
  });

  it("dryRun non scrive nulla", () => {
    const templatesDir = fakeTemplates();
    const destDir = mkdtempSync(join(tmpdir(), "adv-"));
    scaffoldAdventure({ title: "X", destDir, templatesDir, dryRun: true });
    expect(existsSync(join(destDir, "x", "adventure.json"))).toBe(false);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/adventure-scaffold.test.js`
Expected: FAIL (`scaffoldAdventure` non esiste).

- [ ] **Step 3: Implementare `lib/adventure/scaffold.js`**

```js
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { writeFileSafe } from "../common/fs-atomic.js";
import { slugify } from "../common/slug.js";

export function scaffoldAdventure({ title, destDir, templatesDir, policy = "error", dryRun = false }) {
  const slug = slugify(title);
  const advDir = join(destDir, slug);
  const created = [];
  const actions = [];

  const map = [
    ["adventure.template.json", "adventure.json"],
    ["adventure.template.md", "adventure.md"],
  ];
  for (const [srcName, destName] of map) {
    const content = readFileSync(join(templatesDir, srcName), "utf8")
      .replaceAll("{{TITLE}}", title)
      .replaceAll("{{SLUG}}", slug);
    const dest = join(advDir, destName);
    const res = writeFileSafe(dest, content, { policy, dryRun });
    actions.push(res);
    if (res.action !== "skipped") created.push(dest);
  }
  return { slug, created, actions };
}
```

- [ ] **Step 4: Eseguire i test e verificare il successo**

Run: `cd lib && npx vitest run test/adventure-scaffold.test.js`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "feat(lib): scaffoldAdventure (json strutturato + vista md)"
```

---

### Task 5: `bin/new-adventure.js` + `/new-adventure` + skill adventure-writer

**Files:**
- Create: `lib/bin/new-adventure.js`
- Create: `commands/new-adventure.md`
- Create: `skills/adventure-writer/SKILL.md`
- Test: `lib/test/new-adventure-cli.test.js`

**Interfaces:**
- Consumes: `scaffoldAdventure` da `lib/adventure/scaffold.js`; `validateAdventureConfig` da `lib/common/config.js`; `createLogger` da `lib/common/logger.js`.
- Produces: `runNewAdventure(argv, env) → { code: number }`. CLI: `node lib/bin/new-adventure.js "<titolo>" [--dry-run] [--policy ...]`. Destinazione `ADVENTURE_PATH`; template da `<CLAUDE_PLUGIN_ROOT|cwd>/templates/adventure`.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/new-adventure-cli.test.js`:
```js
import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runNewAdventure } from "../bin/new-adventure.js";

function fakeRoot() {
  const root = mkdtempSync(join(tmpdir(), "root-"));
  const tpl = join(root, "templates", "adventure");
  mkdirSync(tpl, { recursive: true });
  writeFileSync(join(tpl, "adventure.template.json"), '{ "title": "{{TITLE}}", "slug": "{{SLUG}}" }');
  writeFileSync(join(tpl, "adventure.template.md"), "# {{TITLE}}");
  return root;
}

describe("runNewAdventure", () => {
  it("scaffolda nella ADVENTURE_PATH", () => {
    const root = fakeRoot();
    const adventurePath = mkdtempSync(join(tmpdir(), "ap-"));
    const { code } = runNewAdventure(["La Cripta"], { ADVENTURE_PATH: adventurePath, CLAUDE_PLUGIN_ROOT: root });
    expect(code).toBe(0);
    expect(existsSync(join(adventurePath, "la-cripta", "adventure.json"))).toBe(true);
  });
  it("code 1 senza titolo", () => {
    const root = fakeRoot();
    const adventurePath = mkdtempSync(join(tmpdir(), "ap-"));
    expect(runNewAdventure([], { ADVENTURE_PATH: adventurePath, CLAUDE_PLUGIN_ROOT: root }).code).toBe(1);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/new-adventure-cli.test.js`
Expected: FAIL (`runNewAdventure` non esiste).

- [ ] **Step 3: Implementare `lib/bin/new-adventure.js`**

```js
#!/usr/bin/env node
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { scaffoldAdventure } from "../adventure/scaffold.js";
import { validateAdventureConfig } from "../common/config.js";
import { createLogger } from "../common/logger.js";

export function runNewAdventure(argv, env) {
  const logger = createLogger(env);
  const dryRun = argv.includes("--dry-run");
  const pIdx = argv.indexOf("--policy");
  const policy = pIdx !== -1 ? argv[pIdx + 1] : "error";
  const policyValueIdx = pIdx !== -1 ? pIdx + 1 : -1;
  const args = argv.filter((a, i) => !a.startsWith("--") && i !== policyValueIdx);
  const title = args[0];
  if (!title) {
    logger.error("Uso: new-adventure \"<titolo>\" [--dry-run] [--policy skip|overwrite|append|error]");
    return { code: 1 };
  }
  let cfg;
  try {
    cfg = validateAdventureConfig(env);
  } catch (e) {
    logger.error(e.message);
    return { code: 1 };
  }
  const root = env.CLAUDE_PLUGIN_ROOT ?? process.cwd();
  const templatesDir = join(root, "templates", "adventure");
  try {
    const res = scaffoldAdventure({ title, destDir: cfg.adventurePath, templatesDir, policy, dryRun });
    for (const a of res.actions) logger.info(`${a.action} ${a.path}`);
    return { code: 0 };
  } catch (e) {
    logger.error(e.message);
    return { code: 1 };
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const { code } = runNewAdventure(process.argv.slice(2), process.env);
  process.exit(code);
}
```

- [ ] **Step 4: Eseguire i test e verificare il successo**

Run: `cd lib && npx vitest run test/new-adventure-cli.test.js`
Expected: PASS (2 test).

- [ ] **Step 5: Creare il comando `/new-adventure`**

`commands/new-adventure.md`:
```markdown
---
description: Crea una nuova avventura (template-as-data, workflow Lazy DM)
argument-hint: "<titolo>"
---

Crea l'avventura "$ARGUMENTS" in `ADVENTURE_PATH`.

Esegui:
`node ${CLAUDE_PLUGIN_ROOT}/lib/bin/new-adventure.js "$ARGUMENTS"`

Poi guida l'utente nel workflow **Lazy DM** compilando `adventure.json` (vedi la
skill adventure-writer): strong start, ≥8 segreti/indizi, 3–5 luoghi con ≥3 dettagli
sensoriali, PNG con voce e segreto, ≥3 ganci, conseguenze a cascata, incontri (via
`/encounter`) e reward_loot. Mantieni i nomi propri coerenti con la Setting Bible
(`campaign-context.md`). In caso di collisione proponi `--policy` o `--dry-run`.
```

- [ ] **Step 6: Creare la skill `adventure-writer`**

`skills/adventure-writer/SKILL.md`:
```markdown
---
name: adventure-writer
description: Scrive avventure 5E-compatible col workflow Lazy DM e un template-as-data validato (strong start, segreti/indizi, luoghi sensoriali, PNG, incontri a budget XP, conseguenze, loot). Usa quando l'utente vuole creare o rifinire un'avventura o preparare una sessione.
---

# Adventure Writer

L'avventura è una **struttura dati** (`adventure.json`), non prosa. La validazione
conta e verifica (vedi `templates/adventure/SCHEMA.md`).

## Workflow (Lazy DM)
1. `/new-adventure "<titolo>"` — scaffold.
2. Compila i campi puntando alla Setting Bible attiva (`campaign-context.md`).
3. `/encounter` per gli incontri entro budget XP.
4. `/session-prep` per la scheda one-page al tavolo.

## 8 principi di stile
1. **Strong start**: apri in scena, non con esposizione.
2. **Three-clue rule**: ogni conclusione necessaria ha ≥3 indizi.
3. **Luoghi fantastici**: 3–5, ciascuno con ≥3 dettagli sensoriali.
4. **PNG vivi**: voce/tic + cosa vogliono + un segreto.
5. **Incontri con scopo**: terreno, obiettivo, condizione di vittoria (non solo "uccidi").
6. **Conseguenze a cascata**: le azioni dei PG cambiano il mondo.
7. **Loot legato**: ricompense che il gruppo vuole, anche non-oggetto.
8. **Vista-DM / vista-player**: i segreti non finiscono negli handout.

## Regole non negoziabili
Ogni scrittura è atomica, con `--dry-run` e policy di collisione. Esegui
`validateAdventure` (via la lib) e mostra le discrepanze prima di considerare
"pronta" un'avventura.
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -s -m "feat(adventure): CLI/command /new-adventure + skill adventure-writer"
```

---

### Task 6: `lib/encounter/thresholds.js` — soglie XP e moltiplicatori (dati neutri)

**Files:**
- Create: `lib/encounter/thresholds.js`
- Test: `lib/test/encounter-thresholds.test.js`

**Interfaces:**
- Consumes: niente.
- Produces:
  - `XP_THRESHOLDS`: oggetto `{ [level: 1..20]: { easy, medium, hard, deadly } }` (valori interi del sistema 5E-compatible).
  - `multiplierForCount(n) → number` — 1→1, 2→1.5, 3–6→2, 7–10→2.5, 11–14→3, ≥15→4.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/encounter-thresholds.test.js`:
```js
import { describe, it, expect } from "vitest";
import { XP_THRESHOLDS, multiplierForCount } from "../encounter/thresholds.js";

describe("XP_THRESHOLDS", () => {
  it("copre i livelli 1..20", () => {
    for (let l = 1; l <= 20; l++) {
      expect(XP_THRESHOLDS[l]).toBeTruthy();
      const t = XP_THRESHOLDS[l];
      expect(t.easy).toBeLessThanOrEqual(t.medium);
      expect(t.medium).toBeLessThanOrEqual(t.hard);
      expect(t.hard).toBeLessThanOrEqual(t.deadly);
    }
  });
  it("valori di riferimento al livello 1 e 5", () => {
    expect(XP_THRESHOLDS[1]).toEqual({ easy: 25, medium: 50, hard: 75, deadly: 100 });
    expect(XP_THRESHOLDS[5]).toEqual({ easy: 250, medium: 500, hard: 750, deadly: 1100 });
  });
});

describe("multiplierForCount", () => {
  it("scala col numero di mostri", () => {
    expect(multiplierForCount(1)).toBe(1);
    expect(multiplierForCount(2)).toBe(1.5);
    expect(multiplierForCount(3)).toBe(2);
    expect(multiplierForCount(6)).toBe(2);
    expect(multiplierForCount(7)).toBe(2.5);
    expect(multiplierForCount(11)).toBe(3);
    expect(multiplierForCount(15)).toBe(4);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/encounter-thresholds.test.js`
Expected: FAIL (modulo inesistente).

- [ ] **Step 3: Implementare `lib/encounter/thresholds.js`**

```js
// Soglie XP per personaggio e livello (sistema 5E-compatible). Numeri funzionali
// del sistema di gioco, neutri: nessuna prosa né marchio.
export const XP_THRESHOLDS = {
  1:  { easy: 25,   medium: 50,   hard: 75,   deadly: 100 },
  2:  { easy: 50,   medium: 100,  hard: 150,  deadly: 200 },
  3:  { easy: 75,   medium: 150,  hard: 225,  deadly: 400 },
  4:  { easy: 125,  medium: 250,  hard: 375,  deadly: 500 },
  5:  { easy: 250,  medium: 500,  hard: 750,  deadly: 1100 },
  6:  { easy: 300,  medium: 600,  hard: 900,  deadly: 1400 },
  7:  { easy: 350,  medium: 750,  hard: 1100, deadly: 1700 },
  8:  { easy: 450,  medium: 900,  hard: 1400, deadly: 2100 },
  9:  { easy: 550,  medium: 1100, hard: 1600, deadly: 2400 },
  10: { easy: 600,  medium: 1200, hard: 1900, deadly: 2800 },
  11: { easy: 800,  medium: 1600, hard: 2400, deadly: 3600 },
  12: { easy: 1000, medium: 2000, hard: 3000, deadly: 4500 },
  13: { easy: 1100, medium: 2200, hard: 3400, deadly: 5100 },
  14: { easy: 1250, medium: 2500, hard: 3800, deadly: 5700 },
  15: { easy: 1400, medium: 2800, hard: 4300, deadly: 6400 },
  16: { easy: 1600, medium: 3200, hard: 4800, deadly: 7200 },
  17: { easy: 2000, medium: 3900, hard: 5900, deadly: 8800 },
  18: { easy: 2100, medium: 4200, hard: 6300, deadly: 9500 },
  19: { easy: 2400, medium: 4900, hard: 7300, deadly: 10900 },
  20: { easy: 2800, medium: 5700, hard: 8500, deadly: 12700 },
};

// Moltiplicatore in base al numero di mostri nell'incontro.
export function multiplierForCount(n) {
  if (n <= 1) return 1;
  if (n === 2) return 1.5;
  if (n <= 6) return 2;
  if (n <= 10) return 2.5;
  if (n <= 14) return 3;
  return 4;
}
```

- [ ] **Step 4: Eseguire i test e verificare il successo**

Run: `cd lib && npx vitest run test/encounter-thresholds.test.js`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "feat(lib): soglie XP 5E-compatible + moltiplicatori (dati neutri)"
```

---

### Task 7: `lib/encounter/budget.js` — budget del party e XP rettificato

**Files:**
- Create: `lib/encounter/budget.js`
- Test: `lib/test/encounter-budget.test.js`

**Interfaces:**
- Consumes: `XP_THRESHOLDS`, `multiplierForCount` da `lib/encounter/thresholds.js`.
- Produces:
  - `partyBudget(levels) → { easy, medium, hard, deadly }` — somma le soglie per ogni livello dell'array `levels` (es. `[3,3,3,4]`). Lancia `Error` se un livello non è in 1..20.
  - `adjustedXp(xpList) → number` — `somma(xpList) * multiplierForCount(xpList.length)`.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/encounter-budget.test.js`:
```js
import { describe, it, expect } from "vitest";
import { partyBudget, adjustedXp } from "../encounter/budget.js";

describe("partyBudget", () => {
  it("somma le soglie del party", () => {
    expect(partyBudget([1, 1])).toEqual({ easy: 50, medium: 100, hard: 150, deadly: 200 });
  });
  it("party misto", () => {
    const b = partyBudget([3, 3, 3, 4]);
    expect(b.hard).toBe(225 + 225 + 225 + 375);
  });
  it("errore su livello invalido", () => {
    expect(() => partyBudget([21])).toThrow(/livello/i);
  });
});

describe("adjustedXp", () => {
  it("applica il moltiplicatore per numero di mostri", () => {
    expect(adjustedXp([50])).toBe(50);          // ×1
    expect(adjustedXp([50, 50])).toBe(150);      // 100 ×1.5
    expect(adjustedXp([100, 100, 100])).toBe(600); // 300 ×2
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/encounter-budget.test.js`
Expected: FAIL (modulo inesistente).

- [ ] **Step 3: Implementare `lib/encounter/budget.js`**

```js
import { XP_THRESHOLDS, multiplierForCount } from "./thresholds.js";

export function partyBudget(levels) {
  const total = { easy: 0, medium: 0, hard: 0, deadly: 0 };
  for (const lvl of levels) {
    const t = XP_THRESHOLDS[lvl];
    if (!t) throw new Error(`Livello non valido: ${lvl} (atteso 1..20).`);
    total.easy += t.easy;
    total.medium += t.medium;
    total.hard += t.hard;
    total.deadly += t.deadly;
  }
  return total;
}

export function adjustedXp(xpList) {
  const sum = xpList.reduce((a, b) => a + b, 0);
  return sum * multiplierForCount(xpList.length);
}
```

- [ ] **Step 4: Eseguire i test e verificare il successo**

Run: `cd lib && npx vitest run test/encounter-budget.test.js`
Expected: PASS (4 test).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "feat(lib): partyBudget + adjustedXp (encounter math)"
```

---

### Task 8: `lib/encounter/propose.js` — proposte di incontri entro budget

**Files:**
- Create: `lib/encounter/propose.js`
- Test: `lib/test/encounter-propose.test.js`

**Interfaces:**
- Consumes: `adjustedXp` da `lib/encounter/budget.js`.
- Produces: `proposeEncounters({ candidates, target, maxResults = 5 }) → Proposal[]` con `Proposal = { id, name, count, adjustedXp }`. Per ogni candidato `{ id, name, xp }` trova il **massimo numero di copie** il cui `adjustedXp` resta ≤ `target` (gruppi mono-tipo, v1; combinazioni multi-tipo = backlog documentato). Scarta i candidati che non entrano nemmeno con 1 copia. Ordina per `adjustedXp` decrescente (più vicino al target) e ritorna i primi `maxResults`.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/encounter-propose.test.js`:
```js
import { describe, it, expect } from "vitest";
import { proposeEncounters } from "../encounter/propose.js";

describe("proposeEncounters", () => {
  it("trova il massimo numero di copie entro il target", () => {
    // xp 50: n=1→50, n=2→150 (×1.5), n=3→300 (×2). target 200 → max 2.
    const props = proposeEncounters({ candidates: [{ id: "g", name: "G", xp: 50 }], target: 200 });
    expect(props[0]).toEqual({ id: "g", name: "G", count: 2, adjustedXp: 150 });
  });
  it("scarta i candidati che non entrano con 1 copia", () => {
    const props = proposeEncounters({ candidates: [{ id: "drago", name: "D", xp: 5000 }], target: 200 });
    expect(props).toEqual([]);
  });
  it("ordina per vicinanza al target e rispetta maxResults", () => {
    const props = proposeEncounters({
      candidates: [
        { id: "a", name: "A", xp: 25 },
        { id: "b", name: "B", xp: 100 },
      ],
      target: 200,
      maxResults: 1,
    });
    expect(props.length).toBe(1);
    expect(props[0].adjustedXp).toBeLessThanOrEqual(200);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/encounter-propose.test.js`
Expected: FAIL (modulo inesistente).

- [ ] **Step 3: Implementare `lib/encounter/propose.js`**

```js
import { adjustedXp } from "./budget.js";

// v1: gruppi mono-tipo (n copie di uno stesso mostro). Le combinazioni multi-tipo
// sono backlog: vanno comunque validate a mano contro il budget restituito.
const MAX_COUNT = 30; // limite di sicurezza alla ricerca

export function proposeEncounters({ candidates, target, maxResults = 5 }) {
  const proposals = [];
  for (const c of candidates) {
    let best = 0;
    let bestXp = 0;
    for (let n = 1; n <= MAX_COUNT; n++) {
      const xp = adjustedXp(Array(n).fill(c.xp));
      if (xp <= target) {
        best = n;
        bestXp = xp;
      } else {
        break;
      }
    }
    if (best > 0) proposals.push({ id: c.id, name: c.name, count: best, adjustedXp: bestXp });
  }
  proposals.sort((a, b) => b.adjustedXp - a.adjustedXp);
  return proposals.slice(0, maxResults);
}
```

- [ ] **Step 4: Eseguire i test e verificare il successo**

Run: `cd lib && npx vitest run test/encounter-propose.test.js`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "feat(lib): proposeEncounters (gruppi mono-tipo entro budget)"
```

---

### Task 9: `bin/encounter.js` + `/encounter`

**Files:**
- Create: `lib/bin/encounter.js`
- Create: `commands/encounter.md`
- Test: `lib/test/encounter-cli.test.js`

**Interfaces:**
- Consumes: `partyBudget` da `lib/encounter/budget.js`; `proposeEncounters` da `lib/encounter/propose.js`; `createLogger` da `lib/common/logger.js`.
- Produces: `runEncounter({ levels, candidates, difficulty = "hard", maxResults = 5 }, env) → { budget, target, proposals }`. Funzione pura testabile (riceve i candidati già pronti, tipicamente passati dalla skill che interroga il `compendium-reader`). Il file espone anche un main CLI che legge `--levels 3,3,3,4` e un JSON di candidati da stdin.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/encounter-cli.test.js`:
```js
import { describe, it, expect } from "vitest";
import { runEncounter } from "../bin/encounter.js";

describe("runEncounter", () => {
  it("calcola budget e proposte per la difficoltà scelta", () => {
    const out = runEncounter({
      levels: [1, 1, 1, 1],
      candidates: [{ id: "g", name: "G", xp: 50 }],
      difficulty: "medium",
    }, {});
    expect(out.budget.medium).toBe(200);
    expect(out.target).toBe(200);
    expect(out.proposals[0].id).toBe("g");
    expect(out.proposals[0].adjustedXp).toBeLessThanOrEqual(200);
  });
  it("difficoltà di default = hard", () => {
    const out = runEncounter({ levels: [1, 1], candidates: [], }, {});
    expect(out.target).toBe(out.budget.hard);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/encounter-cli.test.js`
Expected: FAIL (`runEncounter` non esiste).

- [ ] **Step 3: Implementare `lib/bin/encounter.js`**

```js
#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { partyBudget } from "../encounter/budget.js";
import { proposeEncounters } from "../encounter/propose.js";
import { createLogger } from "../common/logger.js";

export function runEncounter({ levels, candidates = [], difficulty = "hard", maxResults = 5 }, env = {}) {
  const logger = createLogger(env);
  const budget = partyBudget(levels);
  const target = budget[difficulty];
  if (target === undefined) throw new Error(`Difficoltà non valida: ${difficulty} (easy|medium|hard|deadly).`);
  const proposals = proposeEncounters({ candidates, target, maxResults });
  logger.info(`budget ${difficulty}=${target}; ${proposals.length} proposte`);
  return { budget, target, proposals };
}

async function readStdin() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  const text = Buffer.concat(chunks).toString("utf8").trim();
  return text ? JSON.parse(text) : [];
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const argv = process.argv.slice(2);
  const lIdx = argv.indexOf("--levels");
  const levels = lIdx !== -1 ? argv[lIdx + 1].split(",").map(Number) : [];
  const dIdx = argv.indexOf("--difficulty");
  const difficulty = dIdx !== -1 ? argv[dIdx + 1] : "hard";
  const candidates = await readStdin();
  try {
    const out = runEncounter({ levels, candidates, difficulty }, process.env);
    process.stdout.write(JSON.stringify(out, null, 2) + "\n");
  } catch (e) {
    process.stderr.write(`[ttrpg-studio] ERROR ${e.message}\n`);
    process.exit(1);
  }
}
```

- [ ] **Step 4: Eseguire i test e verificare il successo**

Run: `cd lib && npx vitest run test/encounter-cli.test.js`
Expected: PASS (2 test).

- [ ] **Step 5: Creare il comando `/encounter`**

`commands/encounter.md`:
```markdown
---
description: Budget XP del party e proposte di incontri dal compendio
argument-hint: [livelli es. 3,3,3,4] [difficoltà]
---

Calcola il budget XP e propone incontri per il party "$ARGUMENTS".

1. Determina i **livelli** del party (es. `3,3,3,4`) e la **difficoltà**
   (`easy|medium|hard|deadly`, default `hard`).
2. Ottieni i **mostri candidati** dal compendio via il tool `search`/`list` del
   server `compendium-reader` e costruisci un array `[{ id, name, xp }]`
   (lo `xp` deriva dal CR/record del mostro).
3. Esegui:
   `echo '<candidati-json>' | node ${CLAUDE_PLUGIN_ROOT}/lib/bin/encounter.js --levels 3,3,3,4 --difficulty hard`
4. Presenta budget e proposte; per ogni incontro scelto annota **terreno,
   obiettivo e condizione di vittoria** (non solo "uccidi tutto") e scrivilo nel
   campo `encounters` dell'avventura. Le combinazioni multi-tipo vanno verificate
   a mano contro il budget mostrato.
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -s -m "feat(adventure): runEncounter + comando /encounter"
```

---

### Task 10: Tabella ricompense non-oggetto (`reward_loot` §7.2)

**Files:**
- Create: `templates/tables/loot-nonitem.json`
- Test: `lib/test/loot-nonitem.test.js`

**Interfaces:**
- Consumes: niente.
- Produces: file JSON `{ schema_version, table: "loot-nonitem", columns: { tipo, esempio } }` con ricompense **non-oggetto** (favori, titoli, informazioni, alleati) — homebrew neutre — per evitare l'inflazione magica. Riusabile da `/roll` e dalla carta oggetto (piano produzione).

- [ ] **Step 1: Creare `templates/tables/loot-nonitem.json`**

```json
{
  "schema_version": "1.0",
  "table": "loot-nonitem",
  "columns": {
    "tipo": ["favore", "titolo", "informazione", "alleato", "accesso", "immunità"],
    "esempio": [
      "un debito di sangue riscuotibile una volta",
      "un titolo onorifico riconosciuto in una regione",
      "la posizione di un passaggio dimenticato",
      "un contatto che apre una porta altrimenti chiusa",
      "diritto di transito in un territorio ostile",
      "perdono per un crimine passato"
    ]
  }
}
```

- [ ] **Step 2: Scrivere il test che valida la tabella**

`lib/test/loot-nonitem.test.js`:
```js
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const p = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "templates", "tables", "loot-nonitem.json");

describe("loot-nonitem", () => {
  it("è ben formato e non vuoto", () => {
    const data = JSON.parse(readFileSync(p, "utf8"));
    expect(data.schema_version).toBe("1.0");
    expect(data.table).toBe("loot-nonitem");
    expect(data.columns.tipo.length).toBeGreaterThanOrEqual(4);
    expect(data.columns.esempio.length).toBe(data.columns.tipo.length);
  });
});
```

- [ ] **Step 3: Eseguire il test e verificare il successo**

Run: `cd lib && npx vitest run test/loot-nonitem.test.js`
Expected: PASS (1 test).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -s -m "feat(templates): tabella ricompense non-oggetto (reward_loot)"
```

---

### Task 11: `lib/tables/roll.js` — tira su una random table

**Files:**
- Create: `lib/tables/roll.js`
- Test: `lib/test/tables-roll.test.js`

**Interfaces:**
- Consumes: `ToolError`, `CODES` da `lib/common/errors.js`.
- Produces:
  - `rollOnColumn(table, column, rng = Math.random) → string` — sceglie una voce dalla colonna. `ToolError(CODES.NOT_FOUND)` se la colonna non esiste o è vuota.
  - `rollAll(table, rng = Math.random) → { [column]: string }` — una voce per colonna.
  - `rng` iniettabile (per test deterministici): `rng()` in `[0,1)`.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/tables-roll.test.js`:
```js
import { describe, it, expect } from "vitest";
import { rollOnColumn, rollAll } from "../tables/roll.js";
import { ToolError } from "../common/errors.js";

const table = { table: "t", columns: { a: ["x", "y", "z"], b: ["uno"] } };

describe("rollOnColumn", () => {
  it("rng=0 → prima voce", () => {
    expect(rollOnColumn(table, "a", () => 0)).toBe("x");
  });
  it("rng→ultima voce", () => {
    expect(rollOnColumn(table, "a", () => 0.99)).toBe("z");
  });
  it("colonna inesistente → ToolError", () => {
    expect(() => rollOnColumn(table, "zzz", () => 0)).toThrow(ToolError);
  });
});

describe("rollAll", () => {
  it("una voce per colonna", () => {
    const r = rollAll(table, () => 0);
    expect(r).toEqual({ a: "x", b: "uno" });
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/tables-roll.test.js`
Expected: FAIL (modulo inesistente).

- [ ] **Step 3: Implementare `lib/tables/roll.js`**

```js
import { ToolError, CODES } from "../common/errors.js";

function pick(entries, rng) {
  const idx = Math.min(entries.length - 1, Math.floor(rng() * entries.length));
  return entries[idx];
}

export function rollOnColumn(table, column, rng = Math.random) {
  const entries = table?.columns?.[column];
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new ToolError(CODES.NOT_FOUND, `Colonna assente o vuota: "${column}" nella tabella "${table?.table ?? "?"}".`, false);
  }
  return pick(entries, rng);
}

export function rollAll(table, rng = Math.random) {
  const out = {};
  for (const [col, entries] of Object.entries(table?.columns ?? {})) {
    if (Array.isArray(entries) && entries.length) out[col] = pick(entries, rng);
  }
  return out;
}
```

- [ ] **Step 4: Eseguire i test e verificare il successo**

Run: `cd lib && npx vitest run test/tables-roll.test.js`
Expected: PASS (4 test).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "feat(lib): rollOnColumn/rollAll su random table (rng iniettabile)"
```

---

### Task 12: `bin/roll.js` + `/roll`

**Files:**
- Create: `lib/bin/roll.js`
- Create: `commands/roll.md`
- Test: `lib/test/roll-cli.test.js`

**Interfaces:**
- Consumes: `rollOnColumn`, `rollAll` da `lib/tables/roll.js`; `createLogger` da `lib/common/logger.js`.
- Produces: `resolveTablePath(name, env) → string|null` — cerca `<name>.json` in `SETTING_PATH/80-tables`, poi `<CLAUDE_PLUGIN_ROOT|cwd>/templates/tables`. `runRoll(argv, env, rng) → { code, result }` — carica la tabella, tira (colonna se `--col`, altrimenti tutte), stampa il risultato.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/roll-cli.test.js`:
```js
import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runRoll } from "../bin/roll.js";

function root() {
  const r = mkdtempSync(join(tmpdir(), "root-"));
  const tdir = join(r, "templates", "tables");
  mkdirSync(tdir, { recursive: true });
  writeFileSync(join(tdir, "faction-seed.json"), JSON.stringify({ table: "faction-seed", columns: { movente: ["vendetta", "potere"] } }));
  return r;
}

describe("runRoll", () => {
  it("tira tutte le colonne (rng=0)", () => {
    const r = root();
    const { code, result } = runRoll(["faction-seed"], { CLAUDE_PLUGIN_ROOT: r }, () => 0);
    expect(code).toBe(0);
    expect(result.movente).toBe("vendetta");
  });
  it("tabella inesistente → code 1", () => {
    const r = root();
    const { code } = runRoll(["inesistente"], { CLAUDE_PLUGIN_ROOT: r }, () => 0);
    expect(code).toBe(1);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/roll-cli.test.js`
Expected: FAIL (`runRoll` non esiste).

- [ ] **Step 3: Implementare `lib/bin/roll.js`**

```js
#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { rollOnColumn, rollAll } from "../tables/roll.js";
import { createLogger } from "../common/logger.js";

export function resolveTablePath(name, env = {}) {
  const candidates = [];
  if (env.SETTING_PATH) candidates.push(join(env.SETTING_PATH, "80-tables", `${name}.json`));
  const root = env.CLAUDE_PLUGIN_ROOT ?? process.cwd();
  candidates.push(join(root, "templates", "tables", `${name}.json`));
  return candidates.find((p) => existsSync(p)) ?? null;
}

export function runRoll(argv, env = {}, rng = Math.random) {
  const logger = createLogger(env);
  const args = argv.filter((a) => !a.startsWith("--"));
  const name = args[0];
  if (!name) {
    logger.error("Uso: roll <tabella> [--col <colonna>]");
    return { code: 1, result: null };
  }
  const path = resolveTablePath(name, env);
  if (!path) {
    logger.error(`Tabella non trovata: ${name}`);
    return { code: 1, result: null };
  }
  const table = JSON.parse(readFileSync(path, "utf8"));
  const cIdx = argv.indexOf("--col");
  try {
    const result = cIdx !== -1
      ? { [argv[cIdx + 1]]: rollOnColumn(table, argv[cIdx + 1], rng) }
      : rollAll(table, rng);
    logger.info(`roll ${name}: ${JSON.stringify(result)}`);
    return { code: 0, result };
  } catch (e) {
    logger.error(e.message);
    return { code: 1, result: null };
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const { code } = runRoll(process.argv.slice(2), process.env);
  process.exit(code);
}
```

- [ ] **Step 4: Eseguire i test e verificare il successo**

Run: `cd lib && npx vitest run test/roll-cli.test.js`
Expected: PASS (2 test).

- [ ] **Step 5: Creare il comando `/roll`**

`commands/roll.md`:
```markdown
---
description: Tira su una random table (seed o tabella della Setting Bible)
argument-hint: <tabella> [--col <colonna>]
---

Tira sulla tabella "$ARGUMENTS".

Esegui:
`node ${CLAUDE_PLUGIN_ROOT}/lib/bin/roll.js $ARGUMENTS`

Cerca `<tabella>.json` prima in `SETTING_PATH/80-tables/`, poi nei seed del plugin
(`templates/tables/`). Senza `--col` tira una voce per ogni colonna; con
`--col <nome>` tira solo quella colonna. Presenta il risultato in modo leggibile.
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -s -m "feat(adventure): runRoll + comando /roll"
```

---

### Task 13: `lib/session-prep/extract.js` — scheda one-page

**Files:**
- Create: `lib/session-prep/extract.js`
- Test: `lib/test/session-prep.test.js`

**Interfaces:**
- Consumes: niente.
- Produces: `extractOnePager(doc) → { strongStart, scenes, readyMonsters, backupNpcNames, complications, loot }`.
  - `strongStart = doc.strong_start`.
  - `scenes` = nomi dei primi 3 `fantastic_locations`.
  - `readyMonsters = doc.monsters` (id+ruolo).
  - `backupNpcNames` = fino a 5 nomi da `doc.npcs`.
  - `complications` = fino a 3 da `doc.consequences` (campo `then`), con fallback ai `hooks`.
  - `loot = doc.reward_loot`.
  - **Esclude i campi segreti** (`secrets_and_clues`, e i `secret` dei PNG) dall'output: la one-page è una guida-DM ma non duplica l'elenco segreti (che resta nella scheda completa).

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/session-prep.test.js`:
```js
import { describe, it, expect } from "vitest";
import { extractOnePager } from "../session-prep/extract.js";

const doc = {
  strong_start: "Il pavimento cede.",
  fantastic_locations: [
    { name: "Sala A", sensory: ["a", "b", "c"] },
    { name: "Sala B", sensory: ["a", "b", "c"] },
    { name: "Sala C", sensory: ["a", "b", "c"] },
    { name: "Sala D", sensory: ["a", "b", "c"] },
  ],
  monsters: [{ id: "m1", role: "agguato" }],
  npcs: [
    { name: "Vera", role: "guida", voice: "x", wants: "y", secret: "z" },
    { name: "Olmo", role: "oste", voice: "x", wants: "y", secret: "z" },
  ],
  consequences: [{ ifPcs: "X", then: "il porto si ammala" }],
  hooks: ["gancio1", "gancio2", "gancio3", "gancio4"],
  reward_loot: { items: [], nonItem: ["un favore"] },
};

describe("extractOnePager", () => {
  it("estrae i campi chiave, max 3 scene", () => {
    const op = extractOnePager(doc);
    expect(op.strongStart).toBe("Il pavimento cede.");
    expect(op.scenes).toEqual(["Sala A", "Sala B", "Sala C"]);
    expect(op.readyMonsters).toEqual([{ id: "m1", role: "agguato" }]);
    expect(op.backupNpcNames).toEqual(["Vera", "Olmo"]);
    expect(op.complications).toEqual(["il porto si ammala"]);
    expect(op.loot.nonItem).toEqual(["un favore"]);
  });
  it("non espone i segreti dei PNG né secrets_and_clues", () => {
    const op = extractOnePager(doc);
    const json = JSON.stringify(op);
    expect(json).not.toContain("secret");
    expect(json).not.toContain('"z"');
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/session-prep.test.js`
Expected: FAIL (modulo inesistente).

- [ ] **Step 3: Implementare `lib/session-prep/extract.js`**

```js
export function extractOnePager(doc) {
  const d = doc ?? {};
  const scenes = (d.fantastic_locations ?? []).slice(0, 3).map((l) => l.name);
  const backupNpcNames = (d.npcs ?? []).slice(0, 5).map((n) => n.name);
  let complications = (d.consequences ?? []).map((c) => c.then).filter(Boolean).slice(0, 3);
  if (complications.length === 0) complications = (d.hooks ?? []).slice(0, 3);
  return {
    strongStart: d.strong_start ?? "",
    scenes,
    readyMonsters: d.monsters ?? [],
    backupNpcNames,
    complications,
    loot: d.reward_loot ?? { items: [], nonItem: [] },
  };
}
```

- [ ] **Step 4: Eseguire i test e verificare il successo**

Run: `cd lib && npx vitest run test/session-prep.test.js`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "feat(lib): extractOnePager (session-prep, esclude i segreti)"
```

---

### Task 14: `bin/session-prep.js` + `/session-prep`

**Files:**
- Create: `lib/session-prep/render.js`
- Create: `lib/bin/session-prep.js`
- Create: `commands/session-prep.md`
- Test: `lib/test/session-prep-cli.test.js`

**Interfaces:**
- Consumes: `extractOnePager` da `lib/session-prep/extract.js`; `writeFileSafe` da `lib/common/fs-atomic.js`; `validateAdventureConfig` da `lib/common/config.js`; `createLogger` da `lib/common/logger.js`.
- Produces:
  - `renderOnePager(onePager, title) → string` — markdown della scheda one-page.
  - `runSessionPrep(argv, env) → { code }` — legge `<ADVENTURE_PATH>/<slug>/adventure.json`, estrae la one-page, scrive `<slug>/session-prep.md` (atomico, policy `overwrite`).

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/session-prep-cli.test.js`:
```js
import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderOnePager, runSessionPrep } from "../bin/session-prep.js";

describe("renderOnePager", () => {
  it("produce markdown con le sezioni chiave", () => {
    const md = renderOnePager({
      strongStart: "Apertura.", scenes: ["A", "B"], readyMonsters: [{ id: "m", role: "r" }],
      backupNpcNames: ["Vera"], complications: ["crollo"], loot: { items: [], nonItem: ["favore"] },
    }, "La Cripta");
    expect(md).toContain("# La Cripta — Session Prep");
    expect(md).toContain("Apertura.");
    expect(md).toContain("Vera");
  });
});

describe("runSessionPrep", () => {
  it("scrive session-prep.md accanto all'avventura", () => {
    const adventurePath = mkdtempSync(join(tmpdir(), "ap-"));
    const advDir = join(adventurePath, "la-cripta");
    mkdirSync(advDir, { recursive: true });
    writeFileSync(join(advDir, "adventure.json"), JSON.stringify({
      title: "La Cripta", strong_start: "Apertura.", fantastic_locations: [],
      npcs: [], monsters: [], consequences: [], hooks: [], reward_loot: { items: [], nonItem: [] },
    }));
    const { code } = runSessionPrep(["la-cripta"], { ADVENTURE_PATH: adventurePath });
    expect(code).toBe(0);
    expect(existsSync(join(advDir, "session-prep.md"))).toBe(true);
    expect(readFileSync(join(advDir, "session-prep.md"), "utf8")).toContain("Session Prep");
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/session-prep-cli.test.js`
Expected: FAIL (moduli inesistenti).

- [ ] **Step 3: Implementare `lib/session-prep/render.js`**

```js
export function renderOnePager(op, title) {
  const list = (arr) => (arr.length ? arr.map((x) => `- ${x}`).join("\n") : "- —");
  const monsters = op.readyMonsters.length
    ? op.readyMonsters.map((m) => `- ${m.id} (${m.role})`).join("\n")
    : "- —";
  const loot = [
    ...(op.loot?.items ?? []).map((i) => `- ${typeof i === "string" ? i : i.name}`),
    ...(op.loot?.nonItem ?? []).map((x) => `- ${x}`),
  ].join("\n") || "- —";
  return `# ${title} — Session Prep

## Strong start
${op.strongStart || "—"}

## 3 scene probabili
${list(op.scenes)}

## Mostri pronti
${monsters}

## 5 nomi PNG di riserva
${list(op.backupNpcNames)}

## 3 complicazioni
${list(op.complications)}

## Loot
${loot}
`;
}
```

- [ ] **Step 4: Implementare `lib/bin/session-prep.js`**

```js
#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { extractOnePager } from "../session-prep/extract.js";
import { renderOnePager } from "../session-prep/render.js";
import { writeFileSafe } from "../common/fs-atomic.js";
import { validateAdventureConfig } from "../common/config.js";
import { createLogger } from "../common/logger.js";

export { renderOnePager };

export function runSessionPrep(argv, env) {
  const logger = createLogger(env);
  const slug = argv.filter((a) => !a.startsWith("--"))[0];
  if (!slug) {
    logger.error("Uso: session-prep <slug-avventura>");
    return { code: 1 };
  }
  let cfg;
  try {
    cfg = validateAdventureConfig(env);
  } catch (e) {
    logger.error(e.message);
    return { code: 1 };
  }
  const jsonPath = join(cfg.adventurePath, slug, "adventure.json");
  if (!existsSync(jsonPath)) {
    logger.error(`Avventura non trovata: ${jsonPath}`);
    return { code: 1 };
  }
  const doc = JSON.parse(readFileSync(jsonPath, "utf8"));
  const md = renderOnePager(extractOnePager(doc), doc.title ?? slug);
  const out = join(cfg.adventurePath, slug, "session-prep.md");
  const res = writeFileSafe(out, md, { policy: "overwrite" });
  logger.info(`${res.action} ${res.path}`);
  return { code: 0 };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const { code } = runSessionPrep(process.argv.slice(2), process.env);
  process.exit(code);
}
```

- [ ] **Step 5: Eseguire i test e verificare il successo**

Run: `cd lib && npx vitest run test/session-prep-cli.test.js`
Expected: PASS (2 test).

- [ ] **Step 6: Creare il comando `/session-prep`**

`commands/session-prep.md`:
```markdown
---
description: Genera la scheda one-page di una sessione (deliverable Lazy DM)
argument-hint: <slug-avventura>
---

Genera la scheda **one-page** per l'avventura "$ARGUMENTS" (vista-DM, niente
elenco segreti).

Esegui:
`node ${CLAUDE_PLUGIN_ROOT}/lib/bin/session-prep.js "$ARGUMENTS"`

Legge `ADVENTURE_PATH/<slug>/adventure.json` e scrive `session-prep.md` accanto
ad essa: strong start, 3 scene probabili, mostri pronti, 5 nomi PNG di riserva,
3 complicazioni, loot. Riassumi il risultato e ricorda che gli handout per i
giocatori (vista-player) sono nel piano di produzione.
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -s -m "feat(adventure): renderOnePager + /session-prep"
```

---

### Task 15: Integrazione — `lib/index.js`, README, denylist, suite completa

**Files:**
- Modify: `lib/index.js` (riesporta le nuove API)
- Modify: `README.md` (sezione Avventure)
- Test: `lib/test/index-adventure.test.js`

**Interfaces:**
- Consumes: tutte le nuove API pubbliche.
- Produces: import unico aggiornato; documentazione; verifica denylist + suite verde.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/index-adventure.test.js`:
```js
import { describe, it, expect } from "vitest";
import * as api from "../index.js";

describe("lib/index — adventure", () => {
  it("riesporta le API della pipeline avventura", () => {
    for (const name of ["validateAdventure", "scaffoldAdventure", "partyBudget",
      "adjustedXp", "proposeEncounters", "rollOnColumn", "rollAll", "extractOnePager",
      "validateAdventureConfig"]) {
      expect(typeof api[name]).toBe("function");
    }
    expect(api.XP_THRESHOLDS).toBeTruthy();
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/index-adventure.test.js`
Expected: FAIL (riesporti assenti).

- [ ] **Step 3: Aggiungere i riesporti in `lib/index.js`**

Aggiungere in fondo a `lib/index.js` (lasciando i riesporti worldbuilding):
```js
export { validateAdventureConfig } from "./common/config.js";
export { validateAdventure, RULES as ADVENTURE_RULES } from "./adventure/validate.js";
export { scaffoldAdventure } from "./adventure/scaffold.js";
export { XP_THRESHOLDS, multiplierForCount } from "./encounter/thresholds.js";
export { partyBudget, adjustedXp } from "./encounter/budget.js";
export { proposeEncounters } from "./encounter/propose.js";
export { rollOnColumn, rollAll } from "./tables/roll.js";
export { extractOnePager } from "./session-prep/extract.js";
```

- [ ] **Step 4: Eseguire il test e verificare il successo**

Run: `cd lib && npx vitest run test/index-adventure.test.js`
Expected: PASS (1 test).

- [ ] **Step 5: Aggiornare il README con la sezione Avventure**

In `README.md`, dopo la sezione Worldbuilding, aggiungere:
```markdown
## Avventure (tavolo pronto)

    ADVENTURE_PATH=./adventures   # cartella delle tue avventure

- `/new-adventure "<titolo>"` — crea un'avventura come **struttura dati validata**
  (≥8 segreti, 3–5 luoghi sensoriali, ≥3 ganci, PNG con voce e segreto).
- `/encounter 3,3,3,4 hard` — budget XP del party e proposte di incontri dal
  compendio (soglie 5E-compatible).
- `/session-prep <slug>` — scheda one-page per il tavolo (vista-DM).
- `/roll <tabella>` — tira su una random table (seed del plugin o `80-tables/`
  della Setting Bible).

Gli handout per i giocatori (vista-player) arrivano col modulo di produzione.
```

- [ ] **Step 6: Verificare denylist e suite completa**

Run: `node scripts/check-denylist.mjs`
Expected: `denylist: pulito`.

Run: `cd lib && npx vitest run`
Expected: PASS (tutti i file worldbuilding + adventure: config-adventure, adventure-validate, adventure-scaffold, new-adventure-cli, encounter-thresholds, encounter-budget, encounter-propose, encounter-cli, loot-nonitem, tables-roll, roll-cli, session-prep, session-prep-cli, index-adventure).

Run: `cd mcp/compendium-reader && npx vitest run`
Expected: PASS (35 test invariati — nessuna regressione).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -s -m "feat(adventure): riesporti lib/index + README + verifica suite/denylist"
```

---

## Self-Review

**1. Spec coverage (§ dello spec → task):**
- §6.1 Template d'avventura come struttura dati validata → Task 2 (validate) + 3 (template/SCHEMA) + 4 (scaffold) ✓
- §6.2 Encounter-builder (budget XP, combinazioni, terreno/obiettivo/vittoria) → Task 6 (soglie) + 7 (budget) + 8 (propose) + 9 (/encounter) ✓ (CR sanity-check = backlog dichiarato; combinazioni multi-tipo = backlog dichiarato in propose.js e nel comando)
- §6.3 Canon e lingua (campaign-context → Setting Bible, lingua) → Task 3 (campaign-context.md) + config lang in Task 1 ✓
- §7.2 Loot legato all'avventura + ricompense non-oggetto → reward_loot nello schema (Task 2/3) + Task 10 (tabella non-oggetto) ✓ (la carta che lo consuma è nel piano produzione)
- §12 session-prep one-page → Task 13 (extract) + 14 (/session-prep) ✓
- §12 random tables + /roll → Task 11 (roll) + 12 (/roll) ✓; integrazione con `80-tables/` della Bible via `resolveTablePath` ✓
- §12 handout giocatori → **fuori scope** (richiede `render-to-png` del piano produzione), dichiarato in README e nel comando session-prep ✓
- §14 config/logging (ADVENTURE_PATH, stderr) → Task 1 + uso di `createLogger` ovunque ✓
- §15 denylist/compliance su nuova superficie → Task 15 ✓
- Vincoli cross-platform/LF/ESM/atomicità → Global Constraints, rispettati (`node:path`, `pathToFileURL`, `writeFileSafe`) ✓

**2. Placeholder scan:** ogni step ha codice o comando concreto; nessun "TBD"/"gestisci errori" generico. Skill/comandi sono markdown senza test automatico (dichiarato); la logica testabile sta nelle lib. ✓

**3. Type consistency:**
- Documento avventura: stessa forma (`strong_start`, `secrets_and_clues`, `fantastic_locations[].sensory`, `npcs[]`, `monsters[]`, `encounters[]`, `hooks`, `consequences[].then`, `reward_loot`) coerente tra Task 2 (validate), 3 (template/SCHEMA), 13 (extract). ✓
- `scaffoldAdventure({title,destDir,templatesDir,policy,dryRun})→{slug,created,actions}` coerente tra Task 4 e 5. ✓
- `partyBudget(levels)→{easy,medium,hard,deadly}` e `adjustedXp(xpList)` coerenti tra Task 7, 8 (propose usa adjustedXp), 9 (runEncounter usa partyBudget+proposeEncounters). ✓
- `proposeEncounters({candidates,target,maxResults})→[{id,name,count,adjustedXp}]` coerente tra Task 8 e 9. ✓
- `rollOnColumn(table,column,rng)` / `rollAll(table,rng)` coerenti tra Task 11 e 12. ✓
- `extractOnePager(doc)→{strongStart,scenes,readyMonsters,backupNpcNames,complications,loot}` coerente tra Task 13 e 14 (render). ✓
- `validateAdventureConfig→{adventurePath,lang}` usato in Task 5, 14 come da Task 1. ✓
- `writeFileSafe`, `slugify`, `createLogger`, `ToolError/CODES` riusati dal package esistente (piano worldbuilding) con le firme già definite. ✓

> Nota implementativa: `runEncounter` riceve i candidati `{id,name,xp}` già pronti; la derivazione `CR→XP` e l'interrogazione del `compendium-reader` sono affidate alla skill/comando (l'LLM costruisce l'array). La parte deterministica (budget, moltiplicatori, proposte) è interamente testata. Le combinazioni multi-tipo e il sanity-check CR restano backlog dichiarati.

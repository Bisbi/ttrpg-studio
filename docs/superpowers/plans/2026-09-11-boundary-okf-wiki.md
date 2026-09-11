# Confine pubblico/locale + wiki OKF — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separare la superficie pubblicabile dall'uso personale spostando l'adapter di import in un repo privato annidato, e introdurre due bundle OKF (pubblico e locale) con strumenti deterministici che verificano il confine a ogni commit.

**Architecture:** La separazione è **per file**, mai per riga: `local/` è un repo git privato annidato e ignorato dal repo pubblico, quindi non committabile per errore. Ogni documento wiki dichiara `scope: public|local` nel frontmatter, e lo script `wiki boundary` fallisce se la dichiarazione è smentita da `git ls-files`. La logica vive in `lib/wiki/` come funzioni **pure a zero dipendenze** (git e filesystem sono iniettati dai chiamanti), la CLI in `lib/bin/wiki.js` seguendo la convenzione `run*(argv, env) → { code }` già usata da `lib/bin/new-campaign.js`.

**Tech Stack:** Node.js ≥20 (ESM), `vitest` (già presente in `lib/`). Nessuna nuova dipendenza, runtime o di sviluppo. Formato dati: [OKF v0.1](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing) — markdown con frontmatter YAML.

**Spec:** `docs/specs/2026-09-11-public-local-boundary-design.md`

---

## Global Constraints

Valgono per **ogni** task. Non vanno ripetute nei task, ma nessun task può violarle.

- **Zero dipendenze runtime in `lib/`.** Il package `lib/` ha solo `vitest` in `devDependencies`. Non aggiungere pacchetti: niente `js-yaml`, `gray-matter`, `glob`, `chalk`. Il parser di frontmatter va scritto a mano su un sottoinsieme dichiarato di YAML.
- **Funzioni pure, effetti iniettati.** I moduli in `lib/wiki/` non chiamano `fs` né `child_process`. Ricevono dati già letti e funzioni di lookup come argomenti. Solo `lib/bin/wiki.js` tocca il filesystem e git.
- **Test in `lib/test/`, mai accanto ai sorgenti.** `lib/vitest.config.js` ha `include: ["test/**/*.test.js"]`: un test scritto in `lib/wiki/` non viene mai eseguito. Gli import nei test risalgono di un livello: `import { x } from "../wiki/frontmatter.js"`.
- **Line ending LF.** `.gitattributes` impone `eol=lf`. Un file con CRLF e shebang rompe esbuild/vitest anche se `node --check` passa.
- **Shell: PowerShell 5.1.** Il tool Bash in questo ambiente fallisce con `fatal error - add_item`. Usare PowerShell per git, node e vitest. Niente heredoc. `&&` non esiste: usare `;` oppure `X; if ($?) { Y }`.
- **Messaggi di commit a riga singola.** Le parentesi e gli a capo nei messaggi rompono il parser di PowerShell. Usare `-m` singolo, e un secondo `-m` per l'attribuzione.
- **Nessun marchio di terze parti** in codice, nomi di file, nomi di comandi o documentazione del repo pubblico. Formula ammessa: "5E-compatible", mai il nome del gioco. `node scripts/check-denylist.mjs` deve passare a fine di ogni task.
- **Commenti in inglese** in tutto il codice del repo pubblico, secondo la policy §6 della spec: header di modulo sempre; commenti nel corpo solo su scelte non ovvie e sul *perché*; **mai riferimenti ad altro codice** ("chiamato da X", "vedi Y").
- **Attribuzione commit.** Ogni commit termina con:
  `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`

### Comandi di verifica (memorizzare)

```powershell
Push-Location lib; npx vitest run; Pop-Location            # suite lib (attuale: 162 test)
Push-Location mcp\compendium-reader; npx vitest run; Pop-Location   # suite mcp (attuale: 43)
node scripts/check-denylist.mjs                            # superficie pubblica pulita
```

---

## File Structure

| File | Responsabilità |
|---|---|
| `lib/wiki/frontmatter.js` | Analizza il blocco `---` in testa a un markdown; sottoinsieme YAML dichiarato |
| `lib/wiki/links.js` | Estrae i link markdown relativi dal corpo di un nodo |
| `lib/wiki/validate.js` | Regole di validità di un nodo: campi obbligatori, vocabolari, corpo dei `Decision` |
| `lib/wiki/index-gen.js` | Genera il contenuto di `index.md` e le voci di `log.md` |
| `lib/wiki/boundary.js` | Confronta gli `scope` dichiarati con lo stato di git |
| `lib/wiki/stale.js` | Individua i nodi il cui `covers` è più recente del `timestamp` |
| `lib/bin/wiki.js` | CLI: legge il filesystem, interroga git, orchestra i moduli sopra |
| `wiki/` | Bundle OKF pubblico (contenuto, non codice) |
| `AGENTS.md` | Ingresso per gli agenti: policy dei commenti e puntatori ai due bundle |
| `agents/wiki-guardian.md` | Definizione del sub-agente guardiano |

---

# FASE 0 — Migrazione

> **⚠ Task 1 e Task 2 NON vanno delegati a un subagent.** Sono chirurgia git su due repository con
> spostamento di file fra alberi. Vanno eseguiti nella sessione principale, con l'utente presente,
> un passo alla volta. Un subagent non ha modo di recuperare da un errore a metà.

### Task 1: Creare il repo privato `local/` e spostarci l'adapter di import

**Files:**
- Create: `local/` (nuovo repo git, non versionato dal repo pubblico)
- Copy: `lib/import/detag.js` → `local/import/detag.js`
- Copy: `lib/import/convert.js` → `local/import/convert.js`
- Copy: il vecchio script di import in `scripts/` (il cui nome conteneva quello del fornitore) →
  `local/import/import-compendium.mjs`
- Copy: `scripts/e2e-check.mjs` → `local/import/e2e-check.mjs`
- Copy: `lib/test/detag.test.js` → `local/test/detag.test.js`
- Copy: `lib/test/convert.test.js` → `local/test/convert.test.js`
- Create: `local/package.json`, `local/vitest.config.js`, `local/.gitignore`

**Contesto necessario:** il branch corrente è `compendio-2024`, **mai pushato** (`origin` ha solo
`master`). L'adapter è una foglia: nessun modulo di `lib/`, `mcp/`, `commands/` o `skills/` lo
importa; le uniche entrate sono i suoi due test, che si spostano con lui. La sola dipendenza verso
l'esterno è `SCHEMAS` da `mcp/compendium-reader/schema/index.js`.

> **Perché copia e non `git mv`.** Spostare i file in avanti li lascerebbe **nella storia** del branch:
> quando il branch arriva su `master` e viene pushato, `git log` espone comunque i nomi dei file, e il
> nome del fornitore compare in chiaro. La separazione deve valere anche per la storia, non solo per
> l'albero corrente. Qui si copia soltanto; è il **Task 2** a ricostruire il branch pubblico da
> `master`, in modo che l'adapter non esista in nessun commit destinato a diventare pubblico.
> Il branch `compendio-2024` resta intatto sul disco come rete di sicurezza finché l'utente non lo
> dichiara eliminabile.

- [ ] **Step 1: Verificare che la foglia sia ancora pulita**

```powershell
Select-String -Path lib\*\*.js,mcp\compendium-reader\*.js,scripts\*.mjs -Pattern 'import/' | Where-Object { $_.Path -notmatch '\\lib\\import\\' } | ForEach-Object { "$($_.Path):$($_.LineNumber)" }
```
Atteso: solo `lib\test\convert.test.js` e `lib\test\detag.test.js`. Se compare altro, **fermarsi** e
riportare: la premessa del piano non vale più.

- [ ] **Step 2: Creare l'albero locale e copiarvi i file**

```powershell
New-Item -ItemType Directory -Force local\import, local\test
Copy-Item lib\import\detag.js local\import\detag.js
Copy-Item lib\import\convert.js local\import\convert.js
Copy-Item scripts\<vecchio-script-di-import>.mjs local\import\import-compendium.mjs
Copy-Item scripts\e2e-check.mjs local\import\e2e-check.mjs
Copy-Item lib\test\detag.test.js local\test\detag.test.js
Copy-Item lib\test\convert.test.js local\test\convert.test.js
```

Nessun comando git in questo passo: il repo pubblico non deve registrare né lo spostamento né la
rimozione, perché il branch che lo conterrebbe verrà scartato dal Task 2.

Il nome `import-compendium.mjs` sostituisce quello precedente di proposito: la denylist controlla i
**contenuti** dei file, non i **nomi**, e il nome precedente esponeva il fornitore in `git ls-files`.

- [ ] **Step 3: Correggere i path di import nei file spostati**

In `local/import/import-compendium.mjs`, la risalita passa da un livello a due:
```js
import { CONVERTERS } from "./convert.js";
import { SCHEMAS } from "../../mcp/compendium-reader/schema/index.js";
```
In `local/import/e2e-check.mjs`:
```js
import { buildServer } from "../../mcp/compendium-reader/index.js";
```
In `local/test/detag.test.js` e `local/test/convert.test.js`:
```js
import { stripTags } from "../import/detag.js";
import { slugify, convertMonster, convertSpell, convertItem, convertBackground, convertFeat } from "../import/convert.js";
```

- [ ] **Step 4: Creare i file di package del repo locale**

`local/package.json`:
```json
{
  "name": "ttrpg-studio-local",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": { "test": "vitest run" },
  "devDependencies": { "vitest": "^2.0.0" }
}
```

`local/vitest.config.js`:
```js
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { environment: "node", include: ["test/**/*.test.js"] },
});
```

`local/.gitignore`:
```
node_modules/
extract/
output/
```

- [ ] **Step 5: Verificare che i test spostati passino nel nuovo albero**

```powershell
Push-Location local; npm install; npx vitest run; Pop-Location
```
Atteso: 12 test verdi (5 di `detag`, 7 di `convert`).

- [ ] **Step 6: Trasformare `local/` in un repo git indipendente**

```powershell
Push-Location local; git init; git add -A; git commit -m "feat: import adapter extracted from the public surface" -m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"; Pop-Location
```

- [ ] **Step 7: Verificare che il repo locale sia autonomo**

```powershell
Push-Location local; git log --oneline; git status --porcelain; Pop-Location
```
Atteso: un commit, working tree pulito. Il repo pubblico non è stato toccato in questo task: `git
status` nella radice mostra ancora `local/` come directory non tracciata, ed è corretto — è il Task 2
a ignorarla.

---

### Task 2: Ricostruire il branch pubblico e richiudere la denylist

**Files:**
- Create: branch `compendio-2024-clean` a partire da `master`
- Modify: `scripts/check-denylist.mjs`, `.gitignore`, `CHANGELOG.md`

**Interfaces:**
- Consumes: `local/` già popolato e committato dal Task 1.
- Produces: un branch pubblico la cui **storia** non contiene l'adapter; `isExcluded(f)` con tre sole
  eccezioni. Nessun task successivo dipende da queste interfacce.

**Contesto necessario.** Il branch `compendio-2024` contiene dieci commit di cui sei riguardano
esclusivamente l'adapter. Poiché non è mai stato pushato, la via pulita non è rimuovere i file ma
**non introdurli mai**: si riparte da `master` e si porta avanti solo il lavoro pubblico.

Ripartizione verificata commit per commit:

| Commit | File toccati | Destinazione |
|---|---|---|
| `16c9db9` | `mcp/…/schema/{SCHEMA.md,index.js,types.js}` | **pubblico** — cherry-pick |
| `01da21e` | `mcp/…/lib/{config,store}.js`, 2 test | **pubblico** — cherry-pick |
| `8b1ce29` | `commands/new-campaign.md`, `lib/bin/new-campaign.js`, `lib/campaign/`, 1 test | **pubblico** — cherry-pick |
| `c12f535` | misto (vedi Step 4) | **parziale** — solo i path pubblici |
| `addc702` `3fd6d11` `c11a33d` `4258dd8` `422aac8` `d5d729c` | adapter e suoi test | **locale** — già nel Task 1, mai portati qui |

`scripts/check-denylist.mjs` escludeva dalla scansione `lib/import/` e i due script perché quel codice
doveva citare i codici del formato di origine. Senza quel codice le eccezioni diventano un buco senza
motivo: qualunque file futuro sotto `lib/import/` sfuggirebbe al controllo. Per questo la versione di
`c12f535` **non** va portata: si riscrive.

- [ ] **Step 1: Rete di sicurezza sul lavoro esistente**

```powershell
git tag pre-boundary-migration compendio-2024
git tag
```
Atteso: il tag compare nell'elenco. Da qui in avanti nulla è irreversibile.

- [ ] **Step 2: Creare il branch pubblico da master**

```powershell
git checkout master
git checkout -b compendio-2024-clean
git log --oneline -1
```
Atteso: l'ultimo commit di `master`.

- [ ] **Step 3: Portare i tre commit interamente pubblici**

```powershell
git cherry-pick 16c9db9
git cherry-pick 01da21e
git cherry-pick 8b1ce29
git log --oneline -3
```
In caso di conflitto **fermarsi e riportare**: significa che `master` è avanzato rispetto a quando il
branch è nato, e la risoluzione va decisa, non indovinata.

- [ ] **Step 4: Portare le sole parti pubbliche di `c12f535`**

```powershell
git checkout c12f535 -- CHANGELOG.md lib/bin/new-campaign.js mcp/compendium-reader/test/schema-extended.test.js mcp/compendium-reader/test/store-multiroot.test.js
git checkout compendio-2024 -- docs/specs/2026-09-11-public-local-boundary-design.md docs/superpowers/plans/2026-09-11-boundary-okf-wiki.md
```

La seconda riga porta avanti la spec e questo piano, che sono stati committati sul vecchio branch e
servono a chi esegue i task successivi.

Sono i quattro path pubblici di quel commit: il CHANGELOG, l'obbligo di `--reference` in
`new-campaign` (che elimina un path della macchina scritto nel codice) e due test dell'MCP. Restano
fuori di proposito `lib/test/convert.test.js` e `lib/test/detag.test.js` (test dell'adapter, già in
`local/`) e `scripts/check-denylist.mjs`, riscritto al passo seguente.

Aprire `CHANGELOG.md` e **rimuovere ogni voce che nomina l'adapter o la fonte di import**: quelle
righe descrivono lavoro che non è più in questo repository. Sostituirle con:
```markdown
### Changed
- The import adapter now lives in a private repository outside the public surface.
- Denylist exceptions reduced to `docs/`, the script itself, and lockfiles.
```

- [ ] **Step 5: Dimostrare il buco prima di chiuderlo**

Creare `lib/import/canary.js` contenente **un qualunque termine dell'array `DENY`** di
`scripts/check-denylist.mjs` (il file stesso della denylist elenca i termini; qui non se ne
trascrive nessuno, perché questo documento è a sua volta sottoposto alla scansione), aggiungerlo
all'indice e lanciare il controllo:

```powershell
New-Item -ItemType Directory -Force lib\import
git add lib/import/canary.js
node scripts/check-denylist.mjs
```
Atteso: **exit 0**. Il termine vietato passa perché l'eccezione lo copre: è la dimostrazione concreta
che l'eccezione era un buco, non una comodità.

- [ ] **Step 6: Riscrivere le esclusioni**

In `scripts/check-denylist.mjs` sostituire il blocco delle esclusioni con:
```js
const SELF = "scripts/check-denylist.mjs";
const isExcluded = (f) =>
  f.startsWith("docs/") ||
  f === SELF ||
  f.endsWith("package-lock.json");
```
Eliminare la costante `IMPORT_TOOLING` e le righe che escludevano l'adapter. Riscrivere il commento di
testa **in inglese**, elencando le tre eccezioni rimaste e il motivo di ciascuna.

- [ ] **Step 7: Verificare che il canarino venga ora intercettato, poi rimuoverlo**

```powershell
node scripts/check-denylist.mjs
```
Atteso: **exit diverso da 0**, con `lib/import/canary.js` nell'elenco.

```powershell
git rm -f lib/import/canary.js
Remove-Item -Recurse -Force lib\import -ErrorAction SilentlyContinue
node scripts/check-denylist.mjs
```
Atteso: exit 0, nessun file segnalato.

- [ ] **Step 8: Ignorare `local/`**

Aggiungere in `.gitignore`, sotto la sezione dei dati di gioco:
```
# Repo privato annidato: uso personale del plugin, mai versionato qui
/local/
```

Verifica:
```powershell
git check-ignore -q local; if ($?) { "local e ignorato" } else { "ERRORE: local NON e ignorato" }
git status --porcelain | Select-String 'local/'
```
Atteso: `local e ignorato`, e nessuna riga dal secondo comando.

- [ ] **Step 9: Verificare che la storia del nuovo branch sia pulita**

```powershell
git log --format='' --name-only compendio-2024-clean | Sort-Object -Unique | Select-String 'import|e2e-check'
```
Atteso: **nessuna riga**. È il controllo che giustifica l'intera ricostruzione: se qui compare un
path dell'adapter, un commit sbagliato è stato portato e va rifatto lo Step 2.

- [ ] **Step 10: Suite verdi e commit**

```powershell
Push-Location lib; npm install; npx vitest run; Pop-Location
Push-Location mcp\compendium-reader; npm install; npx vitest run; Pop-Location
node scripts/check-denylist.mjs
```
`lib` non contiene più i 12 test dell'adapter, `mcp` li ha tutti. **Annotare i numeri effettivi nel
resoconto** invece di darli per attesi: sono il riferimento per i task successivi. Se un test fallisce,
riportarlo senza modificarlo.

```powershell
git add -A
git commit -m "chore: rebuild the public branch without the import adapter" -m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 11: Consegnare la decisione sul vecchio branch all'utente**

Non eliminare `compendio-2024`. Riportare all'utente: il branch pulito è pronto, il vecchio resta
insieme al tag `pre-boundary-migration`, e l'eliminazione è una sua scelta da prendere dopo aver
verificato il risultato.

---

# FASE 1 — Strumenti OKF

> I task da 3 a 9 sono **delegabili a subagent**: ciascuno tocca file propri, ha interfacce
> dichiarate e un ciclo di test autonomo. Task 3 → 5 e 3 → 8 hanno dipendenze di interfaccia
> (indicate in ogni blocco **Interfaces**); i Task 4, 6, 7 sono indipendenti fra loro.

### Task 3: `lib/wiki/frontmatter.js` — parser del frontmatter

**Files:**
- Create: `lib/wiki/frontmatter.js`
- Test: `lib/test/wiki-frontmatter.test.js`

**Interfaces:**
- Consumes: `ToolError` e `CODES` da `lib/common/errors.js`.
- Produces:
  - `parseFrontmatter(text) → { data, body }` — `data` è un oggetto le cui chiavi sono stringhe e i
    valori `string` oppure `string[]`; `body` è il markdown dopo il blocco, senza newline iniziali.
    Solleva `ToolError(CODES.INVALID_INPUT, msg)` su sintassi non supportata o blocco assente.

**Sottoinsieme YAML supportato** (tutto il resto è un errore esplicito, mai un'interpretazione
silenziosa):
- il documento inizia con una riga `---` e il blocco termina alla successiva riga `---`;
- ogni riga significativa è `chiave: valore`; la chiave corrisponde a `^[A-Za-z][A-Za-z0-9_-]*$`;
- il valore è una **lista inline** `[a, b, c]` → `string[]` (gli elementi sono trimmati; `[]` → `[]`),
  oppure uno **scalare** → `string` (trimmato; le virgolette `"` o `'` che racchiudono l'intero valore
  vengono rimosse);
- le righe vuote e quelle che iniziano con `#` sono ignorate;
- niente annidamento, niente liste su più righe, niente valori multilinea, niente ancore.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/wiki-frontmatter.test.js`:
```js
import { describe, it, expect } from "vitest";
import { parseFrontmatter } from "../wiki/frontmatter.js";

const doc = `---
type: Gotcha
title: CRLF breaks vitest
description: "A colon: inside quotes stays put"
scope: public
covers: [lib/bin/, .gitattributes]
tags: []
timestamp: 2026-09-11T10:00:00Z
---

Body line one.
`;

describe("parseFrontmatter", () => {
  it("estrae gli scalari", () => {
    const { data } = parseFrontmatter(doc);
    expect(data.type).toBe("Gotcha");
    expect(data.scope).toBe("public");
  });

  it("rimuove le virgolette che racchiudono l'intero valore", () => {
    const { data } = parseFrontmatter(doc);
    expect(data.description).toBe("A colon: inside quotes stays put");
  });

  it("estrae le liste inline e trimma gli elementi", () => {
    const { data } = parseFrontmatter(doc);
    expect(data.covers).toEqual(["lib/bin/", ".gitattributes"]);
  });

  it("una lista vuota resta un array vuoto", () => {
    const { data } = parseFrontmatter(doc);
    expect(data.tags).toEqual([]);
  });

  it("restituisce il corpo senza newline iniziali", () => {
    const { body } = parseFrontmatter(doc);
    expect(body).toBe("Body line one.\n");
  });

  it("ignora righe vuote e commenti", () => {
    const { data } = parseFrontmatter("---\n\n# nota\ntype: Decision\n---\nx\n");
    expect(data.type).toBe("Decision");
  });

  it("errore se manca il blocco di apertura", () => {
    expect(() => parseFrontmatter("type: Gotcha\n")).toThrow(/frontmatter/i);
  });

  it("errore se il blocco non viene chiuso", () => {
    expect(() => parseFrontmatter("---\ntype: Gotcha\n")).toThrow(/closing/i);
  });

  it("errore su sintassi fuori dal sottoinsieme", () => {
    expect(() => parseFrontmatter("---\ncovers:\n  - a\n---\nx\n")).toThrow(/unsupported/i);
  });

  it("errore su chiave non valida", () => {
    expect(() => parseFrontmatter("---\n9bad: x\n---\ny\n")).toThrow(/unsupported/i);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare che fallisca**

```powershell
Push-Location lib; npx vitest run test/wiki-frontmatter.test.js; Pop-Location
```
Atteso: FAIL, `Failed to resolve import "../wiki/frontmatter.js"`.

- [ ] **Step 3: Scrivere l'implementazione minima**

`lib/wiki/frontmatter.js`, con header di modulo in inglese e nessun riferimento ad altro codice:
```js
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
```

- [ ] **Step 4: Eseguire il test e verificare che passi**

```powershell
Push-Location lib; npx vitest run test/wiki-frontmatter.test.js; Pop-Location
```
Atteso: 10 test PASS.

- [ ] **Step 5: Commit**

```powershell
git add lib/wiki/frontmatter.js lib/test/wiki-frontmatter.test.js
git commit -m "feat(wiki): parse OKF frontmatter over a declared YAML subset" -m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

**NON fare in questo task:** non leggere file dal disco, non validare i campi (è il Task 5), non
aggiungere dipendenze.

---

### Task 4: `lib/wiki/links.js` — estrazione dei link interni

**Files:**
- Create: `lib/wiki/links.js`
- Test: `lib/test/wiki-links.test.js`

**Interfaces:**
- Consumes: niente.
- Produces:
  - `extractLinks(body) → string[]` — i target dei link markdown `[testo](target)` che puntano a
    risorse **relative**. Sono esclusi i target che iniziano con uno schema (`http:`, `https:`,
    `mailto:`) o con `#`. Dal target viene rimossa l'eventuale ancora (`a.md#x` → `a.md`). L'ordine
    di apparizione è preservato e i duplicati sono rimossi.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/wiki-links.test.js`:
```js
import { describe, it, expect } from "vitest";
import { extractLinks } from "../wiki/links.js";

describe("extractLinks", () => {
  it("trova i link relativi", () => {
    expect(extractLinks("see [a](a.md) and [b](sub/b.md)")).toEqual(["a.md", "sub/b.md"]);
  });

  it("esclude i link assoluti e le mail", () => {
    expect(extractLinks("[x](https://e.com) [y](mailto:a@b.c) [z](z.md)")).toEqual(["z.md"]);
  });

  it("esclude le ancore interne alla pagina", () => {
    expect(extractLinks("[top](#intro)")).toEqual([]);
  });

  it("rimuove l'ancora dal target relativo", () => {
    expect(extractLinks("[a](a.md#section)")).toEqual(["a.md"]);
  });

  it("rimuove i duplicati preservando l'ordine", () => {
    expect(extractLinks("[a](b.md) [c](a.md) [d](b.md)")).toEqual(["b.md", "a.md"]);
  });

  it("corpo senza link", () => {
    expect(extractLinks("plain text")).toEqual([]);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare che fallisca**

```powershell
Push-Location lib; npx vitest run test/wiki-links.test.js; Pop-Location
```
Atteso: FAIL, modulo non risolto.

- [ ] **Step 3: Scrivere l'implementazione minima**

`lib/wiki/links.js`:
```js
// Collects the relative markdown links a wiki node points at, so that a broken cross-reference fails
// the validation run instead of quietly rotting. Absolute URLs are out of scope: nothing here can
// verify that a remote page still exists.
const LINK = /\[[^\]]*\]\(([^)\s]+)\)/g;
const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

export function extractLinks(body) {
  const out = [];
  for (const m of String(body).matchAll(LINK)) {
    const target = m[1];
    if (target.startsWith("#") || SCHEME.test(target)) continue;
    const clean = target.split("#")[0];
    if (clean !== "" && !out.includes(clean)) out.push(clean);
  }
  return out;
}
```

- [ ] **Step 4: Eseguire il test e verificare che passi**

```powershell
Push-Location lib; npx vitest run test/wiki-links.test.js; Pop-Location
```
Atteso: 6 test PASS.

- [ ] **Step 5: Commit**

```powershell
git add lib/wiki/links.js lib/test/wiki-links.test.js
git commit -m "feat(wiki): extract relative markdown links from node bodies" -m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

**NON fare in questo task:** non verificare l'esistenza dei target sul disco (è compito della CLI nel
Task 9).

---

### Task 5: `lib/wiki/validate.js` — regole di validità di un nodo

**Files:**
- Create: `lib/wiki/validate.js`
- Test: `lib/test/wiki-validate.test.js`

**Interfaces:**
- Consumes: il valore `{ data, body }` prodotto da `parseFrontmatter` (Task 3). Non importa
  `frontmatter.js`: riceve l'oggetto già analizzato.
- Produces:
  - `NODE_TYPES` → `["Gotcha", "Decision", "Invariant", "Module", "Workflow"]`
  - `SCOPES` → `["public", "local"]`
  - `RESERVED` → `["index.md", "log.md"]`
  - `validateNode({ data, body }, relPath) → string[]` — elenco di messaggi di errore, vuoto se il
    nodo è valido. Ogni messaggio inizia con `relPath` seguito da `: `.

**Regole:**
- campi obbligatori: `type`, `title`, `description`, `scope`, `covers`, `tags`, `timestamp`;
- `type` ∈ `NODE_TYPES`; `scope` ∈ `SCOPES`;
- `covers` è un array non vuoto; `tags` è un array (può essere vuoto);
- `timestamp` corrisponde a `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$`;
- se `type` è `Decision`, il corpo deve contenere le tre intestazioni `## Standard`,
  `## Why not here`, `## What breaks` — è il contratto di §5 della spec.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/wiki-validate.test.js`:
```js
import { describe, it, expect } from "vitest";
import { validateNode, NODE_TYPES, SCOPES, RESERVED } from "../wiki/validate.js";

const good = {
  data: {
    type: "Gotcha",
    title: "T",
    description: "D",
    scope: "public",
    covers: ["lib/"],
    tags: [],
    timestamp: "2026-09-11T10:00:00Z",
  },
  body: "text",
};

const node = (over = {}, body = "text") => ({ data: { ...good.data, ...over }, body });

describe("vocabolari", () => {
  it("espone i tipi ammessi", () => {
    expect(NODE_TYPES).toEqual(["Gotcha", "Decision", "Invariant", "Module", "Workflow"]);
  });
  it("espone gli scope ammessi", () => {
    expect(SCOPES).toEqual(["public", "local"]);
  });
  it("espone i nomi riservati", () => {
    expect(RESERVED).toEqual(["index.md", "log.md"]);
  });
});

describe("validateNode", () => {
  it("un nodo valido non produce errori", () => {
    expect(validateNode(good, "wiki/a.md")).toEqual([]);
  });

  it("segnala ogni campo obbligatorio mancante", () => {
    const errs = validateNode({ data: {}, body: "x" }, "wiki/a.md");
    for (const f of ["type", "title", "description", "scope", "covers", "tags", "timestamp"]) {
      expect(errs.some((e) => e.includes(f))).toBe(true);
    }
  });

  it("prefissa ogni errore con il path", () => {
    const errs = validateNode({ data: {}, body: "x" }, "wiki/a.md");
    expect(errs.every((e) => e.startsWith("wiki/a.md: "))).toBe(true);
  });

  it("rifiuta un type fuori vocabolario", () => {
    const errs = validateNode(node({ type: "Note" }), "wiki/a.md");
    expect(errs.some((e) => /type/.test(e))).toBe(true);
  });

  it("rifiuta uno scope fuori vocabolario", () => {
    const errs = validateNode(node({ scope: "secret" }), "wiki/a.md");
    expect(errs.some((e) => /scope/.test(e))).toBe(true);
  });

  it("rifiuta covers vuoto", () => {
    const errs = validateNode(node({ covers: [] }), "wiki/a.md");
    expect(errs.some((e) => /covers/.test(e))).toBe(true);
  });

  it("rifiuta covers scalare", () => {
    const errs = validateNode(node({ covers: "lib/" }), "wiki/a.md");
    expect(errs.some((e) => /covers/.test(e))).toBe(true);
  });

  it("accetta tags vuoto", () => {
    expect(validateNode(node({ tags: [] }), "wiki/a.md")).toEqual([]);
  });

  it("rifiuta un timestamp non ISO 8601 UTC", () => {
    const errs = validateNode(node({ timestamp: "2026-09-11" }), "wiki/a.md");
    expect(errs.some((e) => /timestamp/.test(e))).toBe(true);
  });

  it("un Decision senza le tre sezioni obbligatorie e invalido", () => {
    const errs = validateNode(node({ type: "Decision" }, "just prose"), "wiki/d.md");
    expect(errs.some((e) => /Standard/.test(e))).toBe(true);
    expect(errs.some((e) => /Why not here/.test(e))).toBe(true);
    expect(errs.some((e) => /What breaks/.test(e))).toBe(true);
  });

  it("un Decision con le tre sezioni e valido", () => {
    const body = "## Standard\na\n\n## Why not here\nb\n\n## What breaks\nc\n";
    expect(validateNode(node({ type: "Decision" }, body), "wiki/d.md")).toEqual([]);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare che fallisca**

```powershell
Push-Location lib; npx vitest run test/wiki-validate.test.js; Pop-Location
```
Atteso: FAIL, modulo non risolto.

- [ ] **Step 3: Scrivere l'implementazione minima**

`lib/wiki/validate.js`:
```js
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
```

- [ ] **Step 4: Eseguire il test e verificare che passi**

```powershell
Push-Location lib; npx vitest run test/wiki-validate.test.js; Pop-Location
```
Atteso: 14 test PASS.

- [ ] **Step 5: Commit**

```powershell
git add lib/wiki/validate.js lib/test/wiki-validate.test.js
git commit -m "feat(wiki): validate node frontmatter and Decision body contract" -m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

**NON fare in questo task:** non leggere file, non controllare i link (Task 4 li estrae, il Task 9 li
risolve), non confrontare con git.

---

### Task 6: `lib/wiki/index-gen.js` — generazione di `index.md` e `log.md`

**Files:**
- Create: `lib/wiki/index-gen.js`
- Test: `lib/test/wiki-index-gen.test.js`

**Interfaces:**
- Consumes: `NODE_TYPES` da `lib/wiki/validate.js` (Task 5), per l'ordine dei gruppi. Riceve inoltre
  una lista di `{ file, data }` dove `file` è il nome del file relativo alla directory dell'indice e
  `data` è il frontmatter già analizzato.
- Produces:
  - `buildIndex(entries) → string` — markdown completo di `index.md`. I nodi sono raggruppati per
    `type` nell'ordine di `NODE_TYPES` (i tipi senza nodi non compaiono) e, dentro ogni gruppo,
    ordinati per `title` crescente. Termina sempre con un solo `\n`.
  - `buildLogEntry({ timestamp, added, updated, removed }) → string` — una voce di `log.md`. Le
    sezioni con lista vuota sono omesse. Termina sempre con `\n`.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/wiki-index-gen.test.js`:
```js
import { describe, it, expect } from "vitest";
import { buildIndex, buildLogEntry } from "../wiki/index-gen.js";

const entries = [
  { file: "z.md", data: { type: "Gotcha", title: "Zebra", description: "d1" } },
  { file: "a.md", data: { type: "Gotcha", title: "Alpha", description: "d2" } },
  { file: "d.md", data: { type: "Decision", title: "Delta", description: "d3" } },
];

describe("buildIndex", () => {
  it("raggruppa per type nell'ordine canonico", () => {
    const md = buildIndex(entries);
    expect(md.indexOf("## Gotcha")).toBeLessThan(md.indexOf("## Decision"));
  });

  it("ordina per title dentro il gruppo", () => {
    const md = buildIndex(entries);
    expect(md.indexOf("Alpha")).toBeLessThan(md.indexOf("Zebra"));
  });

  it("scrive link e descrizione", () => {
    expect(buildIndex(entries)).toContain("- [Alpha](a.md) — d2");
  });

  it("omette i tipi senza nodi", () => {
    expect(buildIndex(entries)).not.toContain("## Module");
  });

  it("termina con un solo newline", () => {
    const md = buildIndex(entries);
    expect(md.endsWith("\n")).toBe(true);
    expect(md.endsWith("\n\n")).toBe(false);
  });

  it("lista vuota produce un indice vuoto ma valido", () => {
    expect(buildIndex([])).toBe("# Index\n");
  });
});

describe("buildLogEntry", () => {
  it("elenca le sezioni non vuote", () => {
    const e = buildLogEntry({ timestamp: "2026-09-11T10:00:00Z", added: ["a.md"], updated: ["b.md"], removed: [] });
    expect(e).toContain("## 2026-09-11T10:00:00Z");
    expect(e).toContain("- added: a.md");
    expect(e).toContain("- updated: b.md");
  });

  it("omette le sezioni vuote", () => {
    const e = buildLogEntry({ timestamp: "2026-09-11T10:00:00Z", added: ["a.md"], updated: [], removed: [] });
    expect(e).not.toContain("updated");
    expect(e).not.toContain("removed");
  });

  it("termina con un newline", () => {
    const e = buildLogEntry({ timestamp: "2026-09-11T10:00:00Z", added: ["a.md"], updated: [], removed: [] });
    expect(e.endsWith("\n")).toBe(true);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare che fallisca**

```powershell
Push-Location lib; npx vitest run test/wiki-index-gen.test.js; Pop-Location
```
Atteso: FAIL, modulo non risolto.

- [ ] **Step 3: Scrivere l'implementazione minima**

`lib/wiki/index-gen.js`:
```js
// Renders the two reserved OKF files, index.md and log.md, from the nodes present in a directory.
// They are generated rather than hand-written because a listing that drifts from the files it
// describes is worse than no listing: an agent trusts it and stops looking further.
import { NODE_TYPES } from "./validate.js";

export function buildIndex(entries) {
  let out = "# Index\n";
  for (const type of NODE_TYPES) {
    const group = entries
      .filter((e) => e.data.type === type)
      .sort((a, b) => String(a.data.title).localeCompare(String(b.data.title)));
    if (group.length === 0) continue;
    out += `\n## ${type}\n\n`;
    for (const e of group) out += `- [${e.data.title}](${e.file}) — ${e.data.description}\n`;
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
```

- [ ] **Step 4: Eseguire il test e verificare che passi**

```powershell
Push-Location lib; npx vitest run test/wiki-index-gen.test.js; Pop-Location
```
Atteso: 9 test PASS.

- [ ] **Step 5: Commit**

```powershell
git add lib/wiki/index-gen.js lib/test/wiki-index-gen.test.js
git commit -m "feat(wiki): generate the reserved index.md and log.md contents" -m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

**NON fare in questo task:** non scrivere su disco, non leggere directory.

---

### Task 7: `lib/wiki/boundary.js` — verifica del confine pubblico/locale

**Files:**
- Create: `lib/wiki/boundary.js`
- Test: `lib/test/wiki-boundary.test.js`

**Interfaces:**
- Consumes: niente da altri task (riceve dati già raccolti).
- Produces:
  - `checkBoundary({ nodes, trackedFiles, localIgnored }) → string[]` — elenco di violazioni, vuoto se
    il confine tiene.
    - `nodes`: `[{ file, data: { scope } }]`, dove `file` è il path **relativo alla radice del repo**;
    - `trackedFiles`: `Set<string>` con l'output di `git ls-files`;
    - `localIgnored`: `boolean`, esito di `git check-ignore local`.

**Regole:**
- un nodo `scope: local` presente in `trackedFiles` è una violazione — è il caso che il sistema
  esiste per impedire;
- un nodo `scope: public` **assente** da `trackedFiles` è una violazione: un documento che si dichiara
  pubblico ma non è versionato non arriverà mai a chi clona il repo;
- `localIgnored === false` è una violazione, perché l'intero confine poggia su quella riga di
  `.gitignore`.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/wiki-boundary.test.js`:
```js
import { describe, it, expect } from "vitest";
import { checkBoundary } from "../wiki/boundary.js";

const tracked = new Set(["wiki/a.md", "wiki/b.md"]);

describe("checkBoundary", () => {
  it("nessuna violazione quando tutto e coerente", () => {
    const nodes = [
      { file: "wiki/a.md", data: { scope: "public" } },
      { file: "local/wiki/x.md", data: { scope: "local" } },
    ];
    expect(checkBoundary({ nodes, trackedFiles: tracked, localIgnored: true })).toEqual([]);
  });

  it("segnala un nodo local che risulta tracciato da git", () => {
    const nodes = [{ file: "wiki/b.md", data: { scope: "local" } }];
    const v = checkBoundary({ nodes, trackedFiles: tracked, localIgnored: true });
    expect(v).toHaveLength(1);
    expect(v[0]).toContain("wiki/b.md");
    expect(v[0]).toMatch(/local/);
  });

  it("segnala un nodo public non versionato", () => {
    const nodes = [{ file: "wiki/missing.md", data: { scope: "public" } }];
    const v = checkBoundary({ nodes, trackedFiles: tracked, localIgnored: true });
    expect(v).toHaveLength(1);
    expect(v[0]).toContain("wiki/missing.md");
  });

  it("segnala local/ non ignorato", () => {
    const v = checkBoundary({ nodes: [], trackedFiles: tracked, localIgnored: false });
    expect(v).toHaveLength(1);
    expect(v[0]).toMatch(/gitignore/i);
  });

  it("accumula piu violazioni insieme", () => {
    const nodes = [
      { file: "wiki/b.md", data: { scope: "local" } },
      { file: "wiki/missing.md", data: { scope: "public" } },
    ];
    expect(checkBoundary({ nodes, trackedFiles: tracked, localIgnored: false })).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare che fallisca**

```powershell
Push-Location lib; npx vitest run test/wiki-boundary.test.js; Pop-Location
```
Atteso: FAIL, modulo non risolto.

- [ ] **Step 3: Scrivere l'implementazione minima**

`lib/wiki/boundary.js`:
```js
// Compares the scope each node declares against what git actually tracks.
// The declaration alone protects nothing - it is an assertion, and this is the check that makes it
// worth something. A node marked local that reached the index is the exact failure the whole
// separation exists to prevent, so it is reported first and never downgraded to a warning.
export function checkBoundary({ nodes, trackedFiles, localIgnored }) {
  const violations = [];

  for (const node of nodes) {
    const isTracked = trackedFiles.has(node.file);
    if (node.data.scope === "local" && isTracked) {
      violations.push(`${node.file}: declared scope "local" but the file is tracked by git`);
    }
    if (node.data.scope === "public" && !isTracked) {
      violations.push(`${node.file}: declared scope "public" but the file is not tracked by git`);
    }
  }

  if (!localIgnored) {
    violations.push('local/ is not covered by .gitignore: add "/local/" to it');
  }

  return violations;
}
```

- [ ] **Step 4: Eseguire il test e verificare che passi**

```powershell
Push-Location lib; npx vitest run test/wiki-boundary.test.js; Pop-Location
```
Atteso: 5 test PASS.

- [ ] **Step 5: Commit**

```powershell
git add lib/wiki/boundary.js lib/test/wiki-boundary.test.js
git commit -m "feat(wiki): verify declared scope against git tracking state" -m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

**NON fare in questo task:** non chiamare `git` (lo fa il Task 9 e passa i risultati), non leggere
`.gitignore` dal disco.

---

### Task 8: `lib/wiki/stale.js` — nodi superati dal codice che coprono

**Files:**
- Create: `lib/wiki/stale.js`
- Test: `lib/test/wiki-stale.test.js`

**Interfaces:**
- Consumes: niente da altri task.
- Produces:
  - `findStale(nodes, lastModified) → [{ file, path, nodeAt, coveredAt }]`
    - `nodes`: `[{ file, data: { timestamp, covers } }]`;
    - `lastModified`: funzione `(path) => string | null` che restituisce il timestamp ISO dell'ultima
      modifica di quel path, o `null` se sconosciuto;
    - il risultato elenca **una voce per coppia nodo/path** superata, cioè quando
      `coveredAt > nodeAt`. Un `lastModified` che restituisce `null` non produce mai una voce.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/wiki-stale.test.js`:
```js
import { describe, it, expect } from "vitest";
import { findStale } from "../wiki/stale.js";

const node = (covers, timestamp = "2026-09-11T10:00:00Z") => ({
  file: "wiki/a.md",
  data: { timestamp, covers },
});

describe("findStale", () => {
  it("nessuna voce se il codice e piu vecchio del nodo", () => {
    const lm = () => "2026-09-01T00:00:00Z";
    expect(findStale([node(["lib/x.js"])], lm)).toEqual([]);
  });

  it("segnala il nodo se il codice e piu recente", () => {
    const lm = () => "2026-09-20T00:00:00Z";
    const out = findStale([node(["lib/x.js"])], lm);
    expect(out).toHaveLength(1);
    expect(out[0]).toEqual({
      file: "wiki/a.md",
      path: "lib/x.js",
      nodeAt: "2026-09-11T10:00:00Z",
      coveredAt: "2026-09-20T00:00:00Z",
    });
  });

  it("una voce per ogni path superato", () => {
    const lm = () => "2026-09-20T00:00:00Z";
    expect(findStale([node(["lib/x.js", "lib/y.js"])], lm)).toHaveLength(2);
  });

  it("ignora i path di cui non si conosce la data", () => {
    expect(findStale([node(["lib/x.js"])], () => null)).toEqual([]);
  });

  it("timestamp identico non e stale", () => {
    const lm = () => "2026-09-11T10:00:00Z";
    expect(findStale([node(["lib/x.js"])], lm)).toEqual([]);
  });

  it("un nodo senza covers non produce voci", () => {
    expect(findStale([{ file: "wiki/a.md", data: { timestamp: "2026-09-11T10:00:00Z" } }], () => "2027-01-01T00:00:00Z")).toEqual([]);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare che fallisca**

```powershell
Push-Location lib; npx vitest run test/wiki-stale.test.js; Pop-Location
```
Atteso: FAIL, modulo non risolto.

- [ ] **Step 3: Scrivere l'implementazione minima**

`lib/wiki/stale.js`:
```js
// Lists nodes whose covered paths changed after the node was last touched.
// This is a hint, never a verdict: a rename or a formatting sweep moves the date without invalidating
// anything the node says. That is why the result is reported for a human or an agent to judge, and
// why nothing here blocks a commit.
export function findStale(nodes, lastModified) {
  const out = [];
  for (const node of nodes) {
    const covers = Array.isArray(node.data.covers) ? node.data.covers : [];
    const nodeAt = node.data.timestamp;
    for (const path of covers) {
      const coveredAt = lastModified(path);
      if (!coveredAt || !nodeAt) continue;
      if (coveredAt > nodeAt) out.push({ file: node.file, path, nodeAt, coveredAt });
    }
  }
  return out;
}
```

Il confronto è una comparazione di stringhe: i timestamp ISO 8601 UTC con campi a larghezza fissa
sono ordinabili lessicograficamente, e il formato è già imposto dal Task 5.

- [ ] **Step 4: Eseguire il test e verificare che passi**

```powershell
Push-Location lib; npx vitest run test/wiki-stale.test.js; Pop-Location
```
Atteso: 6 test PASS.

- [ ] **Step 5: Commit**

```powershell
git add lib/wiki/stale.js lib/test/wiki-stale.test.js
git commit -m "feat(wiki): report nodes outdated by the paths they cover" -m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

**NON fare in questo task:** non chiamare `git log` (la funzione `lastModified` viene iniettata).

---

### Task 9: `lib/bin/wiki.js` — CLI, hook di pre-commit e job di CI

**Files:**
- Create: `lib/bin/wiki.js`
- Create: `lib/wiki/cli-args.js`
- Test: `lib/test/wiki-cli-args.test.js`
- Modify: `.github/workflows/ci.yml`
- Create: `.githooks/pre-commit`
- Modify: `README.md` (una sezione sugli strumenti wiki)

**Interfaces:**
- Consumes: `parseFrontmatter` (Task 3), `extractLinks` (Task 4), `validateNode` + `RESERVED`
  (Task 5), `buildIndex` + `buildLogEntry` (Task 6), `checkBoundary` (Task 7), `findStale` (Task 8).
- Produces:
  - `parseWikiArgs(argv) → { command, dirs, json }` — `command` ∈
    `["validate", "index", "boundary", "stale", "all"]`; `dirs` default `["wiki", "local/wiki"]`;
    `json` booleano da `--json`. Un comando sconosciuto o assente dà `command: null`.
  - `runWiki(argv, env) → { code }` — `0` se tutto passa; `1` se `validate` o `boundary` riportano
    problemi. `stale` non influenza mai il codice di uscita.

**Contesto necessario:** la convenzione dei bin di questo repo è in `lib/bin/new-campaign.js`: shebang
`#!/usr/bin/env node`, una funzione `run*(argv, env)` esportata che restituisce `{ code }`, il logger
da `lib/common/logger.js` che scrive su **stderr**, e la guardia `isMain` con `pathToFileURL`. Le
directory assenti non sono un errore: chi clona il repo pubblico non ha `local/wiki`.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/wiki-cli-args.test.js`:
```js
import { describe, it, expect } from "vitest";
import { parseWikiArgs } from "../wiki/cli-args.js";

describe("parseWikiArgs", () => {
  it("riconosce il comando", () => {
    expect(parseWikiArgs(["validate"]).command).toBe("validate");
  });

  it("default: entrambe le directory", () => {
    expect(parseWikiArgs(["all"]).dirs).toEqual(["wiki", "local/wiki"]);
  });

  it("--dir sostituisce le directory di default", () => {
    expect(parseWikiArgs(["all", "--dir", "wiki"]).dirs).toEqual(["wiki"]);
  });

  it("--dir ripetuto accumula", () => {
    expect(parseWikiArgs(["all", "--dir", "a", "--dir", "b"]).dirs).toEqual(["a", "b"]);
  });

  it("--json attiva l'uscita machine-readable", () => {
    expect(parseWikiArgs(["stale", "--json"]).json).toBe(true);
  });

  it("comando sconosciuto da command null", () => {
    expect(parseWikiArgs(["frobnicate"]).command).toBe(null);
  });

  it("nessun argomento da command null", () => {
    expect(parseWikiArgs([]).command).toBe(null);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare che fallisca**

```powershell
Push-Location lib; npx vitest run test/wiki-cli-args.test.js; Pop-Location
```
Atteso: FAIL, modulo non risolto.

- [ ] **Step 3: Scrivere `lib/wiki/cli-args.js`**

```js
// Turns the wiki command line into a plain options object.
// Argument parsing lives apart from the command itself so it can be tested without touching git or
// the filesystem, which the command unavoidably does.
const COMMANDS = ["validate", "index", "boundary", "stale", "all"];
const DEFAULT_DIRS = ["wiki", "local/wiki"];

export function parseWikiArgs(argv) {
  const command = COMMANDS.includes(argv[0]) ? argv[0] : null;
  const dirs = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dir" && argv[i + 1]) { dirs.push(argv[i + 1]); i++; }
  }
  return {
    command,
    dirs: dirs.length > 0 ? dirs : [...DEFAULT_DIRS],
    json: argv.includes("--json"),
  };
}
```

- [ ] **Step 4: Eseguire il test e verificare che passi**

```powershell
Push-Location lib; npx vitest run test/wiki-cli-args.test.js; Pop-Location
```
Atteso: 7 test PASS.

- [ ] **Step 5: Scrivere `lib/bin/wiki.js`**

```js
#!/usr/bin/env node
// Command line entry point for the wiki tooling: the one place that reads the filesystem and asks git
// questions, then hands plain data to the checking modules. Keeping every effect here is what lets
// those modules stay pure and testable.
import { readFileSync, writeFileSync, readdirSync, existsSync, appendFileSync } from "node:fs";
import { join, posix } from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { createLogger } from "../common/logger.js";
import { parseWikiArgs } from "../wiki/cli-args.js";
import { parseFrontmatter } from "../wiki/frontmatter.js";
import { extractLinks } from "../wiki/links.js";
import { validateNode, RESERVED } from "../wiki/validate.js";
import { buildIndex, buildLogEntry } from "../wiki/index-gen.js";
import { checkBoundary } from "../wiki/boundary.js";
import { findStale } from "../wiki/stale.js";

function git(args, fallback = "") {
  try {
    return execFileSync("git", args, { encoding: "utf8" });
  } catch {
    return fallback;
  }
}

// Node paths are collected with forward slashes so they compare directly against git output, which
// uses them on every platform.
function collect(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const rel = posix.join(dir.split("\\").join("/"), entry.name);
    if (entry.isDirectory()) { out.push(...collect(full)); continue; }
    if (!entry.name.endsWith(".md") || RESERVED.includes(entry.name)) continue;
    const text = readFileSync(full, "utf8");
    let parsed;
    try {
      parsed = parseFrontmatter(text);
    } catch (err) {
      // The parser reports a line number but has no idea which file it was handed, and a bare
      // "line 4" sends the reader hunting through the whole bundle.
      err.message = `${rel}: ${err.message}`;
      throw err;
    }
    out.push({ file: rel, name: entry.name, dir: dir.split("\\").join("/"), data: parsed.data, body: parsed.body });
  }
  return out;
}

export function runWiki(argv, env) {
  const logger = createLogger(env);
  const { command, dirs, json } = parseWikiArgs(argv);
  if (!command) {
    logger.error("Usage: wiki <validate|index|boundary|stale|all> [--dir <path>]... [--json]");
    return { code: 1 };
  }

  let nodes = [];
  try {
    for (const dir of dirs) nodes.push(...collect(dir));
  } catch (err) {
    logger.error(err.message);
    return { code: 1 };
  }

  const problems = [];
  const run = (name) => command === "all" || command === name;

  if (run("validate")) {
    for (const node of nodes) problems.push(...validateNode(node, node.file));
    const known = new Set(nodes.map((n) => n.file));
    for (const node of nodes) {
      for (const target of extractLinks(node.body)) {
        const resolved = posix.normalize(posix.join(node.dir, target));
        if (!known.has(resolved) && !existsSync(resolved)) {
          problems.push(`${node.file}: broken link to ${target}`);
        }
      }
    }
  }

  if (run("boundary")) {
    const trackedFiles = new Set(git(["ls-files"]).split("\n").filter(Boolean));
    let localIgnored = true;
    try {
      execFileSync("git", ["check-ignore", "-q", "local"], { stdio: "ignore" });
    } catch {
      localIgnored = false;
    }
    problems.push(...checkBoundary({ nodes, trackedFiles, localIgnored }));
  }

  if (run("index")) {
    const byDir = new Map();
    for (const node of nodes) {
      if (!byDir.has(node.dir)) byDir.set(node.dir, []);
      byDir.get(node.dir).push({ file: node.name, data: node.data });
    }
    for (const [dir, entries] of byDir) {
      const indexPath = join(dir, "index.md");
      const next = buildIndex(entries);
      const current = existsSync(indexPath) ? readFileSync(indexPath, "utf8") : null;
      // Appending a log line on every run would bury the real history under entries that record
      // nothing happening, so the log only grows when the index actually changed.
      if (current === next) { logger.debug(`index unchanged: ${dir}`); continue; }
      writeFileSync(indexPath, next, "utf8");
      appendFileSync(join(dir, "log.md"), buildLogEntry({
        timestamp: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
        updated: ["index.md"],
      }), "utf8");
      logger.info(`index regenerated: ${dir}`);
    }
  }

  if (run("stale")) {
    const lastModified = (path) => {
      const out = git(["log", "-1", "--format=%cI", "--", path]).trim();
      if (!out) return null;
      // Git reports the committer date in whatever offset the machine is set to. Comparing that
      // against a node's UTC timestamp as plain text is meaningless: an offset sign sorts below "Z"
      // no matter which instant it denotes, so every comparison would come out the same way. The
      // value is therefore re-expressed in UTC at second precision, matching how nodes are written.
      const t = new Date(out);
      return Number.isNaN(t.getTime()) ? null : t.toISOString().replace(/\.\d+Z$/, "Z");
    };
    const stale = findStale(nodes, lastModified);
    if (json) process.stdout.write(JSON.stringify(stale, null, 2) + "\n");
    else for (const s of stale) logger.warn(`stale: ${s.file} covers ${s.path} changed ${s.coveredAt}`);
  }

  for (const p of problems) logger.error(p);
  return { code: problems.length > 0 ? 1 : 0 };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(runWiki(process.argv.slice(2), process.env).code);
}
```

- [ ] **Step 6: Verificare la CLI a mano sul repo reale**

```powershell
node lib/bin/wiki.js boundary --dir wiki
```
Atteso in questa fase: exit 0 e nessun messaggio (la directory `wiki/` non esiste ancora, quindi non
ci sono nodi). Se riporta `local/ is not covered by .gitignore`, manca lo Step 8 del Task 2.

- [ ] **Step 7: Aggiungere l'hook di pre-commit**

`.githooks/pre-commit` (LF, senza estensione):
```sh
#!/bin/sh
node lib/bin/wiki.js validate || exit 1
node lib/bin/wiki.js boundary || exit 1
node scripts/check-denylist.mjs || exit 1
node lib/bin/wiki.js stale
```

Attivazione, da documentare nel README e da eseguire una volta:
```powershell
git config core.hooksPath .githooks
```

- [ ] **Step 8: Aggiungere il job di CI**

In `.github/workflows/ci.yml`, dopo lo step `Denylist marchi`, aggiungere:
```yaml
      - name: Wiki validate
        run: node lib/bin/wiki.js validate --dir wiki
      - name: Wiki boundary
        run: node lib/bin/wiki.js boundary --dir wiki
```

In CI `local/` non esiste, quindi si passa `--dir wiki` esplicitamente per non far dipendere l'esito
da una directory assente.

**Attenzione:** non inserire mai `${{ }}` dentro una mappa YAML inline `{ }` — rompe il workflow con
un fallimento in 0 secondi.

- [ ] **Step 9: Eseguire l'intera suite e committare**

```powershell
Push-Location lib; npx vitest run; Pop-Location
node scripts/check-denylist.mjs
git add lib/bin/wiki.js lib/wiki/cli-args.js lib/test/wiki-cli-args.test.js .githooks/pre-commit .github/workflows/ci.yml README.md
git commit -m "feat(wiki): add the wiki CLI with pre-commit hook and CI checks" -m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

**NON fare in questo task:** non spostare la logica dai moduli puri dentro la CLI, non aggiungere un
parser di argomenti di terze parti.

---

# FASE 2 — Contenuti

### Task 10: Seed della wiki pubblica e `AGENTS.md`

**Files:**
- Create: `wiki/index.md` (generato), `wiki/log.md` (generato)
- Create: `wiki/crlf-shebang-entry-points.md`, `wiki/ci-inline-yaml-expressions.md`,
  `wiki/powershell-commit-messages.md`, `wiki/compatibility-wording.md`,
  `wiki/dual-licensing.md`, `wiki/lib-zero-runtime-deps.md`,
  `wiki/file-level-separation.md`, `wiki/comment-policy.md`
- Create: `AGENTS.md`

**Interfaces:**
- Consumes: il formato validato dal Task 5 e la CLI del Task 9.
- Produces: `wiki/` popolata; nessun task successivo dipende dai singoli nodi.

**Contesto necessario:** questi nodi **non inventano conoscenza**: promuovono a formato consultabile
ciò che è già scritto in `.superpowers/sdd/progress.md`, in `.superpowers/sdd/HANDOFF.md` e nella
spec. Tutti in **inglese**, tutti `scope: public`. Il `timestamp` di ogni nodo è l'istante di
creazione, in formato `YYYY-MM-DDTHH:MM:SSZ`.

- [ ] **Step 1: Scrivere i nodi `Gotcha`**

`wiki/crlf-shebang-entry-points.md`:
```markdown
---
type: Gotcha
title: CRLF endings break vitest on shebang entry points
description: An entry point with a shebang and CRLF line endings fails under esbuild while node --check still passes.
scope: public
covers: [lib/bin/, .gitattributes]
tags: [windows, tooling, tests]
timestamp: 2026-09-11T12:00:00Z
---

A file that starts with `#!/usr/bin/env node` and carries CRLF line endings is rejected by the esbuild
transform vitest runs, with an error that points at the first line and explains nothing. `node --check`
on the same file reports no problem, which sends you looking in the wrong place.

`.gitattributes` pins the repository to `eol=lf` for this reason. An editor configured to write CRLF,
or a file created by a Windows tool that ignores the attribute, reintroduces the failure.
```

`wiki/ci-inline-yaml-expressions.md`:
```markdown
---
type: Gotcha
title: Workflow expressions inside an inline YAML map break the run
description: Using an expression inside inline map braces makes the workflow fail in zero seconds with no useful message.
scope: public
covers: [.github/workflows/ci.yml]
tags: [ci, yaml]
timestamp: 2026-09-11T12:00:00Z
---

Placing a workflow expression inside inline map braces produces a parse failure: the run ends in about
zero seconds and the log shows nothing that names the offending line. Write the value on its own key
over multiple lines instead of using the inline form.
```

`wiki/powershell-commit-messages.md`:
```markdown
---
type: Gotcha
title: Multi-line commit messages break the PowerShell parser
description: Parentheses and newlines inside a commit message argument are parsed as shell syntax.
scope: public
covers: [.githooks/]
tags: [windows, git]
timestamp: 2026-09-11T12:00:00Z
---

PowerShell 5.1 parses parentheses and newlines inside an unquoted argument as shell syntax, so a
multi-line commit message fails before git ever sees it. Pass one `-m` per line, or write the message
to a file and use `git commit -F`.

The same shell has no `&&` chaining operator: use `;` or `X; if ($?) { Y }`.
```

- [ ] **Step 2: Scrivere i nodi `Invariant`**

`wiki/compatibility-wording.md`:
```markdown
---
type: Invariant
title: Only nominative compatibility wording, never a third-party trademark
description: The public surface says 5E-compatible and never names the game or its publisher.
scope: public
covers: [scripts/check-denylist.mjs, README.md, commands/, skills/]
tags: [legal, publishing]
timestamp: 2026-09-11T12:00:00Z
---

No third-party trademark appears in code, file names, command names, or documentation. The only
permitted formulation is nominative compatibility: "5E-compatible".

`scripts/check-denylist.mjs` enforces this over every tracked file, with three exceptions that are
deliberate and should stay that way: `docs/` holds internal design documents, the script itself
carries the forbidden terms as data, and lockfiles name third-party packages outside our control.

The check reads file **contents**, not file **names**. A file whose name carries a vendor name passes
the check while still exposing it through `git ls-files`.
```

`wiki/dual-licensing.md`:
```markdown
---
type: Invariant
title: Code is Apache-2.0, content is CC-BY-4.0
description: Two licences cover two different kinds of artefact in the same repository.
scope: public
covers: [LICENSE, LICENSE-CONTENT, NOTICE]
tags: [legal, publishing]
timestamp: 2026-09-11T12:00:00Z
---

Code falls under Apache-2.0 (`LICENSE`); templates, example data, and prose fall under CC-BY-4.0
(`LICENSE-CONTENT`). Anything added to `templates/` or `examples/` inherits the content licence, so it
must be original or compatibly licensed. Example data is homebrew, carrying `source: "HomebrewExample"`.
```

`wiki/lib-zero-runtime-deps.md`:
```markdown
---
type: Invariant
title: The lib package carries no runtime dependencies
description: lib/ has only vitest in devDependencies, and every deterministic feature is built on the standard library.
scope: public
covers: [lib/package.json, lib/]
tags: [architecture]
timestamp: 2026-09-11T12:00:00Z
---

`lib/` holds the deterministic logic of the plugin and installs nothing at runtime. Browser automation
lives in the separate `render/` package, and the MCP server keeps its own dependencies in
`mcp/compendium-reader/`.

The practical consequence is that anything `lib/` needs must be written against the Node standard
library: a YAML subset parser rather than a YAML package, a hand-written argument parser rather than a
CLI framework.
```

- [ ] **Step 3: Scrivere i nodi `Decision`**

Un nodo `Decision` è invalido senza le tre sezioni `## Standard`, `## Why not here`, `## What breaks`:
è la regola applicata dal Task 5.

`wiki/file-level-separation.md`:
```markdown
---
type: Decision
title: Public and private material are separated by file, never by line
description: A nested private repository replaces inline markers for keeping personal use out of the published surface.
scope: public
covers: [.gitignore, lib/wiki/boundary.js]
tags: [architecture, publishing]
timestamp: 2026-09-11T12:00:00Z
---

## Standard

The common way to keep private fragments out of a published artefact is to mark them inline and strip
them at build time, with paired markers around the regions to remove.

## Why not here

That approach stores the private content inside a file that does get published, protected only for as
long as the stripping step works. Every stripping step is a place where the content escapes, and the
escape happens into a public repository, which cannot be undone.

Here the unit of separation is the file. Private material lives in `local/`, a separate git repository
that the public one ignores, so the outer repository cannot version its contents even by accident.
Documents declare `scope: public` or `scope: local`, and `wiki boundary` fails when the declaration
disagrees with what git tracks. The tag asserts; the check makes the assertion worth something.

## What breaks

Following the inline-marker approach would put private paths, personal setting material, and the
import adapter back inside tracked files, and would replace a failing check with a transformation step
whose silent failure is indistinguishable from success.
```

`wiki/comment-policy.md`:
```markdown
---
type: Decision
title: Comments explain the code they sit in and never reference other code
description: No "called by X" or "see Y" - cross-file knowledge belongs in a wiki node instead.
scope: public
covers: [lib/, mcp/, render/]
tags: [conventions]
timestamp: 2026-09-11T12:00:00Z
---

## Standard

A widespread convention is to use comments as navigation aids, pointing at callers, collaborators, and
related modules so a reader can follow the flow from any starting point.

## Why not here

A comment that names another file stops being true the moment that file is renamed or its caller
changes, and nothing fails when it does. It also creates a phantom coupling: the reader believes the
relationship is maintained.

The rules are: a module header stating what the file does and which problem it solves, always; body
comments only on non-obvious choices, explaining why rather than what; no references to other code.

The corollary is the useful half. When the urge to write "see Y" appears, the knowledge is
cross-cutting and belongs in a wiki node, which is versioned, indexed, and checked for staleness. That
is the operating boundary between the two tools, and it is what keeps them from duplicating each other.

## What breaks

Allowing cross-references would reintroduce comments that go stale silently, and would remove the
signal that tells an author when something should have been a wiki node.
```

- [ ] **Step 4: Generare `index.md` e `log.md`, poi validare**

```powershell
node lib/bin/wiki.js index --dir wiki
node lib/bin/wiki.js validate --dir wiki
```
Atteso: `index regenerated: wiki`, poi nessun errore ed exit 0. Se `validate` segnala un
`Decision`, mancano le tre sezioni obbligatorie in quel nodo.

- [ ] **Step 5: Scrivere `AGENTS.md`**

```markdown
# Working in this repository

## Knowledge base

Before writing new code, read `wiki/index.md` and the nodes relevant to what you are about to touch.
It records traps, deliberate departures from standard practice, and invariants that the code does not
state on its own.

If a private bundle exists at `local/wiki/index.md`, read it too. It is not part of this repository and
may be absent.

After a change that produces knowledge the code does not carry by itself, add or update a node. Node
types: `Gotcha`, `Decision`, `Invariant`, `Module`, `Workflow`. A `Decision` must contain the sections
`## Standard`, `## Why not here`, `## What breaks`.

Never edit `index.md` or `log.md` by hand — regenerate them:

```
node lib/bin/wiki.js index
```

## Comments

- A module header on every file: what it does, which problem it solves.
- Body comments only on non-obvious choices, and they say **why**, not what.
- **Never reference other code** — no "called by X", "see Y", "used in Z".
- If you want to write "see Y", that is a wiki node, not a comment.
- English in this repository; the private bundle is in Italian.

## Boundary

Public material lives here. Personal use of the plugin — the import adapter, machine paths, setting
material, the author voice profile — lives in `local/`, a separate private repository ignored by this
one. The separation is by file, never by line.

```
node lib/bin/wiki.js boundary
node scripts/check-denylist.mjs
```

Both run in pre-commit and in CI, and both block.

## Environment

Shell is PowerShell 5.1: no heredocs, no `&&`, one `-m` per commit message line. Line endings are LF.
`lib/` takes no runtime dependencies.
```

- [ ] **Step 6: Verificare e committare**

```powershell
node lib/bin/wiki.js validate --dir wiki
node lib/bin/wiki.js boundary --dir wiki
node scripts/check-denylist.mjs
```
Atteso: exit 0 su tutti e tre. Il secondo può segnalare i nodi come `public` ma non tracciati finché
non sono aggiunti all'indice: eseguirlo di nuovo dopo `git add`.

```powershell
git add wiki AGENTS.md
node lib/bin/wiki.js boundary --dir wiki
git commit -m "docs(wiki): seed the public knowledge bundle and add AGENTS.md" -m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

**NON fare in questo task:** non scrivere nodi `Module` descrittivi dei moduli esistenti — la spec li
esclude dal seed; non inventare gotcha non verificati; non scrivere a mano `index.md` o `log.md`.

---

### Task 11: Seed della wiki locale

**Files:**
- Create: `local/wiki/*.md` e i due file generati
- Modify: `local/.gitignore` (nessuna modifica se già corretto)

**Interfaces:**
- Consumes: la CLI del Task 9, invocata dalla radice del repo pubblico.
- Produces: `local/wiki/` popolata; nessun task successivo vi dipende.

**Contesto necessario:** questi nodi sono in **italiano**, tutti `scope: local`, e non devono mai
comparire in `git ls-files` del repo pubblico. Contengono ciò che il Task 10 ha deliberatamente
lasciato fuori: procedura di import, path della macchina, materiale d'ambientazione personale, debiti
noti del materiale pregenerato.

Nodi da scrivere, uno per riga, con il `type` indicato:

| File | `type` | Contenuto |
|---|---|---|
| `local/wiki/import-workflow.md` | `Workflow` | La procedura completa di import: estrazione dell'archivio, `--src` su cartella già estratta, comando, verifica del risultato |
| `local/wiki/archive-extraction-windows.md` | `Gotcha` | L'estrazione via `unzip` non è affidabile su Windows; usare `Expand-Archive` e passare la cartella estratta |
| `local/wiki/multi-root-configuration.md` | `Workflow` | Configurazione multi-root: variabile separata da `;`, ordine dei root, come si verifica end-to-end |
| `local/wiki/pregen-2024-debt.md` | `Gotcha` | Il materiale pregenerato ha `conforms2024=false`; cosa manca e cosa va rivisto |
| `local/wiki/discarded-records.md` | `Gotcha` | 87 record scartati dall'import, verosimilmente per riferimenti indiretti privi di dati diretti; limite noto |

- [ ] **Step 1: Scrivere i nodi seguendo questo modello**

Stesso frontmatter del Task 10, con `scope: local` e `covers` che punta a path dentro `local/`.
Modello letterale, `local/wiki/archive-extraction-windows.md`:

```markdown
---
type: Gotcha
title: Estrazione archivi inaffidabile su Windows
description: unzip fallisce o produce alberi parziali; usare Expand-Archive e passare la cartella già estratta.
scope: local
covers: [local/import/import-compendium.mjs]
tags: [windows, import]
timestamp: 2026-09-11T12:00:00Z
---

`unzip` non è affidabile in questo ambiente: a volte non è presente, a volte estrae un albero
parziale senza segnalare errore, e l'importer prosegue su dati incompleti.

Estrarre prima con `Expand-Archive`, poi passare all'importer la cartella già estratta con `--src`.
L'importer riporta un messaggio azionabile quando l'estrazione non è disponibile, ma il percorso
consigliato resta quello manuale.
```

Gli altri quattro nodi seguono la stessa forma. Per i `Workflow`, il corpo elenca i passi nell'ordine
in cui vanno eseguiti, con i comandi letterali.

- [ ] **Step 2: Generare l'indice e validare**

```powershell
node lib/bin/wiki.js index --dir local/wiki
node lib/bin/wiki.js validate --dir local/wiki
```
Atteso: exit 0.

- [ ] **Step 3: Verificare che nulla sia finito nel repo pubblico**

```powershell
node lib/bin/wiki.js boundary
git ls-files | Select-String 'local/'
```
Atteso: exit 0 dal primo, **nessuna riga** dal secondo. Una riga qui significa che il confine ha
ceduto: fermarsi e riportare.

- [ ] **Step 4: Committare nel repo privato**

```powershell
Push-Location local; git add -A; git commit -m "docs(wiki): seed the local knowledge bundle" -m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"; Pop-Location
```

**NON fare in questo task:** non committare nulla dal repo pubblico; non copiare contenuto di questi
nodi dentro `wiki/`.

---

# FASE 3 — Guardiano

### Task 12: Sub-agente guardiano e hook `Stop`

**Files:**
- Create: `agents/wiki-guardian.md`
- Create: `scripts/guardian-trigger.mjs`
- Modify: `.claude/settings.json`
- Modify: `README.md`

**Interfaces:**
- Consumes: `node lib/bin/wiki.js stale --json` (Task 9).
- Produces: nessuna interfaccia di codice.

**Contesto necessario:** l'hook `Stop` di Claude Code scatta a fine turno. Il guardiano **propone e
non scrive**: un agente che riscrive la wiki da sé produce deriva che nessuno rilegge, e una wiki di
cui ci si fida a torto è peggio di nessuna wiki. Il costo va contenuto uscendo presto quando non c'è
niente da esaminare.

- [ ] **Step 1: Scrivere lo script di trigger**

`scripts/guardian-trigger.mjs`:
```js
// Decides whether the end-of-turn guardian is worth running at all.
// Most turns change nothing that could produce durable knowledge, and a guardian that speaks on every
// one of them becomes noise the reader learns to skip - which is how this kind of system dies.
import { execFileSync } from "node:child_process";

const changed = execFileSync("git", ["diff", "--name-only", "HEAD"], { encoding: "utf8" })
  .split("\n").filter(Boolean);

if (changed.length === 0) process.exit(0);

// Test-only and generated-file changes carry no knowledge a node would record.
const meaningful = changed.filter(
  (f) => !f.startsWith("lib/test/") && !f.endsWith("index.md") && !f.endsWith("log.md"),
);
if (meaningful.length === 0) process.exit(0);

process.stdout.write(JSON.stringify({ changed: meaningful }, null, 2) + "\n");
```

- [ ] **Step 2: Verificare il trigger a mano**

```powershell
node scripts/guardian-trigger.mjs
```
Atteso con working tree pulito: nessun output, exit 0. Dopo una modifica a un file di `lib/`: un JSON
con quel file.

- [ ] **Step 3: Scrivere la definizione del sub-agente**

`agents/wiki-guardian.md`:
```markdown
---
name: wiki-guardian
description: Reviews an end-of-turn diff and proposes wiki nodes and comment fixes. Never writes files.
tools: Read, Glob, Grep
---

You review a diff and report what durable knowledge it produced. You never write or edit files.

Inputs you will be given: the changed files, `wiki/index.md`, `local/wiki/index.md` when present, and
the output of `node lib/bin/wiki.js stale --json`.

Report only these four things, and say nothing when a section is empty:

1. **Nodes to add or update.** Only knowledge the code cannot state on its own: a trap, a deliberate
   departure from standard practice, an invariant. Give the proposed `type`, `title`, and one sentence
   of `description`. Do not propose a node that restates what the code plainly says.
2. **Comments.** Files changed without a module header, and comments that reference other code
   ("called by X", "see Y", "used in Z"), which the project forbids.
3. **Stale nodes.** For each entry in the stale list, say whether the change actually invalidates the
   node. A rename or a formatting sweep usually does not.
4. **Suspect scope.** Anything added under a public path that looks like personal use: machine paths,
   third-party vendor names, setting material.

Be brief. An empty report is the correct answer most of the time, and saying so in one line is better
than filling space.
```

- [ ] **Step 4: Registrare l'hook `Stop`**

In `.claude/settings.json`, aggiungere:
```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "node scripts/guardian-trigger.mjs" }
        ]
      }
    ]
  }
}
```

Se il file contiene già una chiave `hooks`, fondere invece di sostituire.

- [ ] **Step 5: Documentare nel README e committare**

Aggiungere al README una sezione che spiega: cosa fa il guardiano, che propone e non scrive, e come
disattivarlo togliendo l'hook.

```powershell
node scripts/check-denylist.mjs
git add agents/wiki-guardian.md scripts/guardian-trigger.mjs .claude/settings.json README.md
git commit -m "feat(wiki): add the end-of-turn knowledge guardian" -m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

**NON fare in questo task:** non dare al guardiano strumenti di scrittura; non farlo scattare a ogni
modifica di file; non farlo bloccare il turno.

---

# FASE 4 — Commenti

### Task 13: Portare in inglese i commenti di `lib/common/`

**Files:**
- Modify: `lib/common/config.js`, `errors.js`, `fs-atomic.js`, `localize.js`, `logger.js`,
  `output.js`, `slug.js`

**Interfaces:**
- Consumes: la policy scritta in `AGENTS.md` dal Task 10.
- Produces: niente. Nessun altro task dipende da questo.

**Contesto necessario:** questo è il **pilota** della traduzione, non una passata su tutto il repo. I
commenti esistenti sono già conformi nel merito — spiegano il perché e non referenziano altro codice —
quindi vanno **tradotti, non riscritti**. Se durante la traduzione emerge un commento che viola la
regola 3 (referenzia altro codice), va tolto e segnalato nel resoconto finale come candidato nodo
wiki.

I moduli restanti (`lib/adventure/`, `lib/battlemap/`, e gli altri) si traducono quando li si tocca
per altri motivi: una passata a tappeto produrrebbe un diff enorme e nessun beneficio verificabile.

- [ ] **Step 1: Inventariare i commenti da tradurre**

```powershell
Select-String -Path lib\common\*.js -Pattern '^\s*//' | ForEach-Object { "$($_.Filename):$($_.LineNumber): $($_.Line.Trim())" }
```

- [ ] **Step 2: Tradurre file per file**

Per ogni file: aggiungere l'header di modulo se manca (cosa fa, quale problema risolve), tradurre i
commenti esistenti, **non** aggiungere commenti nuovi su codice ovvio.

Esempio, `lib/common/slug.js`, dove i commenti attuali sono in coda alle righe e vanno resi in
inglese senza alterarne il contenuto:
```js
// Turns a display name into a stable, filesystem-safe identifier.
// Diacritics are decomposed and dropped rather than transliterated, so that names differing only by
// accent collapse to the same slug instead of producing two records that look like duplicates.
export function slugify(name) {
  return String(name)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")  // drop the combining marks left by decomposition
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")      // everything else becomes the separator
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
```

- [ ] **Step 3: Verificare che nulla sia cambiato nel comportamento**

```powershell
Push-Location lib; npx vitest run; Pop-Location
```
Atteso: stesso numero di test verdi di prima del task. Un test che cambia esito significa che è stato
modificato del codice, non un commento: annullare e rifare.

- [ ] **Step 4: Verificare la conformità alla regola 3**

```powershell
Select-String -Path lib\common\*.js -Pattern 'called by|see [a-z-]+\.js|used in|cfr\.' | ForEach-Object { "$($_.Filename):$($_.LineNumber)" }
```
Atteso: nessuna riga.

- [ ] **Step 5: Committare**

```powershell
node scripts/check-denylist.mjs
git add lib/common
git commit -m "docs: translate lib/common comments to English per the comment policy" -m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

**NON fare in questo task:** non modificare codice eseguibile; non estendere la traduzione oltre
`lib/common/`; non aggiungere commenti descrittivi su funzioni ovvie.

---

## Verifica finale

```powershell
Push-Location lib; npx vitest run; Pop-Location
Push-Location mcp\compendium-reader; npx vitest run; Pop-Location
Push-Location local; npx vitest run; Pop-Location
node scripts/check-denylist.mjs
node lib/bin/wiki.js all
git ls-files | Select-String 'local/'
```

Atteso: `lib` pari al numero annotato allo Step 10 del Task 2 più **57 nuovi** test (10 frontmatter,
6 links, 14 validate, 9 index-gen, 5 boundary, 6 stale, 7 cli-args), `local` 12, denylist pulita,
`wiki all` exit 0, e **nessuna riga** dall'ultimo comando.

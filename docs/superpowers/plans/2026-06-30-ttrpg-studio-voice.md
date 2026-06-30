# TTRPG Studio — Voice / Prose-Style Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dare al plugin un "modo di scrivere": una guida di stile **neutra e pubblicabile** per la prosa creativa, un meccanismo per una **voce personale locale** (mai committata), e una **struttura perché ogni utente generi la propria voce** (template + comando guidato + esempio).

**Architecture:** La guida di mestiere vive in una skill `prose-style` (markdown, neutra: ritmo, specificità sensoriale, niente frasi-spia AI, niente chiusura-riassunto). La **voce personale** dell'utente è un file Markdown opzionale risolto da `lib/voice/resolve.js` (priorità `VOICE_PATH` → `SETTING_PATH/voice-profile.md`); un CLI `lib/bin/voice.js` lo stampa così le skill creative lo iniettano **se presente**. Un `commands/voice-profile.md` guida l'utente a crearne uno dai propri testi, partendo da un **template** e da un **esempio fittizio**. Le skill creative esistenti (adventure-writer, worldbuilding) e i comandi di flavor puntano a `prose-style` + voce personale. Nessun dato personale, nessun framing "anti-detector" nel repo pubblico.

**Tech Stack:** Node.js ≥20 (ESM), `vitest`. Riusa `lib/common/{logger}.js`. Nessuna nuova dipendenza. Apache-2.0 (codice) + CC-BY-4.0 (guide/template).

## Global Constraints

- **Zero dati personali** nel repo: la guida è neutra; nessun nome, biografia, azienda. La voce personale resta **locale e gitignored**.
- **Niente framing anti-rilevamento AI:** la cornice è "prosa viva, concreta, non generica", non "eludere i detector".
- **Zero contenuti coperti da copyright; zero segreti; zero marchi di terze parti.** "5E-compatible", mai "D&D".
- **Cross-platform:** solo `node:path`; entry point con shebang usano `pathToFileURL`.
- **Line-ending LF**; log su **stderr** (lo stdout del CLI voce è riservato al contenuto della voce, per il consumo da parte delle skill).
- Node ESM: `"type": "module"`.

---

### Task 1: `lib/voice/resolve.js` — risoluzione della voce personale

**Files:**
- Create: `lib/voice/resolve.js`
- Test: `lib/test/voice-resolve.test.js`

**Interfaces:**
- Consumes: niente.
- Produces:
  - `resolveVoice(env) → { path, source } | null` — priorità: `VOICE_PATH` (se esiste) → `SETTING_PATH/voice-profile.md` (se esiste) → `null`.
  - `loadVoice(env) → string | null` — contenuto del file risolto, o `null`.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/voice-resolve.test.js`:
```js
import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveVoice, loadVoice } from "../voice/resolve.js";

describe("resolveVoice", () => {
  it("VOICE_PATH ha priorità", () => {
    const dir = mkdtempSync(join(tmpdir(), "v-"));
    const p = join(dir, "myvoice.md");
    writeFileSync(p, "# voce");
    expect(resolveVoice({ VOICE_PATH: p }).source).toBe("VOICE_PATH");
  });
  it("fallback a SETTING_PATH/voice-profile.md", () => {
    const dir = mkdtempSync(join(tmpdir(), "set-"));
    writeFileSync(join(dir, "voice-profile.md"), "# voce");
    const r = resolveVoice({ SETTING_PATH: dir });
    expect(r.source).toBe("SETTING_PATH");
    expect(r.path).toBe(join(dir, "voice-profile.md"));
  });
  it("null se nessuna voce", () => {
    const dir = mkdtempSync(join(tmpdir(), "set-"));
    expect(resolveVoice({ SETTING_PATH: dir })).toBe(null);
    expect(resolveVoice({})).toBe(null);
  });
});

describe("loadVoice", () => {
  it("ritorna il contenuto se presente", () => {
    const dir = mkdtempSync(join(tmpdir(), "v-"));
    const p = join(dir, "myvoice.md");
    writeFileSync(p, "# La mia voce\nFrasi brevi.");
    expect(loadVoice({ VOICE_PATH: p })).toContain("La mia voce");
  });
  it("null se assente", () => {
    expect(loadVoice({})).toBe(null);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/voice-resolve.test.js`
Expected: FAIL.

- [ ] **Step 3: Implementare `lib/voice/resolve.js`**

```js
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function resolveVoice(env = {}) {
  if (env.VOICE_PATH && existsSync(env.VOICE_PATH)) {
    return { path: env.VOICE_PATH, source: "VOICE_PATH" };
  }
  if (env.SETTING_PATH) {
    const p = join(env.SETTING_PATH, "voice-profile.md");
    if (existsSync(p)) return { path: p, source: "SETTING_PATH" };
  }
  return null;
}

export function loadVoice(env = {}) {
  const r = resolveVoice(env);
  if (!r) return null;
  return readFileSync(r.path, "utf8");
}
```

- [ ] **Step 4: Eseguire i test e verificare il successo**

Run: `cd lib && npx vitest run test/voice-resolve.test.js`
Expected: PASS (5 test).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "feat(voice): resolveVoice/loadVoice (voce personale opzionale)"
```

---

### Task 2: `lib/bin/voice.js` + lib/index — CLI che espone la voce

**Files:**
- Create: `lib/bin/voice.js`
- Modify: `lib/index.js` (riesporta resolveVoice/loadVoice)
- Test: `lib/test/voice-cli.test.js`

**Interfaces:**
- Consumes: `loadVoice` da `lib/voice/resolve.js`; `createLogger` da `lib/common/logger.js`.
- Produces: `runVoice(env) → { code, voice }` — `voice` = contenuto (o `null`). Il main stampa la voce su **stdout** (per il consumo delle skill); se assente, messaggio guida su **stderr** e stdout vuoto. Sempre `code 0`.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/voice-cli.test.js`:
```js
import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runVoice } from "../bin/voice.js";

describe("runVoice", () => {
  it("ritorna il contenuto della voce se presente", () => {
    const dir = mkdtempSync(join(tmpdir(), "v-"));
    const p = join(dir, "voice.md");
    writeFileSync(p, "# Voce\nRitmo spezzato.");
    const r = runVoice({ VOICE_PATH: p });
    expect(r.code).toBe(0);
    expect(r.voice).toContain("Ritmo spezzato.");
  });
  it("voice null senza profilo", () => {
    const r = runVoice({});
    expect(r.code).toBe(0);
    expect(r.voice).toBe(null);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/voice-cli.test.js`
Expected: FAIL.

- [ ] **Step 3: Implementare `lib/bin/voice.js`**

```js
#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { loadVoice } from "../voice/resolve.js";
import { createLogger } from "../common/logger.js";

export function runVoice(env = {}) {
  const voice = loadVoice(env);
  return { code: 0, voice };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const logger = createLogger(process.env);
  const { voice } = runVoice(process.env);
  if (voice) {
    process.stdout.write(voice);
  } else {
    logger.info("Nessun profilo voce personale. Imposta VOICE_PATH o crea SETTING_PATH/voice-profile.md (vedi /voice-profile).");
  }
}
```

- [ ] **Step 4: Eseguire i test e verificare il successo**

Run: `cd lib && npx vitest run test/voice-cli.test.js`
Expected: PASS (2 test).

- [ ] **Step 5: Riesportare in `lib/index.js`**

Aggiungere in fondo a `lib/index.js`:
```js
// Voice
export { resolveVoice, loadVoice } from "./voice/resolve.js";
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -s -m "feat(voice): CLI voice.js + riesporto lib/index"
```

---

### Task 3: skill `prose-style` (guida di mestiere neutra)

**Files:**
- Create: `skills/prose-style/SKILL.md`
- Create: `skills/prose-style/references/prose-craft.md`

**Interfaces:**
- Consumes: (a runtime) la voce personale via `node lib/bin/voice.js`.
- Produces: skill richiamabile per scrivere/rivedere prosa creativa viva e concreta.

- [ ] **Step 1: Creare `skills/prose-style/SKILL.md`**

```markdown
---
name: prose-style
description: Scrive o rivede la prosa creativa del materiale di gioco (descrizioni di luoghi, voci dei PNG, flavor di oggetti, handout) perché suoni viva, concreta e non generica. Usa quando un testo sembra piatto o "scritto dall'AI", o quando si vuole applicare una voce personale. Trigger: troppo generico, rendilo vivo, voce, riscrivi la descrizione, flavor.
---

# Prose Style

Fa suonare la prosa creativa **concreta e umana**, non da manuale generico. Si applica
a descrizioni di luoghi, voci dei PNG, flavor degli oggetti, ganci, handout.

## Procedura
1. Leggi `references/prose-craft.md` (principi di mestiere, neutri).
2. **Voce personale (opzionale):** esegui `node ${CLAUDE_PLUGIN_ROOT}/lib/bin/voice.js`.
   Se stampa un profilo, applicalo come registro dominante; se non stampa nulla, usa
   solo i principi neutri.
3. Scrivi o rivedi il testo. In modalità revisione, mostra il prima/dopo e una riga
   sul perché.

## Regola
La voce serve la scena, non viceversa. La specificità sensoriale viene prima di
qualsiasi tono: un dettaglio concreto batte tre aggettivi.
```

- [ ] **Step 2: Creare `skills/prose-style/references/prose-craft.md`**

```markdown
# Prose Craft — principi neutri

Principi di mestiere per una prosa di gioco viva e concreta. Niente identità
personale, niente "eludere i rilevatori": l'obiettivo è scrivere bene, non passare
un test. Una prosa appiattita è il problema; questi principi la disappiattiscono.

## 1. Ritmo (la leva più forte)
- Alterna lunghezze: in ogni paragrafo almeno una frase breve (sotto le 8 parole) e
  una lunga (sopra le 25). Mai quattro frasi della stessa lunghezza di fila.
- Una frase secca e isolata ogni tanto. "La porta non si apre." "Qualcosa respira."
- Leggi a voce: se ha cadenza da metronomo, riscrivi.

## 2. Concretezza contro vaghezza
- Un dettaglio sensoriale specifico batte tre aggettivi valutativi. "Odore di rame
  bagnato" invece di "atmosfera inquietante".
- Bandisci gli aggettivi vuoti senza il perché: "antico", "misterioso", "imponente".
- Verbi precisi al posto di verbi-spugna (essere, esserci, trovarsi).

## 3. Niente frasi-spia (cliché piatti)
Se compaiono, riscrivi:
- "un'atmosfera carica di tensione"
- "un luogo che non lascia indifferenti"
- "una presenza che incute timore"
- aperture-segnale ("In questa stanza i personaggi troveranno...")

## 4. Niente chiusura-riassunto
La frase finale di una descrizione o di un gancio non riassume: apre una tensione o
tira una conseguenza concreta. Lascia qualcosa che spinge ad agire.

## 5. Varietà di struttura
- Evita i parallelismi tripli a raffica ("A, B e C") e le antitesi simmetriche
  ripetute ("non è X: è Y"). Vanno bene una volta; non come tic.
- Apri i paragrafi in modi diversi, mai con lo stesso schema.

## 6. Per il tavolo
- Le descrizioni di luogo: poche righe, 3 agganci sensoriali, una cosa interagibile.
- Le voci dei PNG: un tic verbale + cosa vogliono, non un monologo.
- Il flavor degli oggetti: una riga che evoca, non una scheda tecnica.
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -s -m "feat(prose-style): skill + guida di mestiere neutra"
```

---

### Task 4: Template ed esempio di profilo voce

**Files:**
- Create: `templates/voice/voice-profile.template.md`
- Create: `templates/voice/voice-profile.example.md`

**Interfaces:**
- Consumes: niente.
- Produces: la struttura che un utente compila per la propria voce + un esempio **fittizio** che mostra il risultato.

- [ ] **Step 1: Creare `templates/voice/voice-profile.template.md`**

```markdown
# Profilo Voce — {{NOME}}

> La tua voce di scrittura per il materiale di gioco. File **locale**, non condividerlo
> se contiene dati personali. Le skill creative lo applicano se presente
> (`VOICE_PATH` o `SETTING_PATH/voice-profile.md`).

## Registro
_(In una frase: com'è la tua voce? Es. "asciutta e ironica", "lirica e lenta".)_

## Ritmo
_(Frasi corte o lunghe? Alternanza? Una cadenza che ti è tipica.)_

## Lessico
- Parole/registri che usi spesso:
- Parole che eviti:

## Tic e firma
_(Una mossa ricorrente: aprire con un'immagine, chiudere con una domanda, ecc.)_

## Cosa NON fai
_(Cliché o tic che vuoi evitare attivamente.)_

## Esempi (2-3 brani tuoi)
> _(Incolla 2-3 frammenti che suonano "tuoi". Sono l'ancora più forte.)_
```

- [ ] **Step 2: Creare `templates/voice/voice-profile.example.md`** (persona fittizia)

```markdown
# Profilo Voce — Esempio (master "Brina")

> Esempio fittizio: mostra come appare un profilo compilato. Non è una persona reale.

## Registro
Asciutto, concreto, con lampi di umorismo nero. Più cronaca che poesia.

## Ritmo
Frasi corte che picchiano, poi un periodo lungo che accumula dettagli. Una battuta
secca per chiudere quando la scena rischia di diventare seria.

## Lessico
- Spesso: termini di mestiere e di materiali (ferro, sego, salnitro, ruggine).
- Evita: "epico", "leggendario", "oscuro", aggettivi che gonfiano senza dire.

## Tic e firma
Apre con un suono o un odore prima che con la vista. Mette sempre una cosa che i
giocatori possono toccare o rompere.

## Cosa NON fai
Niente "atmosfera sospesa". Niente frase finale che riassume la stanza.

## Esempi
> "Senti prima il gocciolio, poi lo vedi: il soffitto suda. Sul tavolo, tre ciotole
> di latte cagliato e una quarta rovesciata. Qualcuno è uscito di fretta."
> "Il fabbro non alza gli occhi. 'Pagate o uscite. Il martello non distingue.'"
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -s -m "feat(voice): template + esempio fittizio di profilo voce"
```

---

### Task 5: Comando `/voice-profile` (creazione guidata)

**Files:**
- Create: `commands/voice-profile.md`

**Interfaces:**
- Consumes: il template `templates/voice/voice-profile.template.md`; `lib/common/fs-atomic.js` (scrittura) — invocato dall'LLM.
- Produces: comando che guida l'utente a creare la propria voce dai propri testi.

- [ ] **Step 1: Creare `commands/voice-profile.md`**

```markdown
---
description: Crea o aggiorna il tuo profilo voce personale (locale, non committato)
argument-hint: [percorso opzionale]
---

Guida l'utente a creare il **profilo voce personale** per il materiale di gioco.

## Passi
1. Chiedi all'utente **2-3 brani** che ha scritto e che "suonano suoi" (post,
   descrizioni, qualsiasi cosa). Sono l'ancora più importante.
2. Estrai dai brani, **descrivendo** (mai copiando lo stile altrui):
   - **Ritmo**: frasi corte/lunghe, alternanza, cadenze ricorrenti.
   - **Lessico**: parole e registri ricorrenti; parole evitate.
   - **Tic/firma**: mosse ripetute (come apre, come chiude).
   - **Cosa non fa**: cliché da evitare.
3. Compila il `templates/voice/voice-profile.template.md` (vedi anche
   `voice-profile.example.md` per il formato atteso).
4. Salva in **`SETTING_PATH/voice-profile.md`** (oppure in `VOICE_PATH`). Il file è
   **locale e gitignored**: non finisce nel repo.

## Note
- Cornice corretta: scrivere **vivo e concreto**, non "eludere rilevatori AI".
- Niente dati sensibili nel file se pensi di condividerlo.
- D'ora in poi la skill `prose-style` userà questa voce quando presente.
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -s -m "feat(voice): comando /voice-profile (creazione guidata)"
```

---

### Task 6: Agganciare le skill creative a `prose-style` + voce

**Files:**
- Modify: `skills/adventure-writer/SKILL.md`
- Modify: `skills/worldbuilding/SKILL.md`

**Interfaces:**
- Consumes: skill `prose-style`.
- Produces: le skill creative rimandano alla guida di stile e alla voce personale opzionale.

- [ ] **Step 1: Aggiungere una sezione a `skills/adventure-writer/SKILL.md`**

In fondo al file, aggiungere:
```markdown
## Voce e stile
Per la prosa (strong start, descrizioni dei luoghi, voci dei PNG, flavor del loot)
usa la skill **prose-style**: concretezza sensoriale, ritmo spezzato, niente
frasi-spia, niente chiusura-riassunto. Se l'utente ha un profilo voce personale
(`node ${CLAUDE_PLUGIN_ROOT}/lib/bin/voice.js` stampa qualcosa), applicalo.
```

- [ ] **Step 2: Aggiungere una sezione a `skills/worldbuilding/SKILL.md`**

In fondo al file, aggiungere:
```markdown
## Voce e stile
Le schede generate (regioni, fazioni, divinità, PNG, mostri) passano per la skill
**prose-style**: dettaglio concreto prima dell'aggettivo, ritmo vario, niente
cliché. Applica il profilo voce personale dell'utente se presente
(`node ${CLAUDE_PLUGIN_ROOT}/lib/bin/voice.js`).
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -s -m "feat(voice): aggancia adventure-writer e worldbuilding a prose-style"
```

---

### Task 7: Integrazione — gitignore, README, denylist, suite

**Files:**
- Modify: `.gitignore`
- Modify: `README.md`
- Test: (riuso) suite esistente

**Interfaces:**
- Consumes: tutto il precedente.
- Produces: voce personale ignorata; documentazione; verifica verde.

- [ ] **Step 1: Ignorare la voce personale in `.gitignore`**

Aggiungere sotto il blocco "Dati di gioco...":
```
# Voce personale (mai committare)
voice-profile.md
/voice/
```
(La voce sotto `SETTING_PATH` è già coperta da `/setting/`; questa riga copre anche
una `voice-profile.md` in root o una cartella `/voice/`.)

- [ ] **Step 2: Verificare l'ignore**

Run: `git check-ignore voice-profile.md setting/voice-profile.md`
Expected: entrambi stampati (ignorati).

- [ ] **Step 3: Aggiungere la sezione Voce al `README.md`**

In `README.md`, dopo la sezione Visuals, aggiungere:
```markdown
## Voce e stile

Il plugin scrive la prosa creativa in modo **concreto e vivo**, non generico
(skill `prose-style`). Puoi dargli la **tua voce**:

- `/voice-profile` — crea il tuo profilo voce dai tuoi testi (template guidato).
- Il file vive in `SETTING_PATH/voice-profile.md` o in `VOICE_PATH`, è **locale e
  gitignored** (non finisce nel repo). Le skill creative lo applicano se presente.

La guida di stile del plugin è **neutra**: l'obiettivo è una prosa umana e concreta,
non "eludere i rilevatori AI".
```

- [ ] **Step 4: Verificare denylist e suite completa**

Run: `node scripts/check-denylist.mjs`
Expected: `denylist: pulito`.

Run: `cd lib && npx vitest run`
Expected: PASS (suite esistente + voice-resolve + voice-cli).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "feat(voice): gitignore voce personale + README + verifica"
```

---

## Self-Review

**1. Copertura della decisione utente:**
- Guida di stile **neutra pubblicabile** → Task 3 (skill prose-style + prose-craft) ✓
- **Voce personale locale** usata se presente → Task 1 (resolveVoice) + 2 (CLI) + gitignore Task 7 ✓
- **Struttura perché ogni utente generi la propria voce** (template + come-fare + esempi) → Task 4 (template + esempio fittizio) + 5 (comando guidato) ✓
- Niente dati personali / niente framing anti-detector nel repo → vincoli rispettati in Task 3/4/5 (la cornice è "prosa viva", l'esempio è fittizio) ✓
- Aggancio alle skill creative → Task 6 ✓

**2. Placeholder scan:** ogni step ha codice o contenuto concreto. Le parti markdown (skill/guida/template/comando) sono per natura testuali; la logica testabile (`resolveVoice`/`loadVoice`/`runVoice`) è TDD. ✓

**3. Type consistency:**
- `resolveVoice(env)→{path,source}|null` / `loadVoice(env)→string|null` coerenti tra Task 1, 2 (runVoice usa loadVoice) e i riesporti. ✓
- `runVoice(env)→{code,voice}` coerente tra Task 2 e il test. ✓
- Il CLI `lib/bin/voice.js` è il punto d'aggancio citato dalle skill (Task 6) e dal comando (Task 5). ✓

> Note: (a) la generazione del profilo voce è LLM-driven (comando guidato), non codice deterministico — la parte deterministica è solo la **risoluzione/lettura** del file, testata. (b) La voce personale non viene mai committata: è coperta da `/setting/` e dalle righe aggiunte in Task 7. (c) L'esempio di profilo è una **persona fittizia** ("Brina"), nessun dato reale.

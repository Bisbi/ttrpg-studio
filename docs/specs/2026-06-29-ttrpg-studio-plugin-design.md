# TTRPG Studio — Plugin Design Spec

> **Status:** Approved design — ready for implementation planning
> **Date:** 2026-06-29
> **Author:** Giovanni Bibbo
> **Target:** Claude Code plugin, open-source su GitHub

---

## 1. Purpose & Scope

**TTRPG Studio** è un plugin Claude Code che porta in *qualsiasi* progetto un kit completo per
creare e produrre materiale TTRPG (D&D 5e–compatibile): worldbuilding + pipeline di produzione
(avventure, carte oggetto, schermo del master, mappe, arte).

Nasce estraendo e **generalizzando** gli strumenti già sviluppati nei progetti personali
*Under a Green Sun* (`Drago verde`) e *MAD Character Builder* (`carte/v2`), così da renderli
riusabili su ogni nuova ambientazione e **pubblicabili liberamente**.

### Goal
Kit completo = **worldbuilding** (creare un'ambientazione da zero) **+ produzione** (trasformarla
in materiale giocabile), con un backend dati di gioco portabile e bilingue.

### Non-goals (YAGNI)
- Nessun tool "contributor" verso API esterne (PR/diff/validate).
- Nessun legame fisso a una specifica campagna o ambientazione.
- Nessuna gestione di virtual tabletop (VTT) runtime.

---

## 2. Vincolo fondamentale: pubblicabilità open-source

Il plugin è destinato a GitHub pubblico. Di conseguenza:

1. **Zero contenuti coperti da copyright** nel repo. Nessun dato di gioco (stat dei mostri, testo
   incantesimi, testo manuali) viene incluso o scaricato dal plugin.
2. **Zero riferimenti a marchi/strumenti di terze parti** nel codice, nei nomi dei tool e nella
   documentazione (README, ecc.). Terminologia sempre neutra.
3. **Zero segreti**: nessuna API key, token o credenziale committata. Tutte le chiavi sono lette
   da variabili d'ambiente fornite dall'utente.
4. Il plugin definisce un **formato dati neutro e documentato** (i formati/strutture dati non sono
   soggetti a copyright) e legge una cartella che l'utente fornisce. L'utente, in privato, ci punta
   i propri dati. Il repo pubblico resta vuoto di contenuti e di riferimenti.

> Nota: impostazione di "buon senso prudente", non consulenza legale.

---

## 3. Architettura del plugin

Plugin Claude Code installato a livello utente (disponibile in ogni progetto). Cartella dedicata,
repo git autonomo:

```
ttrpg-studio/
├── .claude-plugin/
│   └── plugin.json              # manifest del plugin
├── mcp/
│   └── compendium-reader/       # MCP dati di gioco (Node, formato neutro)
│       ├── index.js
│       ├── package.json
│       └── SCHEMA.md            # schema documentato della cartella dati
├── skills/
│   ├── worldbuilding/           # Setting Bible + generatori (ibrido)
│   ├── adventure-writer/        # avventure (Lazy DM + style-guide, legge la Bible)
│   ├── item-card/               # carte oggetto HTML 2x + render-to-png
│   ├── dm-screen/               # schermo del master HTML interattivo + export
│   ├── battle-map/              # mappe a livelli (procedurale / arte / import)
│   └── image-gen/               # arte via browser (oggetti/mostri/PG/PNG)
├── commands/                    # slash command (vedi §10)
├── agents/
│   └── lore-keeper.md           # guardiano della coerenza canon
├── lib/
│   ├── render-to-png/           # utility Playwright (HTML → PNG 2x)
│   └── add-grid/                # griglia su immagine mappa (port di add_grid.py)
├── templates/
│   ├── item-card/               # template HTML carta oggetto
│   ├── dm-screen/               # template HTML schermo del master
│   └── setting-bible/           # scheletro Markdown dell'ambientazione
├── README.md                    # bilingue IT/EN, terminologia neutra
├── LICENSE                      # MIT
├── CONTRIBUTING.md
├── CHANGELOG.md
└── .gitignore                   # esclude dati, segreti, node_modules, output
```

---

## 4. Componente: `compendium-reader` (MCP)

**Scopo:** esporre i dati di gioco (mostri, incantesimi, oggetti, ecc.) all'agente in modo
portabile, offline e bilingue, senza contenere alcun dato.

**Configurazione (env):**
- `GAME_DATA_PATH` — path a una cartella "compendio" fornita dall'utente.
- `GAME_DATA_LANG` — `it` | `en` (default: prova `it`, fallback `en`). Bilingue: supporta due
  sottocartelle/lingua o un suffisso lingua nei file.

**Formato dati (documentato in `SCHEMA.md`):** cartella di file JSON con uno schema neutro, es.
`monsters.json`, `spells.json`, `items.json`, `backgrounds.json`, … Ogni record ha campi comuni
documentati (`name`, `source`, `cr`, `hp`, `ac`, `entries`, …). Lo schema è descritto in modo
indipendente da qualsiasi prodotto esterno.

**Tool esposti:**
- `search(query, type?, lang?)` — ricerca full-text/filtrata.
- `get(type, name|id, lang?)` — recupera un singolo record completo.
- `list(type, filters?, lang?)` — elenca/filtra (es. mostri per CR/tipo).
- `read_file(file, root_key?, fields?)` — accesso grezzo a un file dati con proiezione campi.

**Adapter (opzionale, in `lib/`, NON pubblicato con dati):** script locale che converte una cartella
dati arbitraria dell'utente nello schema del plugin. Documentato ma neutro.

**Riuso:** modellato sul tool `read_5etools` del MCP `mad-builder` esistente, riscritto in forma
neutra e portabile.

---

## 5. Componente: `worldbuilding` (skill, ibrido)

**Modello ibrido = Setting Bible (spina dorsale) + generatori on-demand (che scrivono nella Bible).**

### Setting Bible
`/new-setting <nome>` crea lo scheletro Markdown dell'ambientazione (in `templates/setting-bible/`):

```
setting/
├── 00-overview.md
├── 10-cosmology.md
├── 20-geography/          # regioni
├── 30-factions/
├── 40-pantheon/
├── 50-peoples.md
├── 60-timeline.md
├── 70-bestiary-custom/    # mostri custom (possono derivare da record del compendio)
├── 90-glossary.md
└── _index.md              # indice + cross-link
```

La Setting Bible è la **fonte di verità**: tutti gli strumenti di produzione vi attingono per restare
coerenti (canon).

### Generatori on-demand
Comandi che generano un elemento **e lo salvano nel file giusto**, cross-linkato:
`/gen-region`, `/gen-faction`, `/gen-deity`, `/gen-npc`, `/gen-monster`. Un mostro custom può partire
da un record reale del compendio (via `compendium-reader`) e poi essere riflavorato.

---

## 6. Componente: `adventure-writer` (skill)

Port generalizzato della skill `dnd-adventure-writer`. Mantiene gli elementi **portabili**:
- **Style-guide** (gli 8 principi di scrittura).
- **Workflow "Lazy DM"**: Strong Start, scene tipizzate (esplorazione/sociale/conflitto), 5–10
  segreti&indizi, dilemmi morali, conseguenze a cascata.
- **Template d'avventura** strutturato (formato Homebrewery Markdown).
- Mostri recuperati via `compendium-reader`.

**Generalizzazione chiave:** il vecchio `campaign-context.md` (hardcoded su *Under a Green Sun*) è
sostituito da un **puntatore alla Setting Bible attiva**. La skill funziona per qualsiasi mondo.

Lingua: configurabile (default segue `GAME_DATA_LANG`); termini di gioco restano in inglese.

---

## 7. Componente: `item-card` (skill) + `render-to-png` (utility)

Port del workflow carte oggetto esistente.
1. Genera/ottiene l'immagine (via `image-gen`, §9).
2. Compila il template `templates/item-card/` (HTML, costruito a **800×1200 = 2x** per nitidezza).
3. **`render-to-png`** (in `lib/`): avvia un server HTTP locale, naviga la pagina con Playwright,
   screenshot di `.card` → PNG.

`render-to-png` è un'utility condivisa (usata anche da `dm-screen`). Generalizzata: accetta path
HTML, selettore CSS e dimensioni target.

---

## 8. Componente: `dm-screen` (skill)

Genera uno **schermo del master HTML interattivo** (port di `dm-screen-v12.html` /
`dm-screen-mockup.html`): pannelli, tabelle incontri, statblock collassabili, riferimenti rapidi.
Legge la Setting Bible + il compendio per popolare i contenuti. Export opzionale in PNG/PDF via
`render-to-png`.

---

## 9. Componente: `image-gen` (skill)

Generazione di arte tramite **automazione browser** di un generatore web AI gratuito e non
geo-bloccato (funziona dall'Italia), via Playwright / claude-in-chrome: apre il generatore,
inserisce il prompt, attende il render, scarica il PNG, lo posiziona nel materiale.

**Ambito ristretto:** 🗡️ oggetti · 👹 mostri · 🛡️ PG · 🧑 PNG (ritratti/arte). **NON mappe.**

Integrazione: fornisce l'arte 2:3 a `item-card` e i ritratti ai generatori di `worldbuilding`.
Provider configurabile via env (URL del generatore), così il repo resta neutro.

Provider alternativo (opzionale, con API key utente via env): pipeline raster esterna — non
attivo di default, nessuna chiave nel repo.

---

## 10. Componente: `battle-map` (skill, a livelli)

Le mappe restano indipendenti da `image-gen`. Approccio a livelli:

| Tier | Metodo | Quando |
|------|--------|--------|
| **1 — default, agent-native** | Generatore procedurale via browser → export SVG/PNG/JSON → `add-grid` | dungeon/strutture, veloce, deterministico, line-art B/N |
| **2 — arte dipinta** | Pipeline raster esterna (API key utente) + ritocchi immagine | scene atmosferiche "quadro" |
| **import** | JSON procedurale → editor di mappe per rifinitura manuale | quando serve editing |

**`add-grid`** (in `lib/`): port di `add_grid.py` — sovrappone griglia e titolo su un'immagine
mappa. Stile default: top-down, B/N, line-art pulito, stampabile (griglia aggiunta in
post, non generata).

I nomi di provider/generatori specifici sono configurabili via env/config, non hardcoded nel repo.

---

## 11. Componente: `lore-keeper` (agent)

Agente di **coerenza canon**: prima di finalizzare un'avventura, una carta o uno schermo, confronta
nomi, fazioni, divinità, luoghi e timeline contro la Setting Bible attiva e segnala incongruenze.
Read-only sulla Bible; produce un report di discrepanze.

---

## 12. Slash commands (inventario)

| Comando | Skill | Azione |
|---------|-------|--------|
| `/new-setting <nome>` | worldbuilding | scaffold Setting Bible |
| `/gen-region` `/gen-faction` `/gen-deity` `/gen-npc` `/gen-monster` | worldbuilding | genera elemento e salva nella Bible |
| `/new-adventure` | adventure-writer | avvia il workflow Lazy DM |
| `/item-card` | item-card | crea una carta oggetto |
| `/dm-screen` | dm-screen | genera lo schermo del master |
| `/battle-map` | battle-map | genera una mappa (tier selezionabile) |
| `/gen-art` | image-gen | genera arte per oggetto/mostro/PG/PNG |
| `/lore-check` | lore-keeper | verifica coerenza canon |

---

## 13. Configurazione per progetto

Ogni progetto che usa il plugin definisce (env o file di config locale, **non** committato nel
plugin):
- `GAME_DATA_PATH`, `GAME_DATA_LANG` — backend compendio.
- `SETTING_PATH` — cartella della Setting Bible del progetto.
- `IMAGE_GEN_URL` e/o chiavi provider — generazione immagini.

---

## 14. Distribuzione open-source

- **Licenza:** MIT.
- **README** bilingue IT/EN: cosa fa, installazione come plugin Claude Code, come configurare la
  cartella dati (formato neutro documentato in `SCHEMA.md`), esempi d'uso. Nessun riferimento a
  prodotti/marchi di terze parti.
- **plugin.json** conforme al formato marketplace Claude Code (per installazione via repo git).
- **.gitignore:** esclude dati di gioco, Setting Bible utente, output generati (PNG/PDF/HTML
  prodotti), `node_modules/`, segreti/`.env`.
- **CONTRIBUTING.md**, **CHANGELOG.md**.
- Verifica pre-pubblicazione: scan del repo per assenza di segreti, dati copyright e riferimenti a
  marchi.

---

## 15. Mappatura origine → plugin (cosa si riusa)

| Origine | Componente plugin |
|---------|-------------------|
| MCP `mad-builder` → `read_5etools` | `compendium-reader` (neutro) |
| skill `dnd-adventure-writer` (+ style-guide, Lazy DM, template) | skill `adventure-writer` (generalizzata) |
| workflow Playwright carte (`feedback_item_card`) | `lib/render-to-png` + skill `item-card` |
| `dm-screen-v12.html`, `dm-screen-mockup.html` | skill `dm-screen` + template |
| `maps/add_grid.py` | `lib/add-grid` |
| `perchance-dnd.png` exploration | skill `image-gen` (browser, no geo-block) |
| ricerca tool mappe (procedurale agent-friendly) | `battle-map` tier 1 |

---

## 16. Decisioni aperte (per la fase di planning)

- Linguaggio dei componenti MCP/utility: Node (coerente con MCP e Playwright esistenti).
- Se includere un converter/adapter di esempio (neutro) o lasciarlo come doc.
- Set minimo di campi dello schema compendio da documentare nella v1.

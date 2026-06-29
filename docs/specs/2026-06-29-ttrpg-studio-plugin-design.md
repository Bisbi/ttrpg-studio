# TTRPG Studio — Plugin Design Spec (v2)

> **Status:** Approved design (v2, post-review) — ready for implementation planning
> **Date:** 2026-06-29
> **Author:** Giobbo
> **Target:** Claude Code plugin, open-source su GitHub
> **Changelog:** v2 integra le review di tre revisori (game design, architettura agent/MCP, IP/open-source). Vedi §18 per la mappa review→modifica.

---

## 1. Purpose & Scope

**TTRPG Studio** è un plugin Claude Code che porta in *qualsiasi* progetto un kit completo per creare e
produrre materiale per giochi di ruolo **compatibili con la Quinta Edizione (5E-compatible)**:
worldbuilding + pipeline di produzione (avventure, carte oggetto, schermo del master, mappe, arte).

Nasce estraendo e **generalizzando** strumenti già sviluppati in progetti personali, per renderli
riusabili su ogni nuova ambientazione e **pubblicabili liberamente**.

> **Marchio:** il progetto NON è affiliato né approvato da Wizards of the Coast / Hasbro. Si usa solo
> la formula di compatibilità nominativa "compatibile con la Quinta Edizione" / "5E-compatible".
> Nessun marchio di terze parti compare nel codice, nei nomi dei tool o nella documentazione.

### Goal
Kit completo = **worldbuilding** (creare un'ambientazione da zero) **+ produzione** (trasformarla in
materiale *giocabile al tavolo*), con un backend dati portabile e bilingue.

### Non-goals (YAGNI)
- Nessuna distribuzione di contenuti di gioco coperti da copyright.
- Nessun tool "contributor" verso API esterne.
- Nessun legame fisso a una specifica campagna o ambientazione.
- Nessuna gestione di virtual tabletop (VTT) runtime.

---

## 2. Vincolo fondamentale: pubblicabilità open-source

Il plugin è destinato a GitHub pubblico. Vincoli architetturali (non note a margine):

1. **Zero contenuti coperti da copyright** nel repo. Nessun dato di gioco incluso o scaricato.
2. **Zero riferimenti a marchi/strumenti di terze parti** in codice, nomi dei tool e documentazione.
3. **Zero segreti**: nessuna chiave/credenziale committata; tutto via env fornite dall'utente.
4. Il plugin definisce un **formato dati neutro e documentato** (i formati/strutture dati non sono
   tutelabili — *idea/expression dichotomy*) e legge una cartella fornita dall'utente.
5. **Policy "esempi puliti"**: ogni esempio di dato/record nel repo è **homebrew inventato** oppure
   **SRD sotto CC-BY-4.0 con attribuzione**; mai testo/stat di prodotti commerciali; il campo `source`
   negli esempi usa solo valori fittizi (es. `"HomebrewExample"`).

> Impostazione di "buon senso prudente", non consulenza legale. Vedi `DISCLAIMER.md`.

---

## 3. Architettura del plugin

Plugin Claude Code installato a livello utente. Cartella dedicata, repo git autonomo:

```
ttrpg-studio/
├── .claude-plugin/plugin.json     # manifest (license, keyword neutre)
├── mcp/
│   └── compendium-reader/
│       ├── index.js               # MCP server (Node, stdio)
│       ├── lib/                   # index, cache, search, path-safety, config-validate
│       ├── schema/                # *.schema.json (uno per tipo) + SCHEMA.md
│       └── package.json
├── skills/
│   ├── worldbuilding/
│   ├── adventure-writer/
│   ├── item-card/
│   ├── dm-screen/
│   ├── battle-map/
│   └── image-gen/
├── commands/                      # slash command (§13)
├── agents/lore-keeper.md
├── lib/
│   ├── render-to-png/             # Playwright HTML→PNG (cross-platform)
│   ├── add-grid/                  # griglia su mappa — Node (no dipendenza Python)
│   ├── encounter/                 # budget XP / difficoltà
│   ├── image-provider/            # interfaccia provider + impl
│   └── common/                    # config-validate, logger, errors, fs-atomic
├── templates/
│   ├── item-card/  dm-screen/  setting-bible/  adventure/  tables/  handout/
├── examples/
│   └── compendium-homebrew/       # dataset 100% homebrew (CC-BY) per onboarding + test
├── test/                          # unit + fixture + eval harness
├── .github/workflows/ci.yml       # lint, test, secret-scan, denylist marchi
├── README.md                      # bilingue IT/EN, terminologia neutra
├── LICENSE                        # codice (Apache-2.0 — vedi §16)
├── LICENSE-CONTENT                # contenuti/asset (CC-BY-4.0)
├── NOTICE                         # attribuzioni (incl. stringhe SRD pronte)
├── DISCLAIMER.md
├── CONTRIBUTING.md                # con "IP gate" + DCO
├── CODE_OF_CONDUCT.md
├── SECURITY.md
├── CHANGELOG.md
└── .gitignore
```

---

## 4. `compendium-reader` (MCP) — dati di gioco

**Scopo:** accesso ai dati (mostri, incantesimi, oggetti, ecc.) in modo portabile, offline, bilingue,
**senza contenere alcun dato**.

### 4.1 Schema dati (P0.1) — contratto formale, non "documentato a parole"
- Cartella "compendio" con file JSON per tipo (`monsters.json`, `spells.json`, `items.json`, …).
- Ogni file ha `"schema_version": "1.0"`; ogni record ha un **`id` stabile e univoco** (slug
  normalizzato), distinto dal `name` umano. Univocità garantita per `(type, id)`; collisioni
  cross-source risolte includendo `source` nell'`id`.
- Campi comuni definiti per tipo, con **JSON Schema** versionato in `mcp/compendium-reader/schema/`
  (`monster.schema.json`, ecc.), validato al load.
- **`entries` normalizzato in formato neutro**: array di nodi tipizzati
  `{type: "text"|"list"|"table"|"entries", ...}` con eventuale markup inline **tipizzato** (oggetti),
  NON stringhe con markup proprietario di terze parti. Grammatica descritta in `SCHEMA.md`.
- `i18n`: campi localizzabili come `{ "it": "...", "en": "..." }`, con fallback per-campo `it→en`.
- `SCHEMA.md` documenta tutto con **esempi homebrew/fittizi** (policy §2.5).

### 4.2 Comportamento del reader (P0.2)
- **Indice + cache in memoria**: alla prima query (lazy) costruisce `type → [records]` + indice di
  ricerca full-text (token map o `minisearch`/`flexsearch`). Invalidazione via `mtime`. **Mai**
  `JSON.parse` per ogni chiamata.
- **Nessun `SEARCH_MAP` hardcoded** e **nessun default a marchio**: il set di tipi/file si deriva
  scandendo la cartella (più `_manifest.json` opzionale). Nessun `source` di default.
- **Path-safety reale** (P1): `path.resolve` + `fs.realpathSync` + check di containment sotto la root
  (non regex-stripping).
- **Cross-platform**: solo `path.join`/`path.sep`; nessuna assunzione Windows.

### 4.3 Tool esposti (firme con paginazione e proiezione — P1)
- `search(query, {type?, lang?, limit?, cursor?, fields?})` → `{ results, total, cursor }`
- `list(type, {filters?, lang?, limit?, cursor?, fields?})` → `{ results, total, cursor }`
- `get(type, idOrName, {lang?, fields?})` → record; **errore esplicito** con disambiguazione per
  `source` su match multiplo.
- `read_file(file, {root_key?, fields?})` → accesso grezzo con proiezione.
- Tutti **read-only e idempotenti**. Errori in forma uniforme `{code, message, retriable}`.

### 4.4 Adapter (P0.9) — disciplinato
Solo un adapter **generico schema→schema** (mappa di campi fornita dall'utente) o pura documentazione.
**Vietato** nel repo qualunque mapping hardcoded verso lo schema di un prodotto/dataset di terze parti
nominato (regola in `CONTRIBUTING.md`). L'utente, in privato, converte i propri dati.

---

## 5. `worldbuilding` (skill, ibrido) — Setting Bible + generatori

### 5.1 Setting Bible
`/new-setting <nome>` crea lo scheletro (in `templates/setting-bible/`):
```
setting/
├── 00-overview.md
├── 10-cosmology.md
├── 20-geography/         # regioni
├── 30-factions/
├── 40-pantheon/
├── 50-peoples.md
├── 60-timeline.md
├── 70-bestiary-custom/   # mostri custom (possono derivare da record del compendio)
├── 80-tables/            # random tables riutilizzabili (P1)
├── 90-glossary.md        # include dizionario IT↔EN dei termini di gioco (P1)
├── _relations.md         # grafo relazioni tra entità (P1)
└── _index.md
```
Fonte di verità unica: tutti i produttori vi attingono per la coerenza (canon).

### 5.2 Grafo relazioni (P1)
`_relations.md` (o front-matter per entità) codifica archi tipizzati:
`Fazione A —ostile→ Fazione B`, `PNG X —subordinato→ PNG Y`, `Divinità —patrona→ Fazione`. Abilita
generazione coerente e rende `lore-keeper` un **validatore semantico**, non solo name-checker.

### 5.3 Generatori on-demand (P0.4 esteso)
Comandi `/gen-region|faction|deity|npc|monster` che **leggono il canon esistente e generano in
tensione con esso**, con **input strutturati + tabelle di seed** (no "fantasy generico"). Esempio
`/gen-faction`: input obbligatori (regione, risorsa contesa, attrito con ≥1 fazione esistente,
debolezza interna) + seed table d100 (movente, metodo, simbolo, segreto) → scheda + 1 gancio
d'avventura + voce timeline + archi in `_relations.md`.

**Contratto di mutazione (P1):** ogni generatore supporta `--dry-run` (mostra il diff), policy di
collisione (`skip|overwrite|append|error`), scrittura atomica (tmp + rename). `lore-keeper` come gate
pre-scrittura opzionale.

---

## 6. `adventure-writer` (skill)

Port generalizzato della skill esistente. Mantiene **style-guide** (8 principi) e workflow **Lazy DM**.

### 6.1 Template d'avventura come STRUTTURA DATI validata (P0.4)
Non prosa: front-matter/checklist con campi **contati e validabili**:
```yaml
strong_start:        # 1 scena, max 3 frasi
secrets_and_clues:   # ≥8 voci, una riga ciascuna  (three-clue rule per i nodi investigativi)
fantastic_locations: # 3-5, ognuna con 3 aspetti sensoriali
npcs:                # [nome, ruolo, voce/tic, vuole, segreto, fazione]
monsters:            # da compendio + ruolo nell'incontro
encounters:          # vedi §6.2 (budget XP)
hooks:               # ≥3 ganci d'ingresso
consequences:        # albero a cascata: se PG fanno X → Y
reward_loot:         # vedi §7.2
```
La validazione (≥8 segreti, ≥3 PNG con voce, ecc.) è eseguita dalla skill/`lore-keeper`, non lasciata
allo style-guide.

### 6.2 Encounter-builder (P0.5) — `lib/encounter` + `/encounter`
Dato il party (N PG × livello), calcola le **soglie XP** (easy/medium/hard/deadly) secondo le regole
5E, propone combinazioni di mostri dal compendio entro budget, annota terrain/obiettivo/condizione di
vittoria (non solo "uccidi tutto"). Output nel campo `encounters` e nel DM screen. Sanity-check CR sui
mostri custom (avviso se HP/AC/danno per round non coerenti col CR dichiarato) — *backlog P2 per la
versione completa, avviso base in v1*.

### 6.3 Canon e lingua
`campaign-context.md` (hardcoded) → **puntatore alla Setting Bible attiva**. Lingua configurabile
(default segue `GAME_DATA_LANG`); termini di gioco resi via il **dizionario IT↔EN** del glossario
(P1) per coerenza (es. *Tiro Salvezza su Destrezza (CD 15)*).

---

## 7. `item-card` (skill) + `render-to-png` (utility)

### 7.1 Flusso
1. Genera/ottiene l'immagine (via `image-gen`, §9).
2. Compila il template `templates/item-card/` (HTML a **800×1200 = 2x**).
3. `render-to-png` → PNG.

### 7.2 Loot legato all'avventura (P0.6)
La carta consuma il campo `reward_loot` (rarità, attunement sì/no, budget di tesoro per livello,
"perché il party lo vuole") invece di generare oggetti scollegati. Tabella di **ricompense non-oggetto**
(favori, titoli, informazioni, alleati) per evitare l'inflazione magica.

### 7.3 `render-to-png` (P0.3) — robusto e cross-platform
Playwright (`chromium.launch()`), preferendo `page.setContent(html)` / `file://` invece di un server
HTTP locale; se serve un server per asset relativi → porta effimera (`:0`) chiusa in `try/finally`.
Timeout espliciti, un retry, health-check del browser, lifecycle gestito. `--no-sandbox` opt-in, non
default. Utility condivisa con `dm-screen` (parametri: path/HTML, selettore, dimensioni).

---

## 8. `dm-screen` (skill)

Schermo del master HTML interattivo (pannelli, tabelle incontri, statblock collassabili, riferimenti
rapidi). Legge Bible + compendio. Export PNG/PDF via `render-to-png`. Scaling incontro on-the-fly
(+1/−1 PG ricalcola il budget) → *backlog P2*.

---

## 9. `image-gen` (skill) — provider plug-in (P0.3)

Generazione arte per **🗡️ oggetti · 👹 mostri · 🛡️ PG · 🧑 PNG** (NON mappe).

**Interfaccia `ImageProvider { generate(prompt, opts) → file }`** con due implementazioni:
- **(a) API-based — DEFAULT raccomandato**: provider con API key via env (`IMAGE_API_KEY`,
  `IMAGE_API_URL`). Affidabile, testabile, deterministico.
- **(b) browser-automation — best-effort**: pilota un generatore web; esplicitamente marcato
  "fragile, non garantito, non testato in CI". URL via env (`IMAGE_GEN_URL`), fuori dal repo.

**Disclaimer in-tool (P1):** al primo uso del provider (b), la skill avvisa che si sta automatizzando
un servizio terzo soggetto al suo ToS e che l'output ha le sue licenze. Timeout/retry/backoff
espliciti; "attesa render" come condizione verificabile (selettore/evento), non sleep cieco.

Integrazione: fornisce l'arte 2:3 a `item-card` e i ritratti ai generatori di `worldbuilding`.

---

## 10. `battle-map` (skill, a livelli)

| Tier | Metodo | Quando |
|------|--------|--------|
| **1 — default** | Generatore procedurale (provider plug-in, §9-style) → export SVG/PNG/JSON → `add-grid` | dungeon/strutture, deterministico, line-art B/N |
| **2 — arte** | `ImageProvider` API-based + ritocchi | scene atmosferiche |
| **import** | JSON procedurale → editor di mappe | rifinitura manuale |

`lib/add-grid` (P2-decision risolta): **implementato in Node** (es. `sharp`/`@napi-rs/canvas`),
eliminando la dipendenza Python di `add_grid.py`. Stile default: top-down B/N, line-art, stampabile,
griglia aggiunta in post. Provider/generatori configurabili via env, mai hardcoded.

---

## 11. `lore-keeper` (agent) — validatore semantico (P1)

Oltre al name-check, usa il **grafo relazioni** (§5.2) per rilevare incoerenze *di design*:
collaborazioni tra nemici dichiarati, miracoli fuori dominio, timeline causalmente impossibili.
Read-only sulla Bible; produce un report di discrepanze. Riusabile come gate pre-scrittura dei
generatori.

---

## 12. Output condivisi (P1)

- **`/session-prep`** → estrae dall'avventura una **scheda di una pagina** (strong start, 3 scene
  probabili, mostri pronti, 5 nomi PNG di riserva, 3 complicazioni, loot): il deliverable Lazy DM.
- **Handout giocatori** → output diegetici (lettere, mappe player-safe, manifesti) via
  `render-to-png`. **Separazione netta vista-DM / vista-player**: l'informazione segreta non finisce
  mai negli handout.
- **Random tables** (`templates/tables/` + `80-tables/`) come tipo di contenuto di prima classe;
  comando `/roll <table>` per uso live.

---

## 13. Slash commands

| Comando | Skill | Azione |
|---------|-------|--------|
| `/new-setting <nome>` | worldbuilding | scaffold Setting Bible |
| `/gen-region` `/gen-faction` `/gen-deity` `/gen-npc` `/gen-monster` | worldbuilding | genera elemento (input strutturati) e salva nella Bible |
| `/new-adventure` | adventure-writer | workflow Lazy DM (template-as-data) |
| `/encounter` | adventure-writer | budget XP + combinazioni mostri |
| `/session-prep` | adventure-writer | scheda one-page |
| `/item-card` | item-card | carta oggetto (da `reward_loot`) |
| `/dm-screen` | dm-screen | schermo del master |
| `/battle-map` | battle-map | mappa (tier selezionabile) |
| `/gen-art` | image-gen | arte per oggetto/mostro/PG/PNG |
| `/handout` | output condivisi | handout giocatori (player-view) |
| `/roll <table>` | output condivisi | tira una random table |
| `/lore-check` | lore-keeper | verifica coerenza canon (semantica) |

---

## 14. Configurazione per progetto

Env / file di config locale (**mai** committato nel plugin):
- `GAME_DATA_PATH`, `GAME_DATA_LANG` (`it|en`, fallback per-campo `it→en`)
- `SETTING_PATH` — cartella Setting Bible del progetto
- `OUTPUT_DIR` — dove finiscono PNG/PDF/HTML generati (naming + no-collisione documentati)
- `IMAGE_API_KEY` / `IMAGE_API_URL` (provider default) o `IMAGE_GEN_URL` (browser best-effort)

**Config validation (P1):** all'avvio, un modulo valida path/lingua/permessi e fallisce con messaggi
azionabili. **Logging (P1):** su `stderr` (stdout è riservato al protocollo MCP), livelli, flag
`TTRPG_DEBUG`. Telemetria solo opt-in, locale, anonima.

---

## 15. Distribuzione open-source (P0.7, P0.8, P1)

- **Licenza dual (§16):** codice **Apache-2.0** (`LICENSE`), contenuti/asset **CC-BY-4.0**
  (`LICENSE-CONTENT`: `templates/`, scheletri Bible, `examples/`). Dichiarata in README + `NOTICE`.
- **`DISCLAIMER.md`** (bilingue): non distribuiamo contenuti; l'utente è responsabile dei diritti sui
  dati che punta; non affiliazione WotC/Hasbro né con servizi terzi automatizzati; output AI e
  automazione browser soggetti a ToS/licenze dei servizi scelti; "not legal advice".
- **`NOTICE`**: attribuzioni; include le **stringhe CC-BY-4.0 pronte per SRD 5.1 e 5.2** (anche se la
  v1 spedisce zero SRD, l'utente resta compliant se aggiunge dati SRD).
- **README** bilingue IT/EN, terminologia neutra, quickstart "5 minuti" sul dataset homebrew di
  esempio (`examples/`), formula di compatibilità nominativa + disclaim marchio.
- **`CONTRIBUTING.md`** con **IP gate**: divieto PR con contenuti coperti/nomi di marchi; **DCO
  (`Signed-off-by`)**; checklist "no segreti / no dati / no marchi".
- **`CODE_OF_CONDUCT.md`** (Contributor Covenant), **`SECURITY.md`** (gestione segreti/chiavi, contatto).
- **`.gitignore`**: esclude dati, Setting Bible utente, `OUTPUT_DIR`, `node_modules/`, `.env`/segreti.
- **CI (`.github/workflows/ci.yml`, P1):** lint + test + validazione JSON Schema su fixture +
  **secret-scan** (gitleaks) + **denylist marchi** su ogni PR. Automatizza la verifica
  pre-pubblicazione (non più manuale una-tantum).
- **`plugin.json`**: `license`, `homepage`, keyword neutre ("ttrpg", "5e-compatible", "worldbuilding",
  "claude-code-plugin").

---

## 16. Decisioni di default (ribaltabili da Giobbo)

1. **Licenza codice: Apache-2.0** (anziché MIT) — la clausola trademark e la grant di brevetto sono
   utili in un dominio dove la difesa del marchio altrui è il rischio principale. *Override possibile:
   MIT, per massima coerenza con l'ecosistema plugin.*
2. **Image provider di default: API-based** dietro `ImageProvider`; browser-automation come fallback
   best-effort dichiarato.
3. **`add-grid` in Node** (no Python): coerenza "tutto Node", portabilità cross-platform.
4. **`examples/compendium-homebrew/`** incluso (CC-BY): serve sia all'onboarding "5 minuti" sia come
   fixture per i test.

---

## 17. Backlog post-v1 (P1 residui + P2, documentati ma fuori v1)

- CI **multi-OS** (windows + ubuntu) + **eval harness** dei tool (input→tool→output atteso) su fixture.
- **i18n** completo per-campo come strategia formale (oltre al fallback base).
- **session-log / continuità** tra sessioni (stato PNG vivo/morto/alleato, ganci completati),
  riconciliato con `60-timeline.md`.
- **Sanity-check CR** completo per mostri custom.
- **Scaling incontro on-the-fly** nel DM screen (+1/−1 PG).
- **Design token** estetici condivisi (palette/font del setting) tra carte, DM screen, mappe.
- Travel/downtime/hex-o-point-crawl come struttura tra le scene.
- Template di issue/PR con checklist IP.
- Governance minima + procedura "cosa facciamo se arriva una segnalazione/DMCA".

---

## 18. Mappa review → modifica (tracciabilità)

| Origine review | Modifica nello spec |
|---|---|
| 🏗️ Schema sottospecificato | §4.1 SCHEMA.md + JSON Schema + `schema_version` + `id` stabile + `entries` neutro |
| 🏗️ Implementazione di riferimento non scala | §4.2 indice/cache, no lista file hardcoded, no default a marchio, path-safety, cross-platform |
| 🏗️ Firme tool | §4.3 paginazione `cursor`, proiezione `fields`, errori uniformi |
| 🏗️+⚖️ Browser fragile/ToS | §9 `ImageProvider`, default API-based, browser best-effort + disclaimer |
| 🏗️ Mutazioni Bible | §5.3 `--dry-run`, policy collisioni, write atomico |
| 🏗️ Python vs Node | §10/§16 `add-grid` in Node |
| 🏗️ Config/logging/test | §14 config-validation + logging stderr; §15 CI; §17 eval harness |
| 🎲 Lazy DM as prose | §6.1 template-as-data validato |
| 🎲 Encounter budget | §6.2 `lib/encounter` + `/encounter` |
| 🎲 Loot/economia | §7.2 `reward_loot` + ricompense non-oggetto |
| 🎲 Relazioni/PNG | §5.2 grafo relazioni; §11 lore-keeper semantico |
| 🎲 Session-prep/handout/tables | §12 |
| 🎲 Bilingue termini | §5.1/§6.3 dizionario IT↔EN nel glossario |
| ⚖️ Dual-license | §15/§16 Apache-2.0 + CC-BY-4.0 |
| ⚖️ Disclaimer/marchio | §1/§2/§15 DISCLAIMER, "5E-compatible", non-affiliazione |
| ⚖️ Adapter/esempi puliti | §2.5/§4.4 policy |
| ⚖️ File community | §15 NOTICE, SECURITY, CODE_OF_CONDUCT, CONTRIBUTING+DCO, CI secret/marchio |

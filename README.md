# TTRPG Studio

**[English](#ttrpg-studio)** · **[Italiano](#ttrpg-studio-it)**

Claude Code plugin to create and produce **5E-compatible** game material:
worldbuilding, adventures, item cards, DM screen, maps and art.

> Not affiliated with or endorsed by any publisher. It does not distribute game
> content — it reads your data from a folder that you provide. See `DISCLAIMER.md`.

## License
Code: **Apache-2.0** (`LICENSE`). Content/assets: **CC BY 4.0** (`LICENSE-CONTENT`).

## Quickstart (5 minutes)
The plugin ships a small **homebrew** dataset in `examples/compendium-homebrew/`
so you can try it without any external data:

    GAME_DATA_PATH=./examples/compendium-homebrew GAME_DATA_LANG=en

## Configuration
| Env | Meaning |
|-----|---------|
| `GAME_DATA_PATH` | folder of your compendium (see `mcp/compendium-reader/schema/SCHEMA.md`) |
| `GAME_DATA_LANG` | `it` or `en` (per-field fallback `it→en`) |
| `SETTING_PATH` | folder of your Setting Bible (worldbuilding) |
| `ADVENTURE_PATH` | folder of your adventures |
| `OUTPUT_DIR` | where generated PNG/PDF files are written |
| `IMAGE_API_URL` / `IMAGE_API_KEY` | art provider via API (recommended) |
| `IMAGE_GEN_URL` | browser-based art provider (best-effort, fragile) |
| `VOICE_PATH` | path to your local voice profile (otherwise `SETTING_PATH/voice-profile.md`) |
| `TTRPG_DEBUG` | `1` for debug logs on stderr |

## Worldbuilding

Create a setting and keep it consistent:

    SETTING_PATH=./setting   # folder of your Setting Bible

- `/new-setting <name>` — creates the Setting Bible skeleton.
- `/gen-region`, `/gen-faction`, `/gen-deity`, `/gen-npc`, `/gen-monster` —
  generate elements consistent with the canon (structured inputs + seed tables).
  Every write supports `--dry-run` and a collision policy
  (`skip|overwrite|append|error`).
- `/lore-check` — `lore-keeper` validates the semantic consistency of the canon.

The deterministic utilities live in `lib/` (Node ESM, tested with vitest).

## Adventures (table-ready)

    ADVENTURE_PATH=./adventures   # folder of your adventures

- `/new-adventure "<title>"` — creates an adventure as a **validated data
  structure** (≥8 secrets, 3–5 sensory locations, ≥3 hooks, NPCs with a voice
  and a secret).
- `/encounter 3,3,3,4 hard` — party XP budget and encounter proposals from the
  compendium (5E-compatible thresholds).
- `/session-prep <slug>` — one-page sheet for the table (DM view).
- `/roll <table>` — roll on a random table (plugin seed or the `80-tables/`
  folder of the Setting Bible).

Player handouts (player view) come with the production module.

## Production (printable material)

    OUTPUT_DIR=./output   # where generated PNG/PDF files end up

- `/item-card` — item card PNG (800×1200) from a `reward_loot` entry.
- `/dm-screen [--pdf]` — DM screen (1920×1080) from an adventure.
- `/handout` — diegetic player handout (**player view**: secret fields are
  removed automatically).

HTML→PNG/PDF rendering uses **Playwright** (`render/` package). Install the
browser once with `npx playwright install chromium`. The HTML composition layer
lives in `lib/` (zero dependencies, tested); the renderer is isolated in
`render/`.

## Visuals (art and maps)

Art provider (configure **one** of the two):

    IMAGE_API_URL=...   IMAGE_API_KEY=...   # API provider (recommended)
    IMAGE_GEN_URL=...                        # browser best-effort (fragile)

- `/gen-art "<description>"` — 2:3 art for items, monsters, PCs, NPCs (not maps).
  The browser provider shows a disclaimer about ToS and licenses on first use.
- `/battle-map [--tier 1|2]` — Tier 1: procedural SVG line-art dungeon + grid
  (deterministic, also exports JSON); Tier 2: a grid over scene art.

Maps are zero-dependency (SVG generated in Node, grid in post); the PNG
rasterization reuses the Playwright renderer in `render/`.

## Voice and style

The plugin writes creative prose in a **concrete and vivid** way, not generic
(`prose-style` skill). You can give it **your own voice**:

- `/voice-profile` — builds your voice profile from your own texts (guided
  template).
- The file lives in `SETTING_PATH/voice-profile.md` or in `VOICE_PATH`, is
  **local and gitignored** (it never ends up in the repo). The creative skills
  apply it if present.

The plugin's style guide is **neutral**: the goal is human, concrete prose,
not "evading AI detectors".

---

# TTRPG Studio (IT)

**[English](#ttrpg-studio)** · **[Italiano](#ttrpg-studio-it)**

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
| `SETTING_PATH` | cartella della tua Setting Bible (worldbuilding) |
| `ADVENTURE_PATH` | cartella delle tue avventure |
| `OUTPUT_DIR` | dove finiscono i file PNG/PDF generati |
| `IMAGE_API_URL` / `IMAGE_API_KEY` | provider arte via API (consigliato) |
| `IMAGE_GEN_URL` | provider arte via browser (best-effort, fragile) |
| `VOICE_PATH` | percorso del tuo profilo voce locale (altrimenti `SETTING_PATH/voice-profile.md`) |
| `TTRPG_DEBUG` | `1` per log di debug su stderr |

## Worldbuilding

Crea un'ambientazione e mantienila coerente:

    SETTING_PATH=./setting   # cartella della tua Setting Bible

- `/new-setting <nome>` — crea lo scheletro della Setting Bible.
- `/gen-region`, `/gen-faction`, `/gen-deity`, `/gen-npc`, `/gen-monster` —
  generano elementi coerenti col canon (input strutturati + seed table). Ogni
  scrittura supporta `--dry-run` e una policy di collisione (`skip|overwrite|append|error`).
- `/lore-check` — `lore-keeper` valida la coerenza semantica del canon.

Le utility deterministiche stanno in `lib/` (Node ESM, testate con vitest).

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

## Produzione (materiale stampabile)

    OUTPUT_DIR=./output   # dove finiscono PNG/PDF generati

- `/item-card` — carta oggetto PNG (800×1200) da una voce `reward_loot`.
- `/dm-screen [--pdf]` — schermo del master (1920×1080) da un'avventura.
- `/handout` — handout diegetico per i giocatori (**vista-player**: i campi segreti
  vengono rimossi automaticamente).

Il rendering HTML→PNG/PDF usa **Playwright** (package `render/`). Installa il browser
una volta con `npx playwright install chromium`. Il layer di composizione HTML sta in
`lib/` (zero dipendenze, testato); il renderer è isolato in `render/`.

## Visuals (arte e mappe)

Provider arte (configura **uno** dei due):

    IMAGE_API_URL=...   IMAGE_API_KEY=...   # provider API (consigliato)
    IMAGE_GEN_URL=...                        # browser best-effort (fragile)

- `/gen-art "<descrizione>"` — arte 2:3 per oggetti, mostri, PG, PNG (non mappe).
  Il provider browser mostra un disclaimer su ToS e licenze al primo uso.
- `/battle-map [--tier 1|2]` — Tier 1: dungeon procedurale SVG line-art + griglia
  (deterministico, esporta anche JSON); Tier 2: griglia su un'arte di scena.

Le mappe sono zero-dipendenze (SVG generato in Node, griglia in post); la
rasterizzazione PNG riusa il renderer Playwright di `render/`.

## Voce e stile

Il plugin scrive la prosa creativa in modo **concreto e vivo**, non generico
(skill `prose-style`). Puoi dargli la **tua voce**:

- `/voice-profile` — crea il tuo profilo voce dai tuoi testi (template guidato).
- Il file vive in `SETTING_PATH/voice-profile.md` o in `VOICE_PATH`, è **locale e
  gitignored** (non finisce nel repo). Le skill creative lo applicano se presente.

La guida di stile del plugin è **neutra**: l'obiettivo è una prosa umana e concreta,
non "eludere i rilevatori AI".

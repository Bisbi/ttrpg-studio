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
| `SETTING_PATH` | cartella della tua Setting Bible (worldbuilding) |
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

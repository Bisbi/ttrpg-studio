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

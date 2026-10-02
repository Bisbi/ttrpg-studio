---
description: Scaffolda una campagna nel progetto corrente (Bible, compendio originale, output, config)
argument-hint: <nome-campagna>
---

Scaffolda la struttura di campagna per "$ARGUMENTS" nella cartella-progetto corrente.

Esegui:
`PROJECT_DIR="$(pwd)" node ${CLAUDE_PLUGIN_ROOT}/lib/bin/new-campaign.js "$ARGUMENTS" --reference "<percorso-compendio-riferimento>"`

Crea nella cartella-progetto:
- `setting/` — la Setting Bible (overview, cosmologia, geografia, fazioni, pantheon, popoli, timeline, bestiario custom, tabelle, glossario)
- `setting/compendium/` — il compendio ORIGINALE della campagna (`_manifest.json` con i tipi monster/npc/deity/item/pc)
- `adventures/` — le avventure (ADVENTURE_PATH)
- `output/{dm-screens,battle-maps,handouts,item-cards,art,wiki}/` — l'albero di output, una sottocartella per tipo di artefatto (OUTPUT_DIR)
- `.claude/settings.json` — env di progetto: `GAME_DATA_PATH` (multi-root: riferimento;compendio-originale), `GAME_DATA_LANG`, `SETTING_PATH`, `ADVENTURE_PATH`, `OUTPUT_DIR`
- `docs/superpowers/specs/` — cartella per le spec

In caso di collisione usa `--policy skip` o `--dry-run` per vedere cosa cambierebbe.
Dopo lo scaffold, riassumi i file creati e suggerisci i prossimi passi
(`/gen-region`, `/gen-faction`, import del compendio-riferimento, `/gen-wiki`).

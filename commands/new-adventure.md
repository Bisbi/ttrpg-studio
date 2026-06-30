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

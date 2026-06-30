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

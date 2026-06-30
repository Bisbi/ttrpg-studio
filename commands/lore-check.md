---
description: Verifica la coerenza semantica del canon (lore-keeper)
---

Invoca l'agent **lore-keeper** per validare il canon dell'ambientazione attiva
(`SETTING_PATH`).

Per prima cosa lancia il check meccanico:
`node ${CLAUDE_PLUGIN_ROOT}/lib/bin/lore-check.js`

Poi chiedi a lore-keeper di completare con l'analisi semantica e di restituire un
report di discrepanze con proposte di correzione (read-only, nessuna modifica).

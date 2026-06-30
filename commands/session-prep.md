---
description: Genera la scheda one-page di una sessione (deliverable Lazy DM)
argument-hint: <slug-avventura>
---

Genera la scheda **one-page** per l'avventura "$ARGUMENTS" (vista-DM, niente
elenco segreti).

Esegui:
`node ${CLAUDE_PLUGIN_ROOT}/lib/bin/session-prep.js "$ARGUMENTS"`

Legge `ADVENTURE_PATH/<slug>/adventure.json` e scrive `session-prep.md` accanto
ad essa: strong start, 3 scene probabili, mostri pronti, 5 nomi PNG di riserva,
3 complicazioni, loot. Riassumi il risultato e ricorda che gli handout per i
giocatori (vista-player) sono nel piano di produzione.

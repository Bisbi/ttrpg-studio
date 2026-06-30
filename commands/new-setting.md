---
description: Crea lo scheletro di una nuova Setting Bible
argument-hint: <nome-ambientazione>
---

Crea la struttura della Setting Bible per l'ambientazione "$ARGUMENTS".

Esegui:
`node ${CLAUDE_PLUGIN_ROOT}/lib/bin/new-setting.js "$ARGUMENTS"`

La destinazione è `SETTING_PATH` (default `./setting`). Se la cartella contiene
già una Bible, riporta l'errore di collisione e proponi `--policy skip` o
`--dry-run` per vedere cosa cambierebbe. Dopo lo scaffold, riassumi i file creati
e suggerisci i prossimi passi (`/gen-region`, `/gen-faction`).

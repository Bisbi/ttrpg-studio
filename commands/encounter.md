---
description: Budget XP del party e proposte di incontri dal compendio
argument-hint: [livelli es. 3,3,3,4] [difficoltà]
---

Calcola il budget XP e propone incontri per il party "$ARGUMENTS".

1. Determina i **livelli** del party (es. `3,3,3,4`) e la **difficoltà**
   (`easy|medium|hard|deadly`, default `hard`).
2. Ottieni i **mostri candidati** dal compendio via il tool `search`/`list` del
   server `compendium-reader` e costruisci un array `[{ id, name, xp }]`
   (lo `xp` deriva dal CR/record del mostro).
3. Esegui:
   `echo '<candidati-json>' | node ${CLAUDE_PLUGIN_ROOT}/lib/bin/encounter.js --levels 3,3,3,4 --difficulty hard`
4. Presenta budget e proposte; per ogni incontro scelto annota **terreno,
   obiettivo e condizione di vittoria** (non solo "uccidi tutto") e scrivilo nel
   campo `encounters` dell'avventura. Le combinazioni multi-tipo vanno verificate
   a mano contro il budget mostrato.

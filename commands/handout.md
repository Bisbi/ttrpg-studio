---
description: Genera un handout per i giocatori (vista-player, niente segreti)
argument-hint: [titolo]
---

Genera un **handout diegetico** (lettera, poster, nota) per i giocatori: "$ARGUMENTS".

1. Costruisci `{ kind: "letter"|"poster"|"note", title, content }`. Il `content` può
   essere testo o un oggetto strutturato: i campi `secret`/`secrets_and_clues` e le
   chiavi `*_dm` vengono **rimossi** automaticamente (vista-player).
2. Esegui:
   `echo '<handout-json>' | node ${CLAUDE_PLUGIN_ROOT}/lib/bin/handout.js`
3. Il PNG finisce in `OUTPUT_DIR`. **Mai** mettere informazioni segrete in un handout.

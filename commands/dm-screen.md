---
description: Genera lo schermo del master (PNG/PDF) da un'avventura
argument-hint: [--pdf]
---

Genera lo **schermo del master** per l'avventura attiva.

1. Costruisci `{ adventure: <adventure.json>, monsters: [{name, xp}] }` (i mostri dal
   `compendium-reader` con lo XP da CR).
2. Esegui:
   `echo '<json>' | node ${CLAUDE_PLUGIN_ROOT}/lib/bin/dm-screen.js`
   Aggiungi `--pdf` per l'export PDF invece del PNG.
3. L'output (1920×1080) finisce in `OUTPUT_DIR`. Lo scaling incontro on-the-fly è
   backlog. Richiede chromium per Playwright.

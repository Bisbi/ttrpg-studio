---
description: Genera la carta PNG di un oggetto (da reward_loot)
argument-hint: [nome oggetto]
---

Genera la **carta oggetto** per "$ARGUMENTS".

1. Ricava la voce oggetto da `reward_loot.items` dell'avventura attiva (o costruiscila
   con l'utente): `{ name, rarity, attunement, desc, image? }`. L'arte si ottiene dal
   modulo visuals (`/gen-art`); se assente la carta esce senza immagine.
2. Esegui:
   `echo '<item-json>' | node ${CLAUDE_PLUGIN_ROOT}/lib/bin/item-card.js`
3. Il PNG (800×1200) finisce in `OUTPUT_DIR` con naming no-collisione. Richiede
   chromium installato per Playwright (`npx playwright install chromium`).

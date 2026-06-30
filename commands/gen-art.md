---
description: Genera arte per oggetti/mostri/PG/PNG (provider API o browser)
argument-hint: "<descrizione>"
---

Genera arte per "$ARGUMENTS" (🗡️ oggetti · 👹 mostri · 🛡️ PG · 🧑 PNG — non mappe).

1. Configura un provider via env: `IMAGE_API_URL` (+ `IMAGE_API_KEY`) per il flusso
   **API affidabile (consigliato)**, oppure `IMAGE_GEN_URL` per il fallback
   **browser best-effort** (fragile; al primo uso compare un disclaimer su ToS e
   licenze dell'output, di cui sei responsabile).
2. Esegui:
   `node ${CLAUDE_PLUGIN_ROOT}/lib/bin/gen-art.js "$ARGUMENTS"`
3. Il PNG (2:3, adatto a `/item-card`) finisce in `OUTPUT_DIR`. L'arte può poi
   alimentare la carta oggetto o i ritratti dei generatori worldbuilding.

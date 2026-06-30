---
description: Genera una mappa da battaglia (Tier 1 procedurale, Tier 2 da arte)
argument-hint: [--tier 1|2]
---

Genera una **mappa da battaglia** con la griglia.

- **Tier 1 (default):** generatore procedurale → SVG line-art B/N stampabile + griglia,
  rasterizzato in PNG. Esporta anche il JSON della mappa. Deterministico.
  `echo '{"name":"Cripta","cols":16,"rows":16}' | node ${CLAUDE_PLUGIN_ROOT}/lib/bin/battle-map.js`
- **Tier 2 (arte):** prendi un'immagine di scena (da `/gen-art` o fornita) e applicale
  la griglia.
  `echo '{"name":"Arena","imageHref":"scena.png","cols":20,"rows":20}' | node ${CLAUDE_PLUGIN_ROOT}/lib/bin/battle-map.js --tier 2`

L'output finisce in `OUTPUT_DIR`. Richiede chromium per Playwright. Lo stile default è
top-down B/N, line-art, con griglia aggiunta in post.

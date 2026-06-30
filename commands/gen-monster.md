---
description: Genera un mostro custom coerente col canon e lo salva nel bestiario
argument-hint: [nicchia]
---

Genera un **mostro custom** per l'ambientazione attiva (`SETTING_PATH`).

## Input obbligatori (chiedili se mancano)
- **Nicchia ecologica/narrativa** (predatore d'agguato, guardiano, simbionte…).
- **Legame** con una regione o fazione esistente.

## Output
1. **Scheda**: nome, descrizione, comportamento, gancio d'uso. Se servono valori di
   gioco, restano **compatibili con la Quinta Edizione** e coerenti (CR/HP/AC
   plausibili); il sanity-check CR completo è backlog.
2. **Archi di relazione** verso la regione/fazione legata.

## Scrittura
`element = { kind:"monster", name, markdown, edges? }` → `applyGeneration`
(salva in `70-bestiary-custom/`, `--dry-run` + conferma).

---
description: Genera una regione coerente col canon e la salva nella Setting Bible
argument-hint: [tema]
---

Genera una **regione** per l'ambientazione attiva (`SETTING_PATH`).

## Input obbligatori (chiedili se mancano)
- **Tema/funzione** della regione nella campagna.
- **Confine** con ≥1 entità esistente (regione o fazione).

## Seed (usa `templates/tables/region-seed.json`)
Estrai o fai scegliere: `biomateria`, `risorsa`, `minaccia`, `meraviglia`.

## Output
1. **Scheda** markdown: nome, geografia, risorsa, minaccia, meraviglia, insediamenti.
2. **1 gancio d'avventura** legato alla minaccia o alla meraviglia.
3. **1 voce timeline** opzionale.
4. **Archi di relazione** verso le entità confinanti.

## Scrittura
`element = { kind:"region", name, markdown, timelineEntry?, edges? }` →
`applyGeneration` con `--dry-run` + conferma prima della scrittura.

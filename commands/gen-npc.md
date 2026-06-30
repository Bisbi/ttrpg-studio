---
description: Genera un PNG coerente col canon e lo salva nella Setting Bible
argument-hint: [ruolo]
---

Genera un **PNG** per l'ambientazione attiva (`SETTING_PATH`).

## Input obbligatori (chiedili se mancano)
- **Fazione/luogo** di appartenenza (deve esistere).
- **Funzione** nella storia (alleato, ostacolo, jolly).

## Seed (usa `templates/tables/npc-seed.json`)
Estrai o fai scegliere: `ruolo`, `tic`, `vuole`, `segreto`.

## Output
1. **Scheda**: nome, ruolo, voce/tic, cosa vuole, **segreto** (vista-DM), fazione.
2. **Archi di relazione** (`slug-png --subordinato--> slug-fazione`).

## Scrittura
`element = { kind:"npc", name, markdown, edges? }` → `applyGeneration`
(salva in `30-factions/_npcs/`, `--dry-run` + conferma).

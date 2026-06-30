---
description: Genera una divinità coerente col canon e la salva nel pantheon
argument-hint: [dominio]
---

Genera una **divinità** per l'ambientazione attiva (`SETTING_PATH`).

## Input obbligatori (chiedili se mancano)
- **Dominio** principale.
- **Relazione** con ≥1 fazione o popolo esistente (patrona/avversa).

## Seed (usa `templates/tables/deity-seed.json`)
Estrai o fai scegliere: `dominio`, `simbolo`, `richiesta`, `tabu`.

## Output
1. **Scheda**: nome, dominio, simbolo, culto, richiesta, tabu, **segreto** (vista-DM).
2. **Archi di relazione** (`slug-divinita --patrona--> slug-fazione`).

## Scrittura
`element = { kind:"deity", name, markdown, edges? }` → `applyGeneration`
(`--dry-run` + conferma).

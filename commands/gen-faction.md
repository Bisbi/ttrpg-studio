---
description: Genera una fazione coerente col canon e la salva nella Setting Bible
argument-hint: [regione] [risorsa-contesa]
---

Genera una **fazione** per l'ambientazione attiva (`SETTING_PATH`).

## Input obbligatori (chiedili se mancano)
- **Regione** di radicamento (deve esistere in `20-geography/`).
- **Risorsa contesa**.
- **Attrito** con ≥1 fazione esistente (leggi `30-factions/`).
- **Debolezza interna**.

## Seed (usa `templates/tables/faction-seed.json`)
Estrai o fai scegliere: `movente`, `metodo`, `simbolo`, `segreto`.

## Output
1. Una **scheda** markdown: nome, pitch, movente, metodo, struttura, simbolo,
   **segreto** (campo marcato `> SEGRETO (vista-DM):`), debolezza.
2. **1 gancio d'avventura**.
3. **1 voce timeline** (`Anno — evento`).
4. **Archi di relazione**: almeno l'attrito dichiarato, come
   `slug-fazione --ostile--> slug-altra`.

## Scrittura (mutation contract)
Costruisci l'oggetto `element = { kind:"faction", name, markdown, timelineEntry, edges }`
e scrivilo con `applyGeneration`. **Prima** mostra un `--dry-run` (diff) e chiedi
conferma; in caso di collisione proponi `--policy skip|overwrite|append`.
Poi, opzionale, lancia `/lore-check` per validare la coerenza.

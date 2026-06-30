---
name: adventure-writer
description: Scrive avventure 5E-compatible col workflow Lazy DM e un template-as-data validato (strong start, segreti/indizi, luoghi sensoriali, PNG, incontri a budget XP, conseguenze, loot). Usa quando l'utente vuole creare o rifinire un'avventura o preparare una sessione.
---

# Adventure Writer

L'avventura è una **struttura dati** (`adventure.json`), non prosa. La validazione
conta e verifica (vedi `templates/adventure/SCHEMA.md`).

## Workflow (Lazy DM)
1. `/new-adventure "<titolo>"` — scaffold.
2. Compila i campi puntando alla Setting Bible attiva (`campaign-context.md`).
3. `/encounter` per gli incontri entro budget XP.
4. `/session-prep` per la scheda one-page al tavolo.

## 8 principi di stile
1. **Strong start**: apri in scena, non con esposizione.
2. **Three-clue rule**: ogni conclusione necessaria ha ≥3 indizi.
3. **Luoghi fantastici**: 3–5, ciascuno con ≥3 dettagli sensoriali.
4. **PNG vivi**: voce/tic + cosa vogliono + un segreto.
5. **Incontri con scopo**: terreno, obiettivo, condizione di vittoria (non solo "uccidi").
6. **Conseguenze a cascata**: le azioni dei PG cambiano il mondo.
7. **Loot legato**: ricompense che il gruppo vuole, anche non-oggetto.
8. **Vista-DM / vista-player**: i segreti non finiscono negli handout.

## Regole non negoziabili
Ogni scrittura è atomica, con `--dry-run` e policy di collisione. Esegui
`validateAdventure` (via la lib) e mostra le discrepanze prima di considerare
"pronta" un'avventura.

## Voce e stile
Per la prosa (strong start, descrizioni dei luoghi, voci dei PNG, flavor del loot)
usa la skill **prose-style**: concretezza sensoriale, ritmo spezzato, niente
frasi-spia, niente chiusura-riassunto. Se l'utente ha un profilo voce personale
(`node ${CLAUDE_PLUGIN_ROOT}/lib/bin/voice.js` stampa qualcosa), applicalo.

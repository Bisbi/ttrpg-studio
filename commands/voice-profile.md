---
description: Crea o aggiorna il tuo profilo voce personale (locale, non committato)
argument-hint: [percorso opzionale]
---

Guida l'utente a creare il **profilo voce personale** per il materiale di gioco.

## Passi
1. Chiedi all'utente **2-3 brani** che ha scritto e che "suonano suoi" (post,
   descrizioni, qualsiasi cosa). Sono l'ancora più importante.
2. Estrai dai brani, **descrivendo** (mai copiando lo stile altrui):
   - **Ritmo**: frasi corte/lunghe, alternanza, cadenze ricorrenti.
   - **Lessico**: parole e registri ricorrenti; parole evitate.
   - **Tic/firma**: mosse ripetute (come apre, come chiude).
   - **Cosa non fa**: cliché da evitare.
3. Compila il `templates/voice/voice-profile.template.md` (vedi anche
   `voice-profile.example.md` per il formato atteso).
4. Salva in **`SETTING_PATH/voice-profile.md`** (oppure in `VOICE_PATH`). Il file è
   **locale e gitignored**: non finisce nel repo.

## Note
- Cornice corretta: scrivere **vivo e concreto**, non "eludere rilevatori AI".
- Niente dati sensibili nel file se pensi di condividerlo.
- D'ora in poi la skill `prose-style` userà questa voce quando presente.

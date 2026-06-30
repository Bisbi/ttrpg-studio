---
name: worldbuilding
description: Crea e fa evolvere un'ambientazione 5E-compatible (Setting Bible, regioni, fazioni, divinità, PNG, mostri) mantenendo il canon coerente. Usa quando l'utente vuole costruire un mondo, generare elementi d'ambientazione, o controllare la coerenza del canon.
---

# Worldbuilding

La **Setting Bible** (`SETTING_PATH`) è la fonte di verità unica. Ogni generazione
**legge il canon esistente e crea in tensione con esso** — niente "fantasy generico".

## Comandi
- `/new-setting <nome>` — scaffold della Bible.
- `/gen-region`, `/gen-faction`, `/gen-deity`, `/gen-npc`, `/gen-monster` — generano
  un elemento con input strutturati + seed table, e lo salvano nella Bible.
- `/lore-check` — `lore-keeper` valida la coerenza semantica del canon.

## Principi
1. **Input strutturati obbligatori** prima di generare (vedi ogni comando).
2. **Mutation contract:** ogni scrittura supporta `--dry-run`, ha una policy di
   collisione (`skip|overwrite|append|error`) ed è atomica.
3. **Archi di relazione:** ogni elemento generato dichiara i suoi archi
   (`sorgente --tipo--> destinazione`) che confluiscono in `_relations.md`.
4. **Campi segreti** marcati esplicitamente: non finiranno mai negli handout giocatori.
5. **Bilingue:** termini di gioco coerenti col glossario IT↔EN.

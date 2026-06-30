# Formato del compendio (schema_version 1.0)

La cartella indicata da `GAME_DATA_PATH` contiene file JSON, uno per tipo.
Tutti gli esempi qui sotto sono **homebrew fittizi** (`source: "HomebrewExample"`).

## File supportati (default)
- `monsters.json` → tipo `monster`
- `spells.json` → tipo `spell`
- `items.json` → tipo `item`

Un `_manifest.json` opzionale può mappare file → tipo in modo esplicito.

## Struttura di un file
```json
{ "schema_version": "1.0", "records": [ { "id": "...", "name": "...", "source": "HomebrewExample" } ] }
```

## Campi comuni (`BaseRecord`)
| Campo | Tipo | Note |
|-------|------|------|
| `id` | string | **univoco e stabile** (slug), distinto da `name` |
| `name` | string \| `{it,en}` | localizzabile |
| `source` | string | negli esempi sempre `"HomebrewExample"` |
| `entries` | EntryNode[] | testo strutturato (vedi sotto) |

### Localizzazione
Un campo localizzabile può essere `"Goblin"` oppure `{ "it": "Folletto", "en": "Goblin" }`.
Fallback per-campo: lingua richiesta → `en` → `it`.

### EntryNode (testo neutro, niente markup proprietario)
- `{ "type": "text", "text": "..." }`
- `{ "type": "list", "items": [EntryNode, ...] }`
- `{ "type": "table", "headers": ["A","B"], "rows": [["1","2"]] }`
- `{ "type": "entries", "name": "...", "entries": [EntryNode, ...] }`

## Tipi specifici
- `monster`: + `cr`, `hp`, `ac`, `type?`
- `spell`: + `level` (0–9), `school?`
- `item`: + `rarity?`, `attunement?`, `desc?`

I JSON Schema formali sono in `monster.schema.json`, `spell.schema.json`, `item.schema.json`.

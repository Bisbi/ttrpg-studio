# Compendium format / Formato del compendio

**Language / Lingua:** [English](#english) · [Italiano](#italiano)

---

<a id="english"></a>

# Compendium format (schema_version 1.0)

The folder pointed to by `GAME_DATA_PATH` contains JSON files, one per type.
All the examples below are **fictional homebrew** (`source: "HomebrewExample"`).

## Supported files (default)
- `monsters.json` → type `monster`
- `spells.json` → type `spell`
- `items.json` → type `item`

An optional `_manifest.json` can map files → type explicitly.

## Structure of a file
```json
{ "schema_version": "1.0", "records": [ { "id": "...", "name": "...", "source": "HomebrewExample" } ] }
```

## Common fields (`BaseRecord`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | string | **unique and stable** (slug), distinct from `name` |
| `name` | string \| `{it,en}` | localizable |
| `source` | string | in the examples always `"HomebrewExample"` |
| `entries` | EntryNode[] | structured text (see below) |

### Localization
A localizable field can be `"Goblin"` or `{ "it": "Folletto", "en": "Goblin" }`.
Per-field fallback: requested language → `en` → `it`.

### EntryNode (neutral text, no proprietary markup)
- `{ "type": "text", "text": "..." }`
- `{ "type": "list", "items": [EntryNode, ...] }`
- `{ "type": "table", "headers": ["A","B"], "rows": [["1","2"]] }`
- `{ "type": "entries", "name": "...", "entries": [EntryNode, ...] }`

## Specific types
- `monster`: + `cr`, `hp`, `ac`, `type?`
- `spell`: + `level` (0–9), `school?`
- `item`: + `rarity?`, `attunement?`, `desc?`

The formal JSON Schemas are in `monster.schema.json`, `spell.schema.json`, `item.schema.json`.

---

<a id="italiano"></a>

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

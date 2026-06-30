# Adventure format / Formato avventura

**Language / Lingua:** [English](#english) · [Italiano](#italiano)

---

<a id="english"></a>

# Adventure format (schema_version 1.0)

An adventure is a **data structure** in `adventure.json`, validated by rules
(`lib/adventure/validate.js`). The human-readable view (`adventure.md`) is derived.

## Fields
| Field | Type | Rule |
|-------|------|------|
| `title` | string | required |
| `strong_start` | string | required, 1 scene (max 3 sentences) |
| `secrets_and_clues` | string[] | **≥8** |
| `fantastic_locations` | {name, sensory[]}[] | **3–5**, each `sensory` **≥3** |
| `npcs` | obj[] | each NPC: `name, role, voice, wants, secret` (+ `faction?`) |
| `monsters` | {id, role}[] | `id` from the compendium |
| `encounters` | {name, monsters[], terrain?, objective?, victory?}[] | budget via `/encounter` |
| `hooks` | string[] | **≥3** |
| `consequences` | {ifPcs, then}[] | cascading tree |
| `reward_loot` | {items[], nonItem[], budget_by_level} | see `/item-card` (production plan) |

The **secret** fields (`secret`, `secrets_and_clues`) are DM-view: they do not end up in the
deliverables for the players.

---

<a id="italiano"></a>

# Formato avventura (schema_version 1.0)

Un'avventura è una **struttura dati** in `adventure.json`, validata da regole
(`lib/adventure/validate.js`). La vista umana (`adventure.md`) è derivata.

## Campi
| Campo | Tipo | Regola |
|-------|------|--------|
| `title` | string | obbligatorio |
| `strong_start` | string | obbligatorio, 1 scena (max 3 frasi) |
| `secrets_and_clues` | string[] | **≥8** |
| `fantastic_locations` | {name, sensory[]}[] | **3–5**, ogni `sensory` **≥3** |
| `npcs` | obj[] | ogni PNG: `name, role, voice, wants, secret` (+ `faction?`) |
| `monsters` | {id, role}[] | `id` dal compendio |
| `encounters` | {name, monsters[], terrain?, objective?, victory?}[] | budget via `/encounter` |
| `hooks` | string[] | **≥3** |
| `consequences` | {ifPcs, then}[] | albero a cascata |
| `reward_loot` | {items[], nonItem[], budget_by_level} | vedi `/item-card` (piano produzione) |

I campi **segreti** (`secret`, `secrets_and_clues`) sono vista-DM: non finiscono nei
deliverable per i giocatori.

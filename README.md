# TTRPG Studio

[![CI](https://github.com/Bisbi/ttrpg-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/Bisbi/ttrpg-studio/actions/workflows/ci.yml)

**[English](#ttrpg-studio)** · **[Italiano](#ttrpg-studio-it)**

A **Claude Code plugin** for creating and producing **5E-compatible** game material:
procedurally-generated worldbuilding, table-ready adventures, item cards, DM screens, battle maps, and artwork with local-first rendering.

> Not affiliated with or endorsed by any publisher. It does not distribute game
> content — it reads your data from a folder that you provide. See `DISCLAIMER.md`.

---

## ✨ Features

- **Deterministic Worldbuilding** — semantic consistency checking via `lore-keeper`, collision handling policies
- **Adventure Design** — validated structure (≥8 secrets, sensory locations, story hooks, NPCs with voice)
- **Encounter Balancing** — 5E-compatible XP budgets & difficulty scaling  
- **One-Page Session Prep** — ready-to-print DM cheat sheets
- **Procedural Battle Maps** — SVG dungeon generation (Tier 1) + painted scenes (Tier 2)
- **Voice Profiling** — inject your personal writing style into all generated content
- **Production-Ready Output** — PNG/PDF rendering via Playwright + zero-dependency HTML composition
- **Multilingual** — Italian (`it`) and English (`en`) with per-field fallback

---

## 📦 Installation

### Prerequisites
- Node.js 18+ with npm
- Playwright for HTML→PNG/PDF rendering

### Setup

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/Bisbi/ttrpg-studio.git
   cd ttrpg-studio
   npm install
   ```

2. **Install Playwright browser (required for rendering):**
   ```bash
   npx playwright install chromium
   ```

3. **Configure environment variables** (see [Configuration](#configuration) below)

4. **Try the quickstart with included homebrew data:**
   ```bash
   GAME_DATA_PATH=./examples/compendium-homebrew GAME_DATA_LANG=en
   ```

---

## 🚀 Quickstart (5 minutes)

The plugin ships with a small **homebrew** dataset in `examples/compendium-homebrew/`
so you can try it immediately without external data:

```bash
GAME_DATA_PATH=./examples/compendium-homebrew GAME_DATA_LANG=en
```

### Quick Example: Create Your First Adventure

```bash
export SETTING_PATH=./my-setting
export ADVENTURE_PATH=./my-adventures
export OUTPUT_DIR=./output
export GAME_DATA_PATH=./examples/compendium-homebrew

# Create a new setting with your worldbuilding canon
/new-setting "The Shattered Realms"

# Generate NPCs, regions, factions consistent with your setting
/gen-npc
/gen-region
/lore-check  # validate semantic consistency

# Create an adventure for your party
/new-adventure "The Goblin King's Vault"

# Balance encounters for your party composition
/encounter 3,3,3,4 hard

# Generate a one-page DM sheet for the table
/session-prep the-goblin-kings-vault

# Render printable DM screen
/dm-screen --pdf
```

---

## ⚙️ Configuration

| Env | Meaning |
|-----|---------|
| `GAME_DATA_PATH` | **Required.** Folder of your compendium (see `mcp/compendium-reader/schema/SCHEMA.md`) |
| `GAME_DATA_LANG` | Language: `it` or `en` (per-field fallback `it→en`). Default: `en` |
| `SETTING_PATH` | Folder of your Setting Bible (worldbuilding canon) |
| `ADVENTURE_PATH` | Folder of your adventures |
| `OUTPUT_DIR` | Where generated PNG/PDF files are written |
| `IMAGE_API_URL` / `IMAGE_API_KEY` | Art provider via API (recommended; e.g., Replicate, Together AI) |
| `IMAGE_GEN_URL` | Browser-based art provider (best-effort, can be fragile) |
| `VOICE_PATH` | Path to your local voice profile; fallback: `SETTING_PATH/voice-profile.md` |
| `TTRPG_DEBUG` | Set to `1` for debug logs on stderr |

### Example `.env` file:
```bash
GAME_DATA_PATH=./data/compendium
GAME_DATA_LANG=en
SETTING_PATH=./data/my-world
ADVENTURE_PATH=./data/adventures
OUTPUT_DIR=./output
IMAGE_API_URL=https://api.replicate.com/v1/predictions
IMAGE_API_KEY=your_key_here
TTRPG_DEBUG=0
```

---

## 🗺️ Worldbuilding

Create a setting and keep it consistent:

```bash
export SETTING_PATH=./setting   # folder of your Setting Bible
```

**Commands:**

- **`/new-setting <name>`** — creates the Setting Bible skeleton.
- **`/gen-region`**, **`/gen-faction`**, **`/gen-deity`**, **`/gen-npc`**, **`/gen-monster`** —
  generate elements consistent with your canon (structured inputs + seed tables).
  Every write supports:
  - `--dry-run` — preview without writing
  - `--collision <policy>` — collision handling: `skip | overwrite | append | error`
- **`/lore-check`** — `lore-keeper` validates the semantic consistency of your canon.

**Tips:**
- Start with `/new-setting` to scaffold your world structure
- Use `/gen-npc --dry-run` to preview without committing
- Run `/lore-check` frequently to catch worldbuilding contradictions early
- Store seed tables in `80-tables/` of your Setting Bible for custom random tables

**Technical:**
The deterministic utilities live in `lib/` (Node ESM, fully tested with vitest).

---

## 📖 Adventures (table-ready)

```bash
export ADVENTURE_PATH=./adventures   # folder of your adventures
```

**Commands:**

- **`/new-adventure "<title>"`** — creates an adventure as a **validated data structure**:
  - ≥8 secrets (hidden hooks)
  - 3–5 sensory locations (descriptions, sounds, smells)
  - ≥3 story hooks (entry points)
  - NPCs with personality + secrets
  
- **`/encounter 3,3,3,4 hard`** — generates encounter proposals for your party:
  - First arg: party levels (e.g., `3,3,3,4`)
  - Second arg: difficulty (`trivial | easy | medium | hard | deadly`)
  - Proposes enemies from the compendium using 5E-compatible XP thresholds

- **`/session-prep <slug>`** — one-page sheet for the table (DM view):
  - All secrets, key NPCs, location descriptions on one page
  - Print-friendly format

- **`/roll <table>`** — roll on a random table:
  - Plugin seed tables, or custom tables in `80-tables/` of your Setting Bible

**Player handouts** (player view with secrets removed) come with the production module.

**Tips:**
- Use `/encounter --dry-run` to preview before committing
- Keep location descriptions **sensory** — what the party sees, hears, smells
- Every NPC should have at least one secret (even minor NPCs)
- `/session-prep` is your table cheat sheet — customize it before printing

---

## 🎨 Production (printable material)

```bash
export OUTPUT_DIR=./output   # where generated PNG/PDF files end up
```

**Commands:**

- **`/item-card`** — generates item card PNG (800×1200):
  - Created from a `reward_loot` entry in your compendium
  - Print-ready with art, description, mechanics
  
- **`/dm-screen [--pdf]`** — DM screen (1920×1080):
  - Generates from an adventure
  - Includes encounter summary, key NPCs, secrets
  - Flag `--pdf` to export as PDF (default: PNG)
  
- **`/handout`** — diegetic player handout:
  - **Player view**: secret fields are automatically removed
  - Print and hand to players at the table

**Technical:**

HTML→PNG/PDF rendering uses **Playwright** (isolated in `render/` package):
- **One-time setup:** `npx playwright install chromium`
- **HTML composition layer:** `lib/` (zero dependencies, tested)
- **Renderer:** isolated in `render/`

**Tips:**
- Generate all DM materials in one session prep pass
- Use PNG for previews, PDF for printing (PDF is more reliable on some printers)
- Test rendering on your printer before the session
- Keep `OUTPUT_DIR` organized: `output/dm-screens/`, `output/handouts/`, etc.

---

## 🎭 Visuals (art and maps)

### Art Provider Setup

Configure **one** of the two art providers:

```bash
# Option A: API provider (recommended)
export IMAGE_API_URL=https://api.replicate.com/v1/predictions
export IMAGE_API_KEY=your_key_here

# Option B: Browser-based (best-effort, can be fragile)
export IMAGE_GEN_URL=http://localhost:7860
```

### Commands

- **`/gen-art "<description>"`** — generates 2:3 character art:
  - For items, monsters, player characters, NPCs (not maps)
  - Browser provider shows a ToS disclaimer on first use
  - Respects your voice profile if configured

- **`/battle-map [--tier 1|2]`** — procedural battle maps:
  - **Tier 1** (default): SVG line-art dungeon + grid
    - Deterministic (same seed = same dungeon)
    - Also exports JSON for further editing
  - **Tier 2**: painted scene + grid overlay
    - Uses art provider for background

**Technical:**

Maps are **zero-dependency** (SVG generated in Node, grid added in post-processing).
PNG rasterization reuses the Playwright renderer in `render/`.

**Tips:**
- Use Tier 1 maps for speed (no art API calls needed)
- Tier 2 maps are gorgeous but slower — generate them in advance
- Export Tier 1 SVG to JSON, edit in your favorite vector editor, then re-render
- Test your art provider before a session — some APIs have rate limits

---

## 🎤 Voice and Style

The plugin writes creative prose in a **concrete and vivid** way, not generic.
Give it **your own voice**:

- **`/voice-profile`** — builds your voice profile from your own texts:
  - Walks you through a guided template
  - Extracts your style (word choice, sentence structure, tone)

- **File location:** `SETTING_PATH/voice-profile.md` or `VOICE_PATH`
  - **Local and gitignored** — never ends up in the repo
  - Creative skills apply it automatically if present

**Philosophy:**

The plugin's style guide is **neutral**: the goal is human, concrete prose,
not "evading AI detectors". Your voice profile should reflect your authentic writing.

**Tips:**
- Build your voice profile from your favorite campaign notes or published work
- Keep it 200–500 words of your actual prose
- Update it as your style evolves
- The profile is **not** a system prompt — it's a concrete reference for consistency

---

## 📁 Project Structure

```
ttrpg-studio/
├── lib/                          # Deterministic utilities (worldbuilding, encounters, HTML composition)
│   ├── worldbuilding/            # Lore generation, consistency checking
│   ├── adventures/               # Adventure structure validation, encounter scaling
│   ├── render/                   # HTML→PNG/PDF (zero dependencies, fully tested)
│   └── seed-tables/              # Procedural generation tables
├── mcp/                          # Model Context Protocol modules
│   ├── compendium-reader/        # Load your D&D compendium
│   ├── lore-keeper/              # Semantic consistency validation
│   └── schema/                   # SCHEMA.md for compendium structure
├── render/                       # Playwright renderer (isolated from core)
│   ├── browser/                  # Chromium setup
│   └── compose/                  # HTML template composition
├── examples/
│   └── compendium-homebrew/      # Sample D&D dataset (ready to use)
├── 80-tables/                    # Procedural generation seed tables
├── LICENSE                       # Apache-2.0 (code)
├── LICENSE-CONTENT              # CC BY 4.0 (content/assets)
├── DISCLAIMER.md                # Legal notice (not affiliated with WotC, Paizo, etc.)
└── package.json
```

---

## 🧪 Development

### Run Tests

```bash
npm run test          # Run all tests (vitest)
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

### Linting & Formatting

```bash
npm run lint          # Check code style
npm run format        # Auto-format code
```

### Build Renderer

```bash
cd render
npm run build
```

### Debug Mode

Set `TTRPG_DEBUG=1` to see detailed logs:

```bash
TTRPG_DEBUG=1 /new-adventure "Debug Test"
```

---

## ⚠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| `ENOENT: no such file` on adventure creation | Check `ADVENTURE_PATH` exists and is writable. Create it with `mkdir -p ./adventures` |
| PNG/PDF rendering fails | Run `npx playwright install chromium` once |
| Art generation returns errors | Verify `IMAGE_API_KEY` is valid; try browser fallback (`IMAGE_GEN_URL`) |
| Maps export as blank PNGs | Check `OUTPUT_DIR` exists; try Tier 1 (SVG) first to isolate art provider issues |
| `lore-check` reports many contradictions | Expected for new settings. Use `--dry-run` to preview fixes before committing |
| Plugin slow on large compendiums | Index your compendium in `GAME_DATA_PATH` — see `mcp/compendium-reader/schema/SCHEMA.md` |
| Voice profile not applied | Verify file is at `SETTING_PATH/voice-profile.md` or `VOICE_PATH`; check `TTRPG_DEBUG=1` logs |
| Different output on same input | You likely have randomness enabled. Dungeons with `--tier 1` use seeds for determinism. Check for inline randomness in templates. |

---

## 📋 Status & Known Limitations

| Feature | Status | Notes |
|---------|--------|-------|
| Worldbuilding generation | ✅ Ready | With lore validation |
| Adventure design | ✅ Ready | Validated structure |
| DM screens & handouts | ✅ Ready | Print-friendly |
| Procedural SVG maps | ✅ Ready | Deterministic, exports JSON |
| Encounter scaling | ✅ Ready | 5E XP thresholds |
| API-based art generation | ✅ Ready | Requires valid API key |
| Browser art generation | ⚠️ Fragile | Best-effort; rate-limited by browser |
| Multilingual support | ✅ Ready | Italian & English with fallback |
| Voice profiling | ✅ Ready | Extracts style from your texts |

---

## ⚖️ License & Legal

**Code:** **Apache-2.0** (`LICENSE`) — free to use, modify, and distribute.

**Content/Assets:** **CC BY 4.0** (`LICENSE-CONTENT`) — share-alike with attribution.

### Important Disclaimer

**Not affiliated with or endorsed by Wizards of the Coast, Paizo, or any game publisher.**

This plugin:
- ✅ Does **not** distribute game content
- ✅ Reads your **homebrew** compendium from a folder you provide
- ✅ Generates original content based on your data
- ⚠️ Assumes you have rights to use your source material

See `DISCLAIMER.md` for full legal details.

---

## 💡 Tips & Best Practices

### Worldbuilding
- Start small: one region, one faction, 3–5 NPCs
- Use `/gen-npc --dry-run` to preview 5 options before committing one
- Run `/lore-check` weekly to catch drift early
- Keep your Setting Bible in version control (git) — you'll want to revert bad rolls

### Adventures
- Write adventures in a **template**, not freeform. Secrets must be written down.
- Use `/encounter` to balance on the fly during prep — adjust party level if needed
- Generate `/session-prep` the day before the session (not during)
- Print DM screens and handouts at 100% scale on letter-size paper

### Art & Maps
- Test art API rate limits before a session — cache results if needed
- Tier 1 maps are **fast** and deterministic — use them for on-the-fly encounters
- Tier 2 maps take longer but look better — generate them in advance
- If browser art is slow, consider a local Stable Diffusion setup

### Voice
- Your voice profile is **optional** but highly recommended for immersion
- Update it as your campaign evolves
- Share voice profiles with co-DMs for consistency

### Performance
- Index large compendiums: `mcp/compendium-reader/schema/SCHEMA.md` shows how
- Cache rendered PNGs — don't re-render the same material twice
- Use `OUTPUT_DIR` to organize artifacts by adventure/session

---

---

# TTRPG Studio (IT)

**[English](#ttrpg-studio)** · **[Italiano](#ttrpg-studio-it)**

Un **plugin Claude Code** per creare e produrre materiale di gioco **compatibile con la Quinta Edizione (5E)**: 
worldbuilding procedurale, avventure per il tavolo, carte oggetto, schermi del master, mappe di battaglia e artwork
con rendering locale-first.

> Non affiliato né approvato da alcun editore. Non distribuisce contenuti di gioco — leggi i tuoi dati da una cartella
> che fornisci tu. Vedi `DISCLAIMER.md`.

---

## ✨ Caratteristiche

- **Worldbuilding Deterministico** — validazione della coerenza semantica via `lore-keeper`, gestione collisioni
- **Creazione Avventure** — struttura validata (≥8 segreti, luoghi sensoriali, ganci narrativi, PNG con voce)
- **Bilanciamento Scontri** — budget XP compatibile 5E e scaling difficoltà
- **Scheda Sessione One-Page** — pronto per stampare e portare al tavolo
- **Mappe di Battaglia Procedurali** — generazione SVG dungeon (Tier 1) + scene dipinte (Tier 2)
- **Profilo Vocale** — inietta il tuo stile personale in tutto il contenuto generato
- **Output Pronto per la Stampa** — rendering PNG/PDF via Playwright + composizione HTML a zero dipendenze
- **Multilingue** — Italiano (`it`) e Inglese (`en`) con fallback per-campo

---

## 📦 Installazione

### Prerequisiti
- Node.js 18+ con npm
- Playwright per rendering HTML→PNG/PDF

### Setup

1. **Clona e installa dipendenze:**
   ```bash
   git clone https://github.com/Bisbi/ttrpg-studio.git
   cd ttrpg-studio
   npm install
   ```

2. **Installa il browser Playwright (richiesto per il rendering):**
   ```bash
   npx playwright install chromium
   ```

3. **Configura le variabili d'ambiente** (vedi [Configurazione](#configurazione) sotto)

4. **Prova il quickstart con i dati homebrew inclusi:**
   ```bash
   GAME_DATA_PATH=./examples/compendium-homebrew GAME_DATA_LANG=it
   ```

---

## 🚀 Quickstart (5 minuti)

Il plugin include un piccolo dataset **homebrew** in `examples/compendium-homebrew/`
per provarlo subito senza dati esterni:

```bash
GAME_DATA_PATH=./examples/compendium-homebrew GAME_DATA_LANG=it
```

### Esempio Veloce: Crea la Tua Prima Avventura

```bash
export SETTING_PATH=./il-mio-mondo
export ADVENTURE_PATH=./le-mie-avventure
export OUTPUT_DIR=./output
export GAME_DATA_PATH=./examples/compendium-homebrew

# Crea un nuovo mondo con il tuo worldbuilding
/new-setting "I Regni Distrutti"

# Genera PNG, regioni, fazioni coerenti con il tuo mondo
/gen-npc
/gen-region
/lore-check  # valida la coerenza semantica

# Crea un'avventura per il tuo party
/new-adventure "La Volta del Re Goblin"

# Bilancia gli scontri per la composizione del tuo party
/encounter 3,3,3,4 hard

# Genera una scheda one-page per il tavolo
/session-prep la-volta-del-re-goblin

# Renderizza lo schermo del master stampabile
/dm-screen --pdf
```

---

## ⚙️ Configurazione

| Env | Significato |
|-----|-------------|
| `GAME_DATA_PATH` | **Richiesto.** Cartella del tuo compendio (vedi `mcp/compendium-reader/schema/SCHEMA.md`) |
| `GAME_DATA_LANG` | Lingua: `it` o `en` (fallback per-campo `it→en`). Default: `en` |
| `SETTING_PATH` | Cartella della tua Setting Bible (canon worldbuilding) |
| `ADVENTURE_PATH` | Cartella delle tue avventure |
| `OUTPUT_DIR` | Dove finiscono i file PNG/PDF generati |
| `IMAGE_API_URL` / `IMAGE_API_KEY` | Provider arte via API (consigliato; es. Replicate, Together AI) |
| `IMAGE_GEN_URL` | Provider arte via browser (best-effort, può essere fragile) |
| `VOICE_PATH` | Percorso del tuo profilo voce locale; fallback: `SETTING_PATH/voice-profile.md` |
| `TTRPG_DEBUG` | Imposta a `1` per log di debug su stderr |

### Esempio file `.env`:
```bash
GAME_DATA_PATH=./data/compendio
GAME_DATA_LANG=it
SETTING_PATH=./data/il-mio-mondo
ADVENTURE_PATH=./data/avventure
OUTPUT_DIR=./output
IMAGE_API_URL=https://api.replicate.com/v1/predictions
IMAGE_API_KEY=la-tua-chiave
TTRPG_DEBUG=0
```

---

## 🗺️ Worldbuilding

Crea un'ambientazione e mantienila coerente:

```bash
export SETTING_PATH=./mondo   # cartella della tua Setting Bible
```

**Comandi:**

- **`/new-setting <nome>`** — crea lo scheletro della Setting Bible.
- **`/gen-region`**, **`/gen-faction`**, **`/gen-deity`**, **`/gen-npc`**, **`/gen-monster`** —
  generano elementi coerenti col canon (input strutturati + seed table).
  Ogni comando supporta:
  - `--dry-run` — anteprima senza scrivere
  - `--collision <policy>` — gestione collisioni: `skip | overwrite | append | error`
- **`/lore-check`** — `lore-keeper` valida la coerenza semantica del canon.

**Consigli:**
- Inizia con `/new-setting` per creare la struttura del tuo mondo
- Usa `/gen-npc --dry-run` per vedere le opzioni senza commitare
- Esegui `/lore-check` frequentemente per rilevare contraddizioni presto
- Memorizza seed table in `80-tables/` della tua Setting Bible per custom random table

**Tecnico:**
Le utility deterministiche stanno in `lib/` (Node ESM, completamente testate con vitest).

---

## 📖 Avventure (tavolo pronto)

```bash
export ADVENTURE_PATH=./avventure   # cartella delle tue avventure
```

**Comandi:**

- **`/new-adventure "<titolo>"`** — crea un'avventura come **struttura dati validata**:
  - ≥8 segreti (ganci nascosti)
  - 3–5 luoghi sensoriali (descrizioni, suoni, odori)
  - ≥3 ganci narrativi (punti di ingresso)
  - PNG con personalità + segreti
  
- **`/encounter 3,3,3,4 hard`** — genera proposte di scontri per il tuo party:
  - Primo arg: livelli del party (es. `3,3,3,4`)
  - Secondo arg: difficoltà (`trivial | easy | medium | hard | deadly`)
  - Propone nemici dal compendio usando soglie XP 5E-compatible

- **`/session-prep <slug>`** — scheda one-page per il tavolo (vista DM):
  - Tutti i segreti, PNG chiave, descrizioni location su una pagina
  - Formato adatto alla stampa

- **`/roll <tabella>`** — tira su una random table:
  - Seed table del plugin, o custom table in `80-tables/` della tua Setting Bible

**Handout giocatori** (vista giocatore con segreti rimossi) arrivano col modulo di produzione.

**Consigli:**
- Usa `/encounter --dry-run` per vedere le opzioni prima di committare
- Tieni descrizioni location **sensoriali** — cosa vede, sente, odora il party
- Ogni PNG deve avere almeno un segreto (anche PNG minori)
- `/session-prep` è il tuo foglio cheat per il tavolo — personalizzalo prima di stampare

---

## 🎨 Produzione (materiale stampabile)

```bash
export OUTPUT_DIR=./output   # dove finiscono PNG/PDF generati
```

**Comandi:**

- **`/item-card`** — genera carta oggetto PNG (800×1200):
  - Creata da una voce `reward_loot` nel tuo compendio
  - Pronta per stampare con arte, descrizione, meccaniche
  
- **`/dm-screen [--pdf]`** — Schermo del master (1920×1080):
  - Generato da un'avventura
  - Include riassunto scontri, PNG chiave, segreti
  - Flag `--pdf` per esportare come PDF (default: PNG)
  
- **`/handout`** — handout diegetico per giocatori:
  - **Vista giocatore**: campi segreti rimossi automaticamente
  - Stampa e dai ai giocatori al tavolo

**Tecnico:**

Rendering HTML→PNG/PDF usa **Playwright** (isolato in package `render/`):
- **Setup una volta:** `npx playwright install chromium`
- **Layer composizione HTML:** `lib/` (zero dipendenze, testato)
- **Renderer:** isolato in `render/`

**Consigli:**
- Genera tutti i materiali DM in una sessione di prep
- Usa PNG per anteprime, PDF per stampe (PDF più affidabile su alcuni stampanti)
- Testa il rendering sulla tua stampante prima della sessione
- Organizza `OUTPUT_DIR`: `output/schermi-dm/`, `output/handout/`, etc.

---

## 🎭 Visuals (arte e mappe)

### Setup Provider Arte

Configura **uno** dei due provider arte:

```bash
# Opzione A: Provider API (consigliato)
export IMAGE_API_URL=https://api.replicate.com/v1/predictions
export IMAGE_API_KEY=la-tua-chiave

# Opzione B: Browser-based (best-effort, può essere fragile)
export IMAGE_GEN_URL=http://localhost:7860
```

### Comandi

- **`/gen-art "<descrizione>"`** — genera arte personaggio 2:3:
  - Per oggetti, mostri, PNG, PNG (non mappe)
  - Browser provider mostra disclaimer ToS al primo uso
  - Rispetta il tuo profilo vocale se configurato

- **`/battle-map [--tier 1|2]`** — mappe di battaglia procedurali:
  - **Tier 1** (default): dungeon SVG line-art + griglia
    - Deterministico (stesso seed = stesso dungeon)
    - Esporta anche JSON per ulteriore editing
  - **Tier 2**: scena dipinta + griglia overlay
    - Usa provider arte per sfondo

**Tecnico:**

Le mappe sono **a zero dipendenze** (SVG generato in Node, griglia aggiunta in post-processing).
Rasterizzazione PNG riusa il renderer Playwright di `render/`.

**Consigli:**
- Usa mappe Tier 1 per velocità (nessuna chiamata API arte necessaria)
- Mappe Tier 2 sono bellissime ma più lente — generale in anticipo
- Esporta SVG Tier 1 a JSON, modifica nel tuo editor vettoriale preferito, poi ri-renderizza
- Testa i limiti di rate dell'API arte prima di una sessione

---

## 🎤 Voce e Stile

Il plugin scrive la prosa creativa in modo **concreto e vivo**, non generico.
Dagli **la tua voce**:

- **`/voice-profile`** — costruisce il tuo profilo vocale dai tuoi testi:
  - Ti guida attraverso un template guidato
  - Estrae il tuo stile (scelta parole, struttura frasi, tono)

- **Ubicazione file:** `SETTING_PATH/voice-profile.md` o `VOICE_PATH`
  - **Locale e gitignored** — non finisce mai nel repo
  - Le skill creative lo applicano automaticamente se presente

**Filosofia:**

La guida di stile del plugin è **neutra**: l'obiettivo è prosa umana e concreta,
non "eludere rilevatori AI". Il tuo profilo vocale dovrebbe riflettere la tua scrittura autentica.

**Consigli:**
- Costruisci il tuo profilo vocale dai tuoi appunti di campagna preferiti o lavoro pubblicato
- Tienilo tra 200–500 parole della tua prosa effettiva
- Aggiornalo mentre il tuo stile evolve
- Il profilo **non** è un system prompt — è un reference concreto per la coerenza

---

## 📁 Struttura del Progetto

```
ttrpg-studio/
├── lib/                          # Utility deterministiche (worldbuilding, scontri, composizione HTML)
│   ├── worldbuilding/            # Generazione lore, validazione coerenza
│   ├── adventures/               # Validazione struttura avventura, scaling scontri
│   ├── render/                   # HTML→PNG/PDF (zero dipendenze, completamente testato)
│   └── seed-tables/              # Tabelle generazione procedurale
├── mcp/                          # Moduli Model Context Protocol
│   ├── compendium-reader/        # Carica il tuo compendio D&D
│   ├── lore-keeper/              # Validazione coerenza semantica
│   └── schema/                   # SCHEMA.md per struttura compendio
├── render/                       # Renderer Playwright (isolato dal core)
│   ├── browser/                  # Setup Chromium
│   └── compose/                  # Composizione template HTML
├── examples/
│   └── compendium-homebrew/      # Dataset D&D campione (pronto all'uso)
├── 80-tables/                    # Seed table generazione procedurale
├── LICENSE                       # Apache-2.0 (codice)
├── LICENSE-CONTENT              # CC BY 4.0 (contenuti/asset)
├── DISCLAIMER.md                # Avviso legale (non affiliato a WotC, Paizo, etc.)
└── package.json
```

---

## 🧪 Sviluppo

### Esegui Test

```bash
npm run test          # Esegui tutti i test (vitest)
npm run test:watch   # Modalità watch
npm run test:coverage # Rapporto coverage
```

### Linting e Formattazione

```bash
npm run lint          # Controlla stile codice
npm run format        # Auto-formatta codice
```

### Build Renderer

```bash
cd render
npm run build
```

### Modalità Debug

Imposta `TTRPG_DEBUG=1` per log dettagliati:

```bash
TTRPG_DEBUG=1 /new-adventure "Test Debug"
```

---

## ⚠️ Risoluzione Problemi

| Problema | Soluzione |
|----------|----------|
| `ENOENT: no such file` su creazione avventura | Controlla che `ADVENTURE_PATH` esista e sia scrivibile. Crealo con `mkdir -p ./avventure` |
| Rendering PNG/PDF fallisce | Esegui `npx playwright install chromium` una volta |
| Generazione arte ritorna errori | Verifica che `IMAGE_API_KEY` sia valido; prova fallback browser (`IMAGE_GEN_URL`) |
| Mappe esportano come PNG vuoti | Controlla che `OUTPUT_DIR` esista; prova Tier 1 (SVG) prima per isolare problemi provider arte |
| `lore-check` riporta molte contraddizioni | Atteso per nuovi setting. Usa `--dry-run` per anteprima fix prima di committare |
| Plugin lento su compendi grandi | Indicizza il tuo compendio in `GAME_DATA_PATH` — vedi `mcp/compendium-reader/schema/SCHEMA.md` |
| Profilo vocale non applicato | Verifica che il file sia in `SETTING_PATH/voice-profile.md` o `VOICE_PATH`; controlla log `TTRPG_DEBUG=1` |
| Output diverso su stesso input | Probabilmente hai randomness abilitato. Dungeon con `--tier 1` usano seed per determinismo. Controlla randomness inline nei template. |

---

## 📋 Stato e Limitazioni Conosciute

| Funzionalità | Stato | Note |
|--------------|-------|-------|
| Generazione worldbuilding | ✅ Pronto | Con validazione lore |
| Design avventure | ✅ Pronto | Struttura validata |
| Schermi DM e handout | ✅ Pronto | Pronto per stampa |
| Mappe SVG procedurali | ✅ Pronto | Deterministiche, esportano JSON |
| Scaling scontri | ✅ Pronto | Soglie XP 5E |
| Generazione arte API-based | ✅ Pronto | Richiede chiave API valida |
| Generazione arte browser | ⚠️ Fragile | Best-effort; rate-limited dal browser |
| Supporto multilingue | ✅ Pronto | Italiano & Inglese con fallback |
| Profilo vocale | ✅ Pronto | Estrae stile dai tuoi testi |

---

## ⚖️ Licenza e Aspetti Legali

**Codice:** **Apache-2.0** (`LICENSE`) — libero di usare, modificare e distribuire.

**Contenuti/Asset:** **CC BY 4.0** (`LICENSE-CONTENT`) — share-alike con attribuzione.

### Avviso Importante

**Non affiliato né approvato da Wizards of the Coast, Paizo, o alcun editore di giochi.**

Questo plugin:
- ✅ **Non** distribuisce contenuti di gioco
- ✅ Legge il tuo compendio **homebrew** da una cartella che fornisci
- ✅ Genera contenuto originale basato sui tuoi dati
- ⚠️ Assume che tu abbia diritti di usare il materiale sorgente

Vedi `DISCLAIMER.md` per dettagli legali completi.

---

## 💡 Consigli e Best Practice

### Worldbuilding
- Inizia piccolo: una regione, una fazione, 3–5 PNG
- Usa `/gen-npc --dry-run` per anteprima 5 opzioni prima di committare una
- Esegui `/lore-check` settimanalmente per rilevare drift presto
- Tieni la tua Setting Bible in version control (git) — vorrai revertire brutti roll

### Avventure
- Scrivi avventure da un **template**, non freeform. I segreti devono essere scritti.
- Usa `/encounter` per bilanciare al volo durante prep — regola livello party se necessario
- Genera `/session-prep` il giorno prima della sessione (non durante)
- Stampa schermi DM e handout al 100% su carta letter

### Arte e Mappe
- Testa rate limit API arte prima di una sessione — cachea risultati se necessario
- Mappe Tier 1 sono **veloci** e deterministiche — usale per scontri improvvisati
- Mappe Tier 2 sono più belle ma lente — generale in anticipo
- Se arte browser è lenta, considera una configurazione locale Stable Diffusion

### Voce
- Il tuo profilo vocale è **opzionale** ma altamente consigliato per immersione
- Aggiornalo mentre la tua campagna evolve
- Condividi profili vocali con co-DM per coerenza

### Performance
- Indicizza compendi grandi: `mcp/compendium-reader/schema/SCHEMA.md` mostra come
- Cachea PNG renderizzati — non ri-renderizzare lo stesso materiale due volte
- Usa `OUTPUT_DIR` per organizzare artefatti per avventura/sessione

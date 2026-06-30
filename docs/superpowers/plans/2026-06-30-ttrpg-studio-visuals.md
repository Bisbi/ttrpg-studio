# TTRPG Studio — Visuals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generare gli asset visivi: arte per oggetti/mostri/PG/PNG (`/gen-art`, provider plug-in) e mappe da battaglia a livelli (`/battle-map`: Tier 1 procedurale SVG + griglia, Tier 2 arte via provider), riusando il renderer Playwright esistente.

**Architecture:** `image-gen` espone `ImageProvider { generate(prompt, opts) → buffer }` con due implementazioni dietro selezione da env: **(a) API-based** (default, via `fetch` globale di Node 20 verso `IMAGE_API_URL`/`IMAGE_API_KEY`, testabile con fetch iniettato) e **(b) browser best-effort** (pilota `IMAGE_GEN_URL` riusando il package `render/`; dichiarata fragile, non in CI, con disclaimer ToS al primo uso). `battle-map` Tier 1 è **zero-dipendenze**: un generatore procedurale produce un modello mappa, reso in **SVG line-art** B/N; `add-grid` sovrappone la griglia come overlay SVG; la rasterizzazione PNG passa per il renderer Playwright già presente (l'SVG è incapsulato in un `htmlDocument`). Tier 2 prende un'immagine dall'`ImageProvider` e la grida con lo stesso overlay. Nessuna dipendenza nativa nuova.

**Tech Stack:** Node.js ≥20 (ESM, `fetch` globale), `vitest`. Riusa `lib/render/html.js`, `lib/common/{output,slug,logger,errors}.js` e il package `render/`. Nessuna nuova dipendenza runtime. Apache-2.0 (codice) + CC-BY-4.0 (template).

## Global Constraints

- **Zero contenuti coperti da copyright**; **zero segreti** (le chiavi solo via env, mai committate); **zero marchi di terze parti** in codice, nomi tool/comandi, documentazione. "5E-compatible", mai "D&D".
- **Provider configurabili solo via env** (`IMAGE_API_URL`, `IMAGE_API_KEY`, `IMAGE_GEN_URL`): nessun URL/endpoint hardcoded, nessun default a un servizio nominato.
- **Browser best-effort:** dichiarata "fragile, non garantita, non testata in CI"; disclaimer ToS + responsabilità licenze al primo uso; attesa render come condizione verificabile (selettore), non sleep cieco; timeout/retry espliciti (riusa il renderer).
- **Cross-platform:** solo `node:path`; nessuna assunzione Windows; nessuna dipendenza Python (`add-grid` in Node/SVG, niente `add_grid.py`).
- **Line-ending LF**; entry point con shebang usano `pathToFileURL` per `isMain`.
- **Scrittura atomica** (`writeFileSafe`), output con naming no-collisione (`resolveOutputPath`); log su **stderr**.
- Node ESM: `"type": "module"`.

---

### Task 1: `lib/image/select.js` + `lib/image/disclaimer.js`

**Files:**
- Create: `lib/image/select.js`
- Create: `lib/image/disclaimer.js`
- Test: `lib/test/image-select.test.js`

**Interfaces:**
- Consumes: niente.
- Produces:
  - `selectProvider(env) → "api" | "browser" | null` — `"api"` se `IMAGE_API_URL` è impostata; altrimenti `"browser"` se `IMAGE_GEN_URL`; altrimenti `null`.
  - `imageGenDisclaimer() → string` — avviso (ToS del servizio + licenze dell'output a carico dell'utente), per il provider browser.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/image-select.test.js`:
```js
import { describe, it, expect } from "vitest";
import { selectProvider } from "../image/select.js";
import { imageGenDisclaimer } from "../image/disclaimer.js";

describe("selectProvider", () => {
  it("api se IMAGE_API_URL", () => {
    expect(selectProvider({ IMAGE_API_URL: "https://x" })).toBe("api");
  });
  it("browser se solo IMAGE_GEN_URL", () => {
    expect(selectProvider({ IMAGE_GEN_URL: "https://y" })).toBe("browser");
  });
  it("api ha priorità su browser", () => {
    expect(selectProvider({ IMAGE_API_URL: "https://x", IMAGE_GEN_URL: "https://y" })).toBe("api");
  });
  it("null se nessuna env", () => {
    expect(selectProvider({})).toBe(null);
  });
});

describe("imageGenDisclaimer", () => {
  it("cita ToS e licenze", () => {
    const d = imageGenDisclaimer();
    expect(d).toMatch(/Termini di Servizio|ToS/i);
    expect(d).toMatch(/licenz/i);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/image-select.test.js`
Expected: FAIL.

- [ ] **Step 3: Implementare `lib/image/select.js`**

```js
export function selectProvider(env = {}) {
  if (env.IMAGE_API_URL) return "api";
  if (env.IMAGE_GEN_URL) return "browser";
  return null;
}
```

- [ ] **Step 4: Implementare `lib/image/disclaimer.js`**

```js
export function imageGenDisclaimer() {
  return [
    "[image-gen] Provider browser (best-effort): stai automatizzando un servizio web di terze parti.",
    "Sei responsabile del rispetto dei suoi Termini di Servizio (ToS) e delle licenze dell'output generato.",
    "Questa modalità è fragile e non garantita. Per un flusso affidabile usa un provider API (IMAGE_API_URL).",
  ].join("\n");
}
```

- [ ] **Step 5: Eseguire i test e verificare il successo**

Run: `cd lib && npx vitest run test/image-select.test.js`
Expected: PASS (5 test).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -s -m "feat(image): selectProvider + disclaimer ToS"
```

---

### Task 2: `lib/image/api-provider.js` — provider API (fetch)

**Files:**
- Create: `lib/image/api-provider.js`
- Test: `lib/test/image-api.test.js`

**Interfaces:**
- Consumes: `ToolError`, `CODES` da `lib/common/errors.js`.
- Produces: `apiGenerate({ prompt, url, key, size = "1024x1536" }, { fetchImpl } = {}) → Promise<Buffer>`. POST JSON `{prompt,size}` a `url` con header `Authorization: Bearer <key>` (se presente). Risposta: estrae base64 da `b64_json` (top-level o `data[0].b64_json`) → `Buffer`. Errore uniforme su `!ok` o formato non riconosciuto.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/image-api.test.js`:
```js
import { describe, it, expect } from "vitest";
import { apiGenerate } from "../image/api-provider.js";
import { ToolError } from "../common/errors.js";

function fetchOk(json) {
  return async () => ({ ok: true, status: 200, json: async () => json });
}

describe("apiGenerate", () => {
  it("decodifica b64_json da data[0]", async () => {
    const b64 = Buffer.from("PNGDATA").toString("base64");
    const buf = await apiGenerate(
      { prompt: "spada", url: "https://x", key: "k" },
      { fetchImpl: fetchOk({ data: [{ b64_json: b64 }] }) }
    );
    expect(buf.toString()).toBe("PNGDATA");
  });
  it("accetta b64_json top-level", async () => {
    const b64 = Buffer.from("IMG").toString("base64");
    const buf = await apiGenerate({ prompt: "x", url: "u" }, { fetchImpl: fetchOk({ b64_json: b64 }) });
    expect(buf.toString()).toBe("IMG");
  });
  it("errore su risposta non ok", async () => {
    const fetchImpl = async () => ({ ok: false, status: 500, json: async () => ({}) });
    await expect(apiGenerate({ prompt: "x", url: "u" }, { fetchImpl })).rejects.toThrow(ToolError);
  });
  it("errore su formato non riconosciuto", async () => {
    await expect(apiGenerate({ prompt: "x", url: "u" }, { fetchImpl: fetchOk({ nope: 1 }) })).rejects.toThrow(ToolError);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/image-api.test.js`
Expected: FAIL.

- [ ] **Step 3: Implementare `lib/image/api-provider.js`**

```js
import { ToolError, CODES } from "../common/errors.js";

export async function apiGenerate({ prompt, url, key, size = "1024x1536" }, { fetchImpl } = {}) {
  const doFetch = fetchImpl ?? fetch;
  const headers = { "content-type": "application/json" };
  if (key) headers.authorization = `Bearer ${key}`;
  let res;
  try {
    res = await doFetch(url, { method: "POST", headers, body: JSON.stringify({ prompt, size }) });
  } catch (e) {
    throw new ToolError(CODES.INTERNAL, `image-gen API irraggiungibile: ${e.message}`, true);
  }
  if (!res.ok) {
    throw new ToolError(CODES.INTERNAL, `image-gen API ha risposto ${res.status}.`, true);
  }
  const json = await res.json();
  const b64 = json?.b64_json ?? json?.data?.[0]?.b64_json;
  if (!b64) {
    throw new ToolError(CODES.INVALID_INPUT, "Risposta image-gen senza campo b64_json riconoscibile.", false);
  }
  return Buffer.from(b64, "base64");
}
```

- [ ] **Step 4: Eseguire i test e verificare il successo**

Run: `cd lib && npx vitest run test/image-api.test.js`
Expected: PASS (4 test).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "feat(image): apiGenerate (provider API via fetch)"
```

---

### Task 3: `lib/image/browser-provider.js` — best-effort (pilota iniettabile)

**Files:**
- Create: `lib/image/browser-provider.js`
- Test: `lib/test/image-browser.test.js`

**Interfaces:**
- Consumes: niente diretto (il pilot reale, dynamic import del package `render/`, è iniettabile).
- Produces: `browserGenerate({ url, prompt, selector }, { pilot } = {}) → Promise<Buffer>`. Delega a `pilot({url, prompt, selector})` (best-effort). Se `pilot` non è fornito, ne carica uno di default che usa Playwright (via `render/`) — fuori dai test. `ToolError` se `url`/`prompt` mancano.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/image-browser.test.js`:
```js
import { describe, it, expect, vi } from "vitest";
import { browserGenerate } from "../image/browser-provider.js";
import { ToolError } from "../common/errors.js";

describe("browserGenerate", () => {
  it("delega al pilot e ritorna il buffer", async () => {
    const buf = Buffer.from("ART");
    const pilot = vi.fn(async () => buf);
    const out = await browserGenerate({ url: "https://y", prompt: "drago" }, { pilot });
    expect(out).toBe(buf);
    expect(pilot).toHaveBeenCalledWith(expect.objectContaining({ url: "https://y", prompt: "drago" }));
  });
  it("errore se manca url o prompt", async () => {
    await expect(browserGenerate({ prompt: "x" }, { pilot: async () => Buffer.from("") })).rejects.toThrow(ToolError);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/image-browser.test.js`
Expected: FAIL.

- [ ] **Step 3: Implementare `lib/image/browser-provider.js`**

```js
import { ToolError, CODES } from "../common/errors.js";

// Provider best-effort: pilota un generatore web. Fragile, non testato in CI.
// Il `pilot` di default usa Playwright (package render/) e va fornito dal chiamante
// in produzione; nei test è iniettato.
export async function browserGenerate({ url, prompt, selector = "img" }, { pilot } = {}) {
  if (!url || !prompt) {
    throw new ToolError(CODES.INVALID_INPUT, "browser-provider richiede url e prompt.", false);
  }
  if (typeof pilot !== "function") {
    throw new ToolError(CODES.INVALID_INPUT, "Nessun pilot fornito al browser-provider.", false);
  }
  return pilot({ url, prompt, selector });
}
```

- [ ] **Step 4: Eseguire i test e verificare il successo**

Run: `cd lib && npx vitest run test/image-browser.test.js`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "feat(image): browserGenerate best-effort (pilot iniettabile)"
```

---

### Task 4: `bin/gen-art.js` + `/gen-art`

**Files:**
- Create: `lib/bin/gen-art.js`
- Create: `commands/gen-art.md`
- Test: `lib/test/gen-art-cli.test.js`

**Interfaces:**
- Consumes: `selectProvider`, `imageGenDisclaimer`, `apiGenerate`, `browserGenerate`, `resolveOutputPath`, `writeFileSafe`, `slugify`, `createLogger`.
- Produces: `planGenArt(prompt, env) → { provider, outPath }` (testabile, niente rete). Il main seleziona il provider, genera (API o browser con disclaimer), scrive il PNG in `OUTPUT_DIR`. Senza provider → errore con guida (`IMAGE_API_URL` o `IMAGE_GEN_URL`).

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/gen-art-cli.test.js`:
```js
import { describe, it, expect } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { planGenArt } from "../bin/gen-art.js";

describe("planGenArt", () => {
  it("sceglie il provider api e un outPath png", () => {
    const out = mkdtempSync(join(tmpdir(), "out-"));
    const p = planGenArt("spada fiammeggiante", { OUTPUT_DIR: out, IMAGE_API_URL: "https://x" });
    expect(p.provider).toBe("api");
    expect(p.outPath.startsWith(out)).toBe(true);
    expect(p.outPath).toContain("art-spada-fiammeggiante");
    expect(p.outPath.endsWith(".png")).toBe(true);
  });
  it("provider null senza env", () => {
    const out = mkdtempSync(join(tmpdir(), "out-"));
    expect(planGenArt("x", { OUTPUT_DIR: out }).provider).toBe(null);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/gen-art-cli.test.js`
Expected: FAIL.

- [ ] **Step 3: Implementare `lib/bin/gen-art.js`**

```js
#!/usr/bin/env node
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { selectProvider } from "../image/select.js";
import { imageGenDisclaimer } from "../image/disclaimer.js";
import { apiGenerate } from "../image/api-provider.js";
import { browserGenerate } from "../image/browser-provider.js";
import { resolveOutputPath } from "../common/output.js";
import { writeFileSafe } from "../common/fs-atomic.js";
import { slugify } from "../common/slug.js";
import { createLogger } from "../common/logger.js";

export function planGenArt(prompt, env = {}) {
  const provider = selectProvider(env);
  const outDir = env.OUTPUT_DIR ?? join(process.cwd(), "output");
  const base = `art-${slugify(prompt).slice(0, 40) || "arte"}`;
  const outPath = resolveOutputPath(outDir, base, ".png");
  return { provider, outPath };
}

async function readPrompt() {
  const fromArg = process.argv.slice(2).filter((a) => !a.startsWith("--")).join(" ").trim();
  if (fromArg) return fromArg;
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString("utf8").trim();
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const logger = createLogger(process.env);
  try {
    const prompt = await readPrompt();
    if (!prompt) throw new Error("Prompt mancante. Uso: gen-art \"<descrizione>\"");
    const { provider, outPath } = planGenArt(prompt, process.env);
    let buf;
    if (provider === "api") {
      buf = await apiGenerate({ prompt, url: process.env.IMAGE_API_URL, key: process.env.IMAGE_API_KEY });
    } else if (provider === "browser") {
      logger.warn(imageGenDisclaimer());
      const { createRenderer } = await import("../../render/renderer.js");
      const pilot = async ({ url, prompt: p, selector }) => {
        // best-effort: apri la pagina con il prompt come query e cattura l'immagine
        const target = url.includes("{prompt}") ? url.replace("{prompt}", encodeURIComponent(p)) : url;
        return createRenderer().render(`<iframe src="${target}" style="width:100%;height:100%;border:0"></iframe>`,
          { width: 1024, height: 1536, selector: null });
      };
      buf = await browserGenerate({ url: process.env.IMAGE_GEN_URL, prompt, selector: "img" }, { pilot });
    } else {
      throw new Error("Nessun provider: imposta IMAGE_API_URL (consigliato) o IMAGE_GEN_URL.");
    }
    writeFileSafe(outPath, buf, { policy: "error" });
    logger.info(`arte scritta: ${outPath}`);
  } catch (e) {
    logger.error(e.message);
    process.exit(1);
  }
}
```

- [ ] **Step 4: Eseguire il test e verificare il successo**

Run: `cd lib && npx vitest run test/gen-art-cli.test.js`
Expected: PASS (2 test).

- [ ] **Step 5: Creare il comando `/gen-art`**

`commands/gen-art.md`:
```markdown
---
description: Genera arte per oggetti/mostri/PG/PNG (provider API o browser)
argument-hint: "<descrizione>"
---

Genera arte per "$ARGUMENTS" (🗡️ oggetti · 👹 mostri · 🛡️ PG · 🧑 PNG — non mappe).

1. Configura un provider via env: `IMAGE_API_URL` (+ `IMAGE_API_KEY`) per il flusso
   **API affidabile (consigliato)**, oppure `IMAGE_GEN_URL` per il fallback
   **browser best-effort** (fragile; al primo uso compare un disclaimer su ToS e
   licenze dell'output, di cui sei responsabile).
2. Esegui:
   `node ${CLAUDE_PLUGIN_ROOT}/lib/bin/gen-art.js "$ARGUMENTS"`
3. Il PNG (2:3, adatto a `/item-card`) finisce in `OUTPUT_DIR`. L'arte può poi
   alimentare la carta oggetto o i ritratti dei generatori worldbuilding.
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -s -m "feat(image): planGenArt + comando /gen-art"
```

---

### Task 5: `lib/battlemap/generate.js` — generatore procedurale (seeded)

**Files:**
- Create: `lib/battlemap/generate.js`
- Test: `lib/test/battlemap-generate.test.js`

**Interfaces:**
- Consumes: niente.
- Produces: `generateDungeon({ cols = 12, rows = 12, roomAttempts = 10, rng = Math.random }) → { cols, rows, cells, rooms }`. `cells`: matrice `rows×cols` di `0` (muro) / `1` (pavimento). `rooms`: `[{ x, y, w, h }]` non sovrapposte; le stanze sono collegate da corridoi. Deterministico a parità di `rng`.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/battlemap-generate.test.js`:
```js
import { describe, it, expect } from "vitest";
import { generateDungeon } from "../battlemap/generate.js";

// rng deterministico (LCG)
function seeded(seed) {
  let s = seed >>> 0;
  return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 2 ** 32; };
}

describe("generateDungeon", () => {
  it("rispetta le dimensioni e crea almeno una stanza con pavimento", () => {
    const map = generateDungeon({ cols: 12, rows: 10, rng: seeded(1) });
    expect(map.cols).toBe(12);
    expect(map.rows).toBe(10);
    expect(map.cells.length).toBe(10);
    expect(map.cells[0].length).toBe(12);
    expect(map.rooms.length).toBeGreaterThanOrEqual(1);
    const floors = map.cells.flat().filter((c) => c === 1).length;
    expect(floors).toBeGreaterThan(0);
  });
  it("è deterministico a parità di seed", () => {
    const a = generateDungeon({ rng: seeded(42) });
    const b = generateDungeon({ rng: seeded(42) });
    expect(a).toEqual(b);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/battlemap-generate.test.js`
Expected: FAIL.

- [ ] **Step 3: Implementare `lib/battlemap/generate.js`**

```js
function carveRoom(cells, room) {
  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) cells[y][x] = 1;
  }
}
function carveCorridor(cells, ax, ay, bx, by) {
  let x = ax, y = ay;
  while (x !== bx) { cells[y][x] = 1; x += x < bx ? 1 : -1; }
  while (y !== by) { cells[y][x] = 1; y += y < by ? 1 : -1; }
  cells[y][x] = 1;
}
function overlaps(a, b) {
  return a.x < b.x + b.w + 1 && a.x + a.w + 1 > b.x && a.y < b.y + b.h + 1 && a.y + a.h + 1 > b.y;
}

export function generateDungeon({ cols = 12, rows = 12, roomAttempts = 10, rng = Math.random } = {}) {
  const cells = Array.from({ length: rows }, () => Array(cols).fill(0));
  const rooms = [];
  const ri = (min, max) => min + Math.floor(rng() * (max - min + 1));
  for (let i = 0; i < roomAttempts; i++) {
    const w = ri(2, Math.max(2, Math.floor(cols / 3)));
    const h = ri(2, Math.max(2, Math.floor(rows / 3)));
    const x = ri(1, cols - w - 1);
    const y = ri(1, rows - h - 1);
    if (x < 1 || y < 1) continue;
    const room = { x, y, w, h };
    if (rooms.some((r) => overlaps(r, room))) continue;
    carveRoom(cells, room);
    if (rooms.length > 0) {
      const prev = rooms[rooms.length - 1];
      carveCorridor(cells,
        Math.floor(prev.x + prev.w / 2), Math.floor(prev.y + prev.h / 2),
        Math.floor(room.x + room.w / 2), Math.floor(room.y + room.h / 2));
    }
    rooms.push(room);
  }
  return { cols, rows, cells, rooms };
}
```

- [ ] **Step 4: Eseguire i test e verificare il successo**

Run: `cd lib && npx vitest run test/battlemap-generate.test.js`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "feat(battlemap): generateDungeon procedurale (seeded)"
```

---

### Task 6: `lib/battlemap/svg.js` — modello mappa → SVG line-art

**Files:**
- Create: `lib/battlemap/svg.js`
- Test: `lib/test/battlemap-svg.test.js`

**Interfaces:**
- Consumes: `Map model` da `generateDungeon` (forma `{cols,rows,cells}`).
- Produces: `mapToSvg(map, { cellSize = 40 } = {}) → string` — SVG B/N: sfondo muro (nero/`#111`), pavimenti come `rect` chiari; dimensioni `cols*cellSize × rows*cellSize`. Solo line-art, stampabile.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/battlemap-svg.test.js`:
```js
import { describe, it, expect } from "vitest";
import { mapToSvg } from "../battlemap/svg.js";

const map = { cols: 2, rows: 2, cells: [[1, 0], [0, 1]] };

describe("mapToSvg", () => {
  it("produce un SVG con dimensioni corrette e rect dei pavimenti", () => {
    const svg = mapToSvg(map, { cellSize: 10 });
    expect(svg).toContain("<svg");
    expect(svg).toContain('width="20"');
    expect(svg).toContain('height="20"');
    expect(svg.match(/<rect[^>]*class="floor"/g)?.length).toBe(2);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/battlemap-svg.test.js`
Expected: FAIL.

- [ ] **Step 3: Implementare `lib/battlemap/svg.js`**

```js
export function mapToSvg(map, { cellSize = 40 } = {}) {
  const w = map.cols * cellSize;
  const h = map.rows * cellSize;
  const floors = [];
  for (let y = 0; y < map.rows; y++) {
    for (let x = 0; x < map.cols; x++) {
      if (map.cells[y][x] === 1) {
        floors.push(`<rect class="floor" x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="#f4f1e8" stroke="#111" stroke-width="1"/>`);
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<rect class="bg" x="0" y="0" width="${w}" height="${h}" fill="#111"/>
${floors.join("\n")}
</svg>`;
}
```

- [ ] **Step 4: Eseguire i test e verificare il successo**

Run: `cd lib && npx vitest run test/battlemap-svg.test.js`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "feat(battlemap): mapToSvg (line-art B/N stampabile)"
```

---

### Task 7: `lib/battlemap/add-grid.js` — overlay griglia (Node/SVG, no Python)

**Files:**
- Create: `lib/battlemap/add-grid.js`
- Test: `lib/test/battlemap-grid.test.js`

**Interfaces:**
- Consumes: niente.
- Produces:
  - `gridGroup({ width, height, cellSize, color = "#333" }) → string` — `<g class="grid">` con linee verticali/orizzontali ogni `cellSize`.
  - `addGridToSvg(svg, opts) → string` — inserisce il gruppo griglia prima di `</svg>`.
  - `wrapImageWithGrid({ href, width, height, cellSize, color = "#333" }) → string` — SVG con `<image>` di sfondo + griglia (per le mappe Tier 2 da arte raster).

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/battlemap-grid.test.js`:
```js
import { describe, it, expect } from "vitest";
import { gridGroup, addGridToSvg, wrapImageWithGrid } from "../battlemap/add-grid.js";

describe("gridGroup", () => {
  it("crea linee ogni cellSize", () => {
    const g = gridGroup({ width: 40, height: 20, cellSize: 20 });
    // verticali a x=0,20,40 (3) + orizzontali a y=0,20 (2) → 5 linee
    expect(g.match(/<line/g).length).toBe(5);
  });
});

describe("addGridToSvg", () => {
  it("inserisce la griglia prima di </svg>", () => {
    const out = addGridToSvg('<svg width="40" height="20"></svg>', { width: 40, height: 20, cellSize: 20 });
    expect(out).toContain('class="grid"');
    expect(out.trim().endsWith("</svg>")).toBe(true);
  });
});

describe("wrapImageWithGrid", () => {
  it("incapsula un'immagine con la griglia", () => {
    const svg = wrapImageWithGrid({ href: "map.png", width: 40, height: 20, cellSize: 20 });
    expect(svg).toContain("<image");
    expect(svg).toContain("map.png");
    expect(svg).toContain('class="grid"');
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/battlemap-grid.test.js`
Expected: FAIL.

- [ ] **Step 3: Implementare `lib/battlemap/add-grid.js`**

```js
export function gridGroup({ width, height, cellSize, color = "#333" }) {
  const lines = [];
  for (let x = 0; x <= width; x += cellSize) {
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="${color}" stroke-width="1"/>`);
  }
  for (let y = 0; y <= height; y += cellSize) {
    lines.push(`<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${color}" stroke-width="1"/>`);
  }
  return `<g class="grid">\n${lines.join("\n")}\n</g>`;
}

export function addGridToSvg(svg, opts) {
  const group = gridGroup(opts);
  return svg.replace(/<\/svg>\s*$/, `${group}\n</svg>`);
}

export function wrapImageWithGrid({ href, width, height, cellSize, color = "#333" }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<image href="${href}" x="0" y="0" width="${width}" height="${height}"/>
${gridGroup({ width, height, cellSize, color })}
</svg>`;
}
```

- [ ] **Step 4: Eseguire i test e verificare il successo**

Run: `cd lib && npx vitest run test/battlemap-grid.test.js`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "feat(battlemap): add-grid in Node/SVG (overlay + wrap immagine)"
```

---

### Task 8: `bin/battle-map.js` + `/battle-map`

**Files:**
- Create: `lib/bin/battle-map.js`
- Create: `commands/battle-map.md`
- Test: `lib/test/battle-map-cli.test.js`

**Interfaces:**
- Consumes: `generateDungeon`, `mapToSvg`, `addGridToSvg`, `wrapImageWithGrid`, `htmlDocument` (da `lib/render/html.js`), `resolveOutputPath`, `writeFileSafe`, `slugify`, `createLogger`.
- Produces: `buildBattleMap({ tier = 1, cols, rows, name, imageHref, rng }, env) → { svg, html, outPath, jsonPath?, map? }`.
  - Tier 1: `generateDungeon` → `mapToSvg` + `addGridToSvg` → `svg`; `html = htmlDocument({body: svg, width, height})`; `outPath` PNG; `jsonPath`/`map` per l'export JSON.
  - Tier 2: `wrapImageWithGrid({href: imageHref, ...})` → `svg` → `html`.
  Il main rasterizza `html` via il renderer (`render/`) e scrive PNG (+ SVG/JSON in Tier 1).

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/battle-map-cli.test.js`:
```js
import { describe, it, expect } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildBattleMap } from "../bin/battle-map.js";

function seeded(seed) { let s = seed >>> 0; return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 2 ** 32; }; }

describe("buildBattleMap", () => {
  it("Tier 1: produce svg con griglia, html e outPath", () => {
    const out = mkdtempSync(join(tmpdir(), "out-"));
    const r = buildBattleMap({ tier: 1, cols: 8, rows: 8, name: "Cripta", rng: seeded(3) }, { OUTPUT_DIR: out });
    expect(r.svg).toContain("<svg");
    expect(r.svg).toContain('class="grid"');
    expect(r.html).toContain(".canvas");
    expect(r.outPath).toContain("battle-map-cripta");
    expect(r.outPath.endsWith(".png")).toBe(true);
    expect(r.map.cols).toBe(8);
  });
  it("Tier 2: incapsula un'immagine con la griglia", () => {
    const out = mkdtempSync(join(tmpdir(), "out-"));
    const r = buildBattleMap({ tier: 2, name: "Arena", imageHref: "scena.png", cols: 10, rows: 10 }, { OUTPUT_DIR: out });
    expect(r.svg).toContain("<image");
    expect(r.svg).toContain("scena.png");
    expect(r.svg).toContain('class="grid"');
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/battle-map-cli.test.js`
Expected: FAIL.

- [ ] **Step 3: Implementare `lib/bin/battle-map.js`**

```js
#!/usr/bin/env node
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { generateDungeon } from "../battlemap/generate.js";
import { mapToSvg } from "../battlemap/svg.js";
import { addGridToSvg, wrapImageWithGrid } from "../battlemap/add-grid.js";
import { htmlDocument } from "../render/html.js";
import { resolveOutputPath } from "../common/output.js";
import { writeFileSafe } from "../common/fs-atomic.js";
import { slugify } from "../common/slug.js";
import { createLogger } from "../common/logger.js";

export function buildBattleMap({ tier = 1, cols = 16, rows = 16, name = "mappa", imageHref, cellSize = 40, rng = Math.random } = {}, env = {}) {
  const outDir = env.OUTPUT_DIR ?? join(process.cwd(), "output");
  const base = `battle-map-${slugify(name) || "mappa"}`;
  let svg, map;
  let width, height;
  if (tier === 2) {
    width = cols * cellSize; height = rows * cellSize;
    svg = wrapImageWithGrid({ href: imageHref, width, height, cellSize });
  } else {
    map = generateDungeon({ cols, rows, rng });
    width = cols * cellSize; height = rows * cellSize;
    svg = addGridToSvg(mapToSvg(map, { cellSize }), { width, height, cellSize });
  }
  const html = htmlDocument({ title: name, body: svg, width, height });
  const outPath = resolveOutputPath(outDir, base, ".png");
  const jsonPath = tier === 1 ? resolveOutputPath(outDir, base, ".json") : undefined;
  return { svg, html, outPath, jsonPath, map, width, height };
}

async function readStdin() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  const text = Buffer.concat(chunks).toString("utf8").trim();
  return text ? JSON.parse(text) : {};
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const logger = createLogger(process.env);
  try {
    const argv = process.argv.slice(2);
    const tIdx = argv.indexOf("--tier");
    const tier = tIdx !== -1 ? Number(argv[tIdx + 1]) : 1;
    const input = await readStdin();
    const opts = { tier, ...input };
    const { html, outPath, jsonPath, svg, map, width, height } = buildBattleMap(opts, process.env);
    if (jsonPath && map) writeFileSafe(jsonPath, JSON.stringify(map, null, 2) + "\n", { policy: "error" });
    const { createRenderer } = await import("../../render/renderer.js");
    const png = await createRenderer().render(html, { width, height });
    writeFileSafe(outPath, png, { policy: "error" });
    logger.info(`mappa scritta: ${outPath}`);
  } catch (e) {
    logger.error(e.message);
    process.exit(1);
  }
}
```

- [ ] **Step 4: Eseguire i test e verificare il successo**

Run: `cd lib && npx vitest run test/battle-map-cli.test.js`
Expected: PASS (2 test).

- [ ] **Step 5: Creare il comando `/battle-map`**

`commands/battle-map.md`:
```markdown
---
description: Genera una mappa da battaglia (Tier 1 procedurale, Tier 2 da arte)
argument-hint: [--tier 1|2]
---

Genera una **mappa da battaglia** con la griglia.

- **Tier 1 (default):** generatore procedurale → SVG line-art B/N stampabile + griglia,
  rasterizzato in PNG. Esporta anche il JSON della mappa. Deterministico.
  `echo '{"name":"Cripta","cols":16,"rows":16}' | node ${CLAUDE_PLUGIN_ROOT}/lib/bin/battle-map.js`
- **Tier 2 (arte):** prendi un'immagine di scena (da `/gen-art` o fornita) e applicale
  la griglia.
  `echo '{"name":"Arena","imageHref":"scena.png","cols":20,"rows":20}' | node ${CLAUDE_PLUGIN_ROOT}/lib/bin/battle-map.js --tier 2`

L'output finisce in `OUTPUT_DIR`. Richiede chromium per Playwright. Lo stile default è
top-down B/N, line-art, con griglia aggiunta in post.
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -s -m "feat(battlemap): buildBattleMap (Tier 1/2) + comando /battle-map"
```

---

### Task 9: Integrazione — `lib/index.js`, README, denylist, suite completa

**Files:**
- Modify: `lib/index.js` (riesporta le nuove API deterministiche)
- Modify: `README.md` (sezione Visuals + env provider)
- Test: `lib/test/index-visuals.test.js`

**Interfaces:**
- Consumes: tutte le nuove API deterministiche.
- Produces: import unico aggiornato; documentazione; verifica denylist + suite verde (lib + render).

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/index-visuals.test.js`:
```js
import { describe, it, expect } from "vitest";
import * as api from "../index.js";

describe("lib/index — visuals", () => {
  it("riesporta le API deterministiche di visuals", () => {
    for (const name of ["selectProvider", "imageGenDisclaimer", "apiGenerate",
      "browserGenerate", "generateDungeon", "mapToSvg", "addGridToSvg",
      "wrapImageWithGrid"]) {
      expect(typeof api[name]).toBe("function");
    }
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/index-visuals.test.js`
Expected: FAIL.

- [ ] **Step 3: Aggiungere i riesporti in `lib/index.js`**

Aggiungere in fondo a `lib/index.js`:
```js
// Visuals (image-gen + battle-map; il rendering reale usa il package render/)
export { selectProvider } from "./image/select.js";
export { imageGenDisclaimer } from "./image/disclaimer.js";
export { apiGenerate } from "./image/api-provider.js";
export { browserGenerate } from "./image/browser-provider.js";
export { generateDungeon } from "./battlemap/generate.js";
export { mapToSvg } from "./battlemap/svg.js";
export { gridGroup, addGridToSvg, wrapImageWithGrid } from "./battlemap/add-grid.js";
```

- [ ] **Step 4: Eseguire il test e verificare il successo**

Run: `cd lib && npx vitest run test/index-visuals.test.js`
Expected: PASS (1 test).

- [ ] **Step 5: Aggiornare il README**

In `README.md`, dopo la sezione Produzione, aggiungere:
```markdown
## Visuals (arte e mappe)

Provider arte (configura **uno** dei due):

    IMAGE_API_URL=...   IMAGE_API_KEY=...   # provider API (consigliato)
    IMAGE_GEN_URL=...                        # browser best-effort (fragile)

- `/gen-art "<descrizione>"` — arte 2:3 per oggetti, mostri, PG, PNG (non mappe).
  Il provider browser mostra un disclaimer su ToS e licenze al primo uso.
- `/battle-map [--tier 1|2]` — Tier 1: dungeon procedurale SVG line-art + griglia
  (deterministico, esporta anche JSON); Tier 2: griglia su un'arte di scena.

Le mappe sono zero-dipendenze (SVG generato in Node, griglia in post); la
rasterizzazione PNG riusa il renderer Playwright di `render/`.
```

- [ ] **Step 6: Verificare denylist e suite completa**

Run: `node scripts/check-denylist.mjs`
Expected: `denylist: pulito`.

Run: `cd lib && npx vitest run`
Expected: PASS (tutti i file lib: worldbuilding + adventure + production + visuals).

Run: `cd render && npx vitest run`
Expected: PASS (renderer unit; integration skipped senza chromium).

Run: `cd mcp/compendium-reader && npx vitest run`
Expected: PASS (35 test invariati).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -s -m "feat(visuals): riesporti lib/index + README + verifica suite/denylist"
```

---

## Self-Review

**1. Spec coverage (§ dello spec → task):**
- §9 image-gen `ImageProvider` (API default + browser best-effort + disclaimer ToS, attesa verificabile) → Task 1 (select/disclaimer) + 2 (api) + 3 (browser) + 4 (/gen-art) ✓
- §9 integrazione arte 2:3 verso item-card / ritratti worldbuilding → Task 4 (outPath 2:3, dichiarato nel comando) ✓
- §10 battle-map Tier 1 procedurale → SVG/PNG/JSON → add-grid → Task 5 (generate) + 6 (svg) + 7 (add-grid) + 8 (bin, export JSON+PNG) ✓
- §10 battle-map Tier 2 arte (ImageProvider) + griglia → Task 7 (wrapImageWithGrid) + 8 (tier 2) ✓
- §10/§16.3 `add-grid` in Node (no Python) → Task 7 (SVG puro) ✓
- §14 OUTPUT_DIR + env provider (`IMAGE_API_URL/KEY`, `IMAGE_GEN_URL`), nessun endpoint hardcoded → Task 1/4, README Task 9 ✓
- §15 denylist/compliance su nuova superficie → Task 9 ✓ (nessun nuovo package → CI invariata)
- import procedurale → editor mappe = backlog (il JSON esportato in Task 8 è il punto d'aggancio) ✓
- Vincoli cross-platform/LF/ESM/atomicità/stderr → Global Constraints rispettati ✓

**2. Placeholder scan:** ogni step ha codice o comando concreto; nessun "TBD"/"gestisci errori" generico. La generazione reale (rete/browser) è dietro funzioni iniettabili: i test usano mock; il render reale riusa il package `render/` (già con integration self-skip). ✓

**3. Type consistency:**
- `selectProvider(env)→"api"|"browser"|null` coerente tra Task 1 e 4. ✓
- `apiGenerate({prompt,url,key,size},{fetchImpl})→Buffer` coerente tra Task 2 e 4. ✓
- `browserGenerate({url,prompt,selector},{pilot})→Buffer` coerente tra Task 3 e 4. ✓
- `generateDungeon({cols,rows,roomAttempts,rng})→{cols,rows,cells,rooms}` coerente tra Task 5, 6 (`mapToSvg` consuma `{cols,rows,cells}`), 8. ✓
- `mapToSvg(map,{cellSize})→string` / `addGridToSvg(svg,{width,height,cellSize})` / `wrapImageWithGrid({href,width,height,cellSize})` coerenti tra Task 6, 7, 8. ✓
- `htmlDocument`, `resolveOutputPath`, `writeFileSafe`, `slugify`, `createLogger` riusati con le firme dei piani precedenti; per i PNG/JSON `policy:"error"` su path già reso non-collidente. ✓
- `buildBattleMap(...)→{svg,html,outPath,jsonPath,map,width,height}` / `planGenArt(prompt,env)→{provider,outPath}` testati senza rete/render; la rasterizzazione/generazione è nel main. ✓

> Note implementative: (a) `fetch` è globale in Node ≥20 (nessuna dipendenza); i test iniettano `fetchImpl`. (b) Il provider browser è esplicitamente best-effort e non testato in CI: l'unico test verifica la delega al `pilot` iniettato. (c) `add-grid` e le mappe Tier 1 sono SVG puro (zero-dip); la rasterizzazione PNG riusa il renderer Playwright esistente incapsulando l'SVG in `htmlDocument`. (d) L'import del JSON mappa in un editor esterno è backlog: il JSON esportato è il punto d'aggancio.

# TTRPG Studio — Production / Render Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produrre i deliverable stampabili: utility di rendering condivisa (HTML→PNG/PDF via Playwright), carta oggetto (`/item-card`), schermo del master (`/dm-screen`), handout giocatori vista-player (`/handout`).

**Architecture:** Il **layer deterministico** (compilazione HTML, modello carta, sanitizzazione handout, assemblaggio dm-screen, naming output) sta nel package `lib/` (ESM, **zero dipendenze runtime**) ed è interamente TDD. Il **renderer Playwright** sta in un package separato `render/` (isolando la dipendenza pesante): importa `playwright` in modo **lazy** così gli unit test girano con un `launch` iniettato (mock) senza browser, e un integration test reale si **auto-salta** se chromium non è installato. I comandi/bin costruiscono l'HTML (parte testata) e poi caricano il renderer via `await import(...)` per rasterizzare. Separazione netta **vista-DM / vista-player**: gli handout passano per un sanitizer che rimuove i campi segreti.

**Tech Stack:** Node.js ≥20 (ESM), `vitest`. Nuovo package `render/` con `playwright`. `lib/` resta zero-dip e riusa `lib/common/{fs-atomic,output,logger,errors,slug,localize}.js`. Apache-2.0 (codice) + CC-BY-4.0 (template/CSS).

## Global Constraints

- **Zero contenuti coperti da copyright**; **zero segreti**; **zero marchi di terze parti** in codice, nomi tool/comandi, documentazione. Usare "compatibile con la Quinta Edizione"/"5E-compatible", mai "D&D".
- **Cross-platform:** solo `node:path`; nessuna assunzione Windows; nessuna dipendenza Python.
- **Line-ending LF** (`.gitattributes eol=lf`); entry point con shebang usano `pathToFileURL` per `isMain`.
- **Scrittura su disco** atomica (`writeFileSafe`); output con **naming no-collisione** (`resolveOutputPath`).
- **Vista-DM / vista-player:** gli handout per i giocatori NON contengono campi segreti (`secret`, `secrets_and_clues`, chiavi `*_dm`).
- **Playwright:** `chromium.launch()`, `page.setContent(html)` (no server HTTP), timeout espliciti, **un retry**, lifecycle in `try/finally`, `--no-sandbox` **opt-in** non default. Import di playwright **lazy** (gli unit test non lo richiedono).
- **MCP/stdout:** i bin scrivono i log su `stderr`; lo stdout resta pulito.
- Node ESM: `"type": "module"`.

---

### Task 1: Init package `render/` (Playwright isolato) + CI

**Files:**
- Create: `render/package.json`
- Create: `render/vitest.config.js`
- Create: `render/index.js` (placeholder)
- Modify: `.github/workflows/ci.yml` (install+test di `render/`, senza download browser)

**Interfaces:**
- Consumes: niente.
- Produces: package isolato per il renderer; CI estesa.

- [ ] **Step 1: Creare `render/package.json`**

```json
{
  "name": "ttrpg-studio-render",
  "version": "0.1.0",
  "private": true,
  "license": "Apache-2.0",
  "type": "module",
  "scripts": { "test": "vitest run" },
  "dependencies": { "playwright": "^1.45.0" },
  "devDependencies": { "vitest": "^2.0.0" }
}
```

- [ ] **Step 2: Installare le dipendenze senza scaricare i browser**

Run: `cd render && PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install`
(Windows PowerShell: `$env:PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1; npm install`)
Expected: installa `playwright` (pacchetto npm) senza scaricare chromium; crea `package-lock.json`.

- [ ] **Step 3: Creare `render/vitest.config.js`**

```js
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { environment: "node", include: ["test/**/*.test.js"] },
});
```

- [ ] **Step 4: Creare `render/index.js` placeholder**

```js
// Renderer Playwright (HTML→PNG/PDF). API pubblica in render/renderer.js (Task 7).
export {};
```

- [ ] **Step 5: Verificare che il runner parta**

Run: `cd render && npx vitest run`
Expected: "No test files found" (nessun crash).

- [ ] **Step 6: Estendere la CI**

In `.github/workflows/ci.yml`, dopo lo step "Test (lib)", aggiungere:
```yaml
      - name: Install (render)
        working-directory: render
        run: npm install
        env:
          PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1'
      - name: Test (render)
        working-directory: render
        run: npm test
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -s -m "chore: init package render/ (Playwright isolato) + CI"
```

---

### Task 2: `lib/common/output.js` — naming output no-collisione

**Files:**
- Create: `lib/common/output.js`
- Test: `lib/test/output.test.js`

**Interfaces:**
- Consumes: niente.
- Produces: `resolveOutputPath(outputDir, baseName, ext) → string` — ritorna `outputDir/baseName.ext`, oppure `outputDir/baseName-1.ext`, `-2`, … se esiste già. Non crea nulla. `ext` con o senza punto iniziale.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/output.test.js`:
```js
import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveOutputPath } from "../common/output.js";

describe("resolveOutputPath", () => {
  it("ritorna il path base se libero", () => {
    const dir = mkdtempSync(join(tmpdir(), "out-"));
    expect(resolveOutputPath(dir, "carta", ".png")).toBe(join(dir, "carta.png"));
  });
  it("aggiunge un suffisso numerico se esiste", () => {
    const dir = mkdtempSync(join(tmpdir(), "out-"));
    writeFileSync(join(dir, "carta.png"), "x");
    expect(resolveOutputPath(dir, "carta", ".png")).toBe(join(dir, "carta-1.png"));
  });
  it("normalizza l'estensione senza punto", () => {
    const dir = mkdtempSync(join(tmpdir(), "out-"));
    expect(resolveOutputPath(dir, "x", "pdf")).toBe(join(dir, "x.pdf"));
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/output.test.js`
Expected: FAIL (`resolveOutputPath` non esiste).

- [ ] **Step 3: Implementare `lib/common/output.js`**

```js
import { existsSync } from "node:fs";
import { join } from "node:path";

export function resolveOutputPath(outputDir, baseName, ext) {
  const clean = ext.startsWith(".") ? ext : `.${ext}`;
  let candidate = join(outputDir, `${baseName}${clean}`);
  let i = 1;
  while (existsSync(candidate)) {
    candidate = join(outputDir, `${baseName}-${i}${clean}`);
    i++;
  }
  return candidate;
}
```

- [ ] **Step 4: Eseguire il test e verificare il successo**

Run: `cd lib && npx vitest run test/output.test.js`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "feat(lib): resolveOutputPath (naming output no-collisione)"
```

---

### Task 3: `lib/common/localize.js` — risoluzione campo localizzabile

**Files:**
- Create: `lib/common/localize.js`
- Test: `lib/test/localize.test.js`

**Interfaces:**
- Consumes: niente.
- Produces: `localizeField(value, lang = "it") → string` — stringa passthrough; `{it,en}` → `value[lang] ?? value.en ?? value.it ?? ""`; altro → `""`.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/localize.test.js`:
```js
import { describe, it, expect } from "vitest";
import { localizeField } from "../common/localize.js";

describe("localizeField", () => {
  it("stringa passthrough", () => {
    expect(localizeField("Spada", "it")).toBe("Spada");
  });
  it("sceglie la lingua", () => {
    expect(localizeField({ it: "Spada", en: "Sword" }, "en")).toBe("Sword");
  });
  it("fallback en quando manca la lingua", () => {
    expect(localizeField({ en: "Sword" }, "it")).toBe("Sword");
  });
  it("valore assente → stringa vuota", () => {
    expect(localizeField(undefined, "it")).toBe("");
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/localize.test.js`
Expected: FAIL.

- [ ] **Step 3: Implementare `lib/common/localize.js`**

```js
export function localizeField(value, lang = "it") {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    return value[lang] ?? value.en ?? value.it ?? "";
  }
  return "";
}
```

- [ ] **Step 4: Eseguire il test e verificare il successo**

Run: `cd lib && npx vitest run test/localize.test.js`
Expected: PASS (4 test).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "feat(lib): localizeField (campo localizzabile it/en)"
```

---

### Task 4: `lib/render/html.js` — documento HTML e escaping

**Files:**
- Create: `lib/render/html.js`
- Test: `lib/test/html.test.js`

**Interfaces:**
- Consumes: niente.
- Produces:
  - `escapeHtml(s) → string` — esegue l'escape di `& < > " '`.
  - `htmlDocument({ title, css, body, width, height }) → string` — documento completo con un `.canvas` di `width`×`height` px e meta `hz:canvas-width/height`.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/html.test.js`:
```js
import { describe, it, expect } from "vitest";
import { escapeHtml, htmlDocument } from "../render/html.js";

describe("escapeHtml", () => {
  it("esegue l'escape dei caratteri speciali", () => {
    expect(escapeHtml('<a href="x">&\'')).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&#39;");
  });
});

describe("htmlDocument", () => {
  it("imposta dimensioni canvas e inserisce il body", () => {
    const html = htmlDocument({ title: "T", css: ".x{}", body: "<p>ciao</p>", width: 800, height: 1200 });
    expect(html).toContain("width:800px");
    expect(html).toContain("height:1200px");
    expect(html).toContain("<p>ciao</p>");
    expect(html).toContain('content="800"');
  });
  it("esegue l'escape del title", () => {
    expect(htmlDocument({ title: "<x>", width: 1, height: 1 })).toContain("&lt;x&gt;");
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/html.test.js`
Expected: FAIL.

- [ ] **Step 3: Implementare `lib/render/html.js`**

```js
export function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );
}

export function htmlDocument({ title = "", css = "", body = "", width, height }) {
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="hz:canvas-width" content="${width}">
<meta name="hz:canvas-height" content="${height}">
<title>${escapeHtml(title)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{margin:0}
.canvas{width:${width}px;height:${height}px;overflow:hidden;position:relative}
${css}
</style>
</head>
<body>
<div class="canvas">${body}</div>
</body>
</html>
`;
}
```

- [ ] **Step 4: Eseguire il test e verificare il successo**

Run: `cd lib && npx vitest run test/html.test.js`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "feat(lib): htmlDocument + escapeHtml (base rendering HTML)"
```

---

### Task 5: `lib/item-card/model.js` — modello carta da `reward_loot`

**Files:**
- Create: `lib/item-card/model.js`
- Test: `lib/test/item-card-model.test.js`

**Interfaces:**
- Consumes: `localizeField` da `lib/common/localize.js`.
- Produces: `cardModel(item, lang = "it") → { name, rarity, attunement, description, image }`. Mappa una voce `reward_loot.items` (`{ name, rarity?, attunement?, desc?|description?, image? }`) nel modello vista carta; campi localizzabili risolti.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/item-card-model.test.js`:
```js
import { describe, it, expect } from "vitest";
import { cardModel } from "../item-card/model.js";

describe("cardModel", () => {
  it("mappa una voce di loot localizzata", () => {
    const m = cardModel({
      name: { it: "Tonico di Cenere", en: "Ash Tonic" },
      rarity: "non comune", attunement: false,
      desc: { it: "Cura con retrogusto di fumo.", en: "Heals." },
    }, "it");
    expect(m.name).toBe("Tonico di Cenere");
    expect(m.rarity).toBe("non comune");
    expect(m.attunement).toBe(false);
    expect(m.description).toBe("Cura con retrogusto di fumo.");
  });
  it("attunement booleano e image opzionale", () => {
    const m = cardModel({ name: "X", attunement: true });
    expect(m.attunement).toBe(true);
    expect(m.image).toBe(null);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/item-card-model.test.js`
Expected: FAIL.

- [ ] **Step 3: Implementare `lib/item-card/model.js`**

```js
import { localizeField } from "../common/localize.js";

export function cardModel(item, lang = "it") {
  const d = item ?? {};
  return {
    name: localizeField(d.name, lang),
    rarity: localizeField(d.rarity, lang),
    attunement: Boolean(d.attunement),
    description: localizeField(d.description ?? d.desc, lang),
    image: d.image ?? null,
  };
}
```

- [ ] **Step 4: Eseguire il test e verificare il successo**

Run: `cd lib && npx vitest run test/item-card-model.test.js`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "feat(lib): cardModel (reward_loot → modello carta)"
```

---

### Task 6: `lib/item-card/render-html.js` + CSS carta

**Files:**
- Create: `lib/item-card/render-html.js`
- Create: `templates/item-card/card.css`
- Test: `lib/test/item-card-html.test.js`

**Interfaces:**
- Consumes: `htmlDocument`, `escapeHtml` da `lib/render/html.js`.
- Produces: `renderItemCardHtml(model, { css = "", width = 800, height = 1200 } = {}) → string` — HTML della carta (2x = 800×1200) con nome, rarità, sintonia, descrizione e arte opzionale.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/item-card-html.test.js`:
```js
import { describe, it, expect } from "vitest";
import { renderItemCardHtml } from "../item-card/render-html.js";

describe("renderItemCardHtml", () => {
  it("inserisce nome, rarità e dimensioni 2x", () => {
    const html = renderItemCardHtml({ name: "Tonico", rarity: "non comune", attunement: true, description: "Cura.", image: null });
    expect(html).toContain("Tonico");
    expect(html).toContain("non comune");
    expect(html).toContain("width:800px");
    expect(html).toContain("height:1200px");
    expect(html).toContain("sintonia");
  });
  it("include l'immagine se presente, esegue l'escape", () => {
    const html = renderItemCardHtml({ name: "X", rarity: "", attunement: false, description: "", image: "a&b.png" });
    expect(html).toContain("a&amp;b.png");
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/item-card-html.test.js`
Expected: FAIL.

- [ ] **Step 3: Implementare `lib/item-card/render-html.js`**

```js
import { htmlDocument, escapeHtml } from "../render/html.js";

export function renderItemCardHtml(model, { css = "", width = 800, height = 1200 } = {}) {
  const att = model.attunement ? `<p class="attune">Richiede sintonia</p>` : "";
  const img = model.image ? `<img class="art" src="${escapeHtml(model.image)}" alt="">` : "";
  const body = `
  ${img}
  <h1 class="name">${escapeHtml(model.name)}</h1>
  <p class="rarity">${escapeHtml(model.rarity)}</p>
  ${att}
  <div class="desc">${escapeHtml(model.description)}</div>`;
  return htmlDocument({ title: model.name, css, body, width, height });
}
```

- [ ] **Step 4: Creare `templates/item-card/card.css`**

```css
.canvas{background:#f4ecd8;color:#1c1206;font-family:Georgia,'Times New Roman',serif;padding:48px}
.art{width:100%;height:520px;object-fit:cover;border:6px solid #1c1206;border-radius:8px}
.name{font-size:56px;margin:24px 0 8px}
.rarity{font-style:italic;font-size:28px;color:#6b4f1d;margin-bottom:8px}
.attune{font-size:22px;color:#7a2d1d;margin-bottom:16px}
.desc{font-size:30px;line-height:1.4;margin-top:16px}
```

- [ ] **Step 5: Eseguire i test e verificare il successo**

Run: `cd lib && npx vitest run test/item-card-html.test.js`
Expected: PASS (2 test).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -s -m "feat(item-card): renderItemCardHtml + CSS carta (800x1200)"
```

---

### Task 7: `render/renderer.js` — Playwright (HTML→PNG/PDF) con import lazy

**Files:**
- Create: `render/renderer.js`
- Test: `render/test/renderer.test.js`
- Test: `render/test/renderer-integration.test.js`

**Interfaces:**
- Consumes: `playwright` (import **lazy** dentro il launcher di default).
- Produces: `createRenderer({ launch } = {}) → { render(html, opts) → Buffer }`.
  - `render(html, { width = 800, height = 1200, selector = ".canvas", format = "png", noSandbox = false, timeoutMs = 30000, retries = 1 })`.
  - Lifecycle: `launch` → `newPage` → `setViewportSize` → `setContent(html, {waitUntil:"load", timeout})` → attende `selector` → `screenshot` (png) o `page.pdf` (pdf). `browser.close()` in `finally`. Un retry su errore. `--no-sandbox` solo se `noSandbox`.
  - `launch` iniettabile per i test (default: `import("playwright").then(m => m.chromium.launch(opts))`).

- [ ] **Step 1: Scrivere il test che fallisce (con launch mock)**

`render/test/renderer.test.js`:
```js
import { describe, it, expect, vi } from "vitest";
import { createRenderer } from "../renderer.js";

function fakeBrowser(screenshotBuf) {
  const page = {
    setViewportSize: vi.fn(async () => {}),
    setContent: vi.fn(async () => {}),
    waitForSelector: vi.fn(async () => ({ screenshot: vi.fn(async () => screenshotBuf) })),
    pdf: vi.fn(async () => Buffer.from("PDF")),
    screenshot: vi.fn(async () => screenshotBuf),
  };
  return { newPage: vi.fn(async () => page), close: vi.fn(async () => {}), _page: page };
}

describe("createRenderer.render", () => {
  it("ritorna il buffer dello screenshot e chiude il browser", async () => {
    const buf = Buffer.from("PNG");
    const browser = fakeBrowser(buf);
    const r = createRenderer({ launch: async () => browser });
    const out = await r.render("<div class='canvas'></div>", { width: 800, height: 1200 });
    expect(out).toBe(buf);
    expect(browser.close).toHaveBeenCalled();
  });

  it("ritenta una volta e poi propaga l'errore", async () => {
    let calls = 0;
    const r = createRenderer({ launch: async () => { calls++; throw new Error("boom"); } });
    await expect(r.render("<div></div>", {})).rejects.toThrow(/render fallito/);
    expect(calls).toBe(2); // 1 + 1 retry
  });

  it("formato pdf usa page.pdf", async () => {
    const browser = fakeBrowser(Buffer.from("PNG"));
    const r = createRenderer({ launch: async () => browser });
    const out = await r.render("<div class='canvas'></div>", { format: "pdf" });
    expect(out.toString()).toBe("PDF");
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd render && npx vitest run test/renderer.test.js`
Expected: FAIL (`createRenderer` non esiste).

- [ ] **Step 3: Implementare `render/renderer.js`**

```js
export function createRenderer({ launch } = {}) {
  const launcher = launch ?? (async (opts) => {
    const { chromium } = await import("playwright");
    return chromium.launch(opts);
  });

  async function attempt(html, opts) {
    const { width, height, selector, format, noSandbox, timeoutMs } = opts;
    let browser;
    try {
      browser = await launcher({ args: noSandbox ? ["--no-sandbox"] : [] });
      const page = await browser.newPage();
      await page.setViewportSize({ width, height });
      await page.setContent(html, { waitUntil: "load", timeout: timeoutMs });
      if (format === "pdf") {
        return await page.pdf({ width: `${width}px`, height: `${height}px`, printBackground: true });
      }
      const el = selector ? await page.waitForSelector(selector, { timeout: timeoutMs }) : null;
      return el ? await el.screenshot({ type: "png" }) : await page.screenshot({ type: "png" });
    } finally {
      if (browser) await browser.close();
    }
  }

  return {
    async render(html, opts = {}) {
      const o = {
        width: 800, height: 1200, selector: ".canvas", format: "png",
        noSandbox: false, timeoutMs: 30000, retries: 1, ...opts,
      };
      let lastErr;
      for (let i = 0; i <= o.retries; i++) {
        try {
          return await attempt(html, o);
        } catch (e) {
          lastErr = e;
        }
      }
      throw new Error(`render fallito dopo ${o.retries + 1} tentativi: ${lastErr?.message}`);
    },
  };
}
```

- [ ] **Step 4: Eseguire i test e verificare il successo**

Run: `cd render && npx vitest run test/renderer.test.js`
Expected: PASS (3 test).

- [ ] **Step 5: Scrivere l'integration test che si auto-salta senza chromium**

`render/test/renderer-integration.test.js`:
```js
import { describe, it, expect } from "vitest";
import { createRenderer } from "../renderer.js";

const hasBrowser = await (async () => {
  try {
    const { chromium } = await import("playwright");
    const b = await chromium.launch();
    await b.close();
    return true;
  } catch {
    return false;
  }
})();

describe.skipIf(!hasBrowser)("render reale (chromium)", () => {
  it("produce un PNG non vuoto", async () => {
    const r = createRenderer();
    const html = "<!doctype html><div class='canvas' style='width:100px;height:100px;background:#000'></div>";
    const png = await r.render(html, { width: 100, height: 100 });
    expect(png.length).toBeGreaterThan(100);
    expect(png.slice(1, 4).toString()).toBe("PNG"); // firma file PNG
  });
});
```

- [ ] **Step 6: Eseguire l'intera suite render**

Run: `cd render && npx vitest run`
Expected: PASS (unit: 3 test; integration: passato se chromium è installato, altrimenti **skipped** — nessun fallimento).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -s -m "feat(render): PlaywrightRenderer (lazy import, retry, lifecycle) + integration self-skip"
```

---

### Task 8: `bin/item-card.js` + `/item-card`

**Files:**
- Create: `lib/bin/item-card.js`
- Create: `commands/item-card.md`
- Test: `lib/test/item-card-cli.test.js`

**Interfaces:**
- Consumes: `cardModel`, `renderItemCardHtml`, `resolveOutputPath`, `writeFileSafe`, `slugify`, `createLogger`.
- Produces: `buildItemCard(item, env) → { html, outPath, model }` (testabile, niente render). Il main legge l'item JSON da stdin, costruisce l'HTML, carica il renderer via `await import("../../render/renderer.js")`, rasterizza e scrive il PNG in `OUTPUT_DIR`.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/item-card-cli.test.js`:
```js
import { describe, it, expect } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildItemCard } from "../bin/item-card.js";

describe("buildItemCard", () => {
  it("costruisce HTML e outPath dentro OUTPUT_DIR", () => {
    const out = mkdtempSync(join(tmpdir(), "out-"));
    const { html, outPath } = buildItemCard(
      { name: "Tonico di Cenere", rarity: "non comune" },
      { OUTPUT_DIR: out, GAME_DATA_LANG: "it" }
    );
    expect(html).toContain("Tonico di Cenere");
    expect(outPath.startsWith(out)).toBe(true);
    expect(outPath.endsWith(".png")).toBe(true);
    expect(outPath).toContain("tonico-di-cenere");
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/item-card-cli.test.js`
Expected: FAIL.

- [ ] **Step 3: Implementare `lib/bin/item-card.js`**

```js
#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { cardModel } from "../item-card/model.js";
import { renderItemCardHtml } from "../item-card/render-html.js";
import { resolveOutputPath } from "../common/output.js";
import { writeFileSafe } from "../common/fs-atomic.js";
import { slugify } from "../common/slug.js";
import { createLogger } from "../common/logger.js";

function loadCss(root) {
  try { return readFileSync(join(root, "templates", "item-card", "card.css"), "utf8"); } catch { return ""; }
}

export function buildItemCard(item, env = {}) {
  const lang = env.GAME_DATA_LANG ?? "it";
  const root = env.CLAUDE_PLUGIN_ROOT ?? process.cwd();
  const model = cardModel(item, lang);
  const html = renderItemCardHtml(model, { css: loadCss(root) });
  const outDir = env.OUTPUT_DIR ?? join(process.cwd(), "output");
  const outPath = resolveOutputPath(outDir, `card-${slugify(model.name) || "oggetto"}`, ".png");
  return { html, outPath, model };
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
    const item = await readStdin();
    const { html, outPath } = buildItemCard(item, process.env);
    const { createRenderer } = await import("../../render/renderer.js");
    const png = await createRenderer().render(html, { width: 800, height: 1200 });
    writeFileSafe(outPath, png, { policy: "error" });
    logger.info(`carta scritta: ${outPath}`);
  } catch (e) {
    logger.error(e.message);
    process.exit(1);
  }
}
```

- [ ] **Step 4: Eseguire il test e verificare il successo**

Run: `cd lib && npx vitest run test/item-card-cli.test.js`
Expected: PASS (1 test).

- [ ] **Step 5: Creare il comando `/item-card`**

`commands/item-card.md`:
```markdown
---
description: Genera la carta PNG di un oggetto (da reward_loot)
argument-hint: [nome oggetto]
---

Genera la **carta oggetto** per "$ARGUMENTS".

1. Ricava la voce oggetto da `reward_loot.items` dell'avventura attiva (o costruiscila
   con l'utente): `{ name, rarity, attunement, desc, image? }`. L'arte si ottiene dal
   modulo visuals (`/gen-art`); se assente la carta esce senza immagine.
2. Esegui:
   `echo '<item-json>' | node ${CLAUDE_PLUGIN_ROOT}/lib/bin/item-card.js`
3. Il PNG (800×1200) finisce in `OUTPUT_DIR` con naming no-collisione. Richiede
   chromium installato per Playwright (`npx playwright install chromium`).
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -s -m "feat(item-card): buildItemCard + comando /item-card"
```

---

### Task 9: `lib/handout/sanitize.js` — vista-player (rimozione segreti)

**Files:**
- Create: `lib/handout/sanitize.js`
- Test: `lib/test/handout-sanitize.test.js`

**Interfaces:**
- Consumes: niente.
- Produces: `playerSafe(value, { denyKeys = ["secret","secrets_and_clues"] } = {}) → value` — clona in profondità rimuovendo ogni chiave in `denyKeys` o che termina con `_dm`, a ogni livello (oggetti e array).

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/handout-sanitize.test.js`:
```js
import { describe, it, expect } from "vitest";
import { playerSafe } from "../handout/sanitize.js";

describe("playerSafe", () => {
  it("rimuove i campi segreti annidati", () => {
    const src = {
      title: "Lettera",
      npc: { name: "Vera", secret: "è una spia", note_dm: "tradirà" },
      list: [{ text: "ok", secret: "no" }],
      secrets_and_clues: ["x"],
    };
    const out = playerSafe(src);
    expect(out.title).toBe("Lettera");
    expect(out.npc).toEqual({ name: "Vera" });
    expect(out.list).toEqual([{ text: "ok" }]);
    expect(out.secrets_and_clues).toBeUndefined();
  });
  it("non muta l'originale", () => {
    const src = { secret: "x", keep: 1 };
    playerSafe(src);
    expect(src.secret).toBe("x");
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/handout-sanitize.test.js`
Expected: FAIL.

- [ ] **Step 3: Implementare `lib/handout/sanitize.js`**

```js
export function playerSafe(value, { denyKeys = ["secret", "secrets_and_clues"] } = {}) {
  const deny = new Set(denyKeys);
  const walk = (v) => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") {
      const out = {};
      for (const [k, val] of Object.entries(v)) {
        if (deny.has(k) || k.endsWith("_dm")) continue;
        out[k] = walk(val);
      }
      return out;
    }
    return v;
  };
  return walk(value);
}
```

- [ ] **Step 4: Eseguire i test e verificare il successo**

Run: `cd lib && npx vitest run test/handout-sanitize.test.js`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "feat(handout): playerSafe (sanitizzazione vista-player)"
```

---

### Task 10: `lib/handout/render-html.js` + CSS handout

**Files:**
- Create: `lib/handout/render-html.js`
- Create: `templates/handout/handout.css`
- Test: `lib/test/handout-html.test.js`

**Interfaces:**
- Consumes: `htmlDocument`, `escapeHtml` da `lib/render/html.js`.
- Produces: `renderHandoutHtml({ kind = "letter", title = "", content = "", css = "", width = 800, height = 1200 } = {}) → string` — HTML diegetico (lettera/poster/nota); `content` è testo già **player-safe**, sottoposto a escape.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/handout-html.test.js`:
```js
import { describe, it, expect } from "vitest";
import { renderHandoutHtml } from "../handout/render-html.js";

describe("renderHandoutHtml", () => {
  it("compone titolo e contenuto con la classe del tipo", () => {
    const html = renderHandoutHtml({ kind: "letter", title: "Avviso", content: "Venite all'alba.", width: 800, height: 1200 });
    expect(html).toContain("handout letter");
    expect(html).toContain("Avviso");
    expect(html).toContain("Venite all'alba.");
  });
  it("esegue l'escape del contenuto", () => {
    const html = renderHandoutHtml({ content: "<script>", title: "t" });
    expect(html).toContain("&lt;script&gt;");
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/handout-html.test.js`
Expected: FAIL.

- [ ] **Step 3: Implementare `lib/handout/render-html.js`**

```js
import { htmlDocument, escapeHtml } from "../render/html.js";

export function renderHandoutHtml({ kind = "letter", title = "", content = "", css = "", width = 800, height = 1200 } = {}) {
  const body = `<div class="handout ${escapeHtml(kind)}">
  <h1 class="ho-title">${escapeHtml(title)}</h1>
  <div class="ho-content">${escapeHtml(content)}</div>
  </div>`;
  return htmlDocument({ title, css, body, width, height });
}
```

- [ ] **Step 4: Creare `templates/handout/handout.css`**

```css
.canvas{background:#efe6d0;color:#241a0c;font-family:Georgia,'Times New Roman',serif;padding:64px}
.handout.letter{font-size:32px;line-height:1.5}
.handout.poster{text-align:center;font-size:44px;line-height:1.3}
.handout.note{font-size:30px;font-style:italic}
.ho-title{font-size:52px;margin-bottom:24px}
.ho-content{white-space:pre-wrap}
```

- [ ] **Step 5: Eseguire i test e verificare il successo**

Run: `cd lib && npx vitest run test/handout-html.test.js`
Expected: PASS (2 test).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -s -m "feat(handout): renderHandoutHtml + CSS handout"
```

---

### Task 11: `bin/handout.js` + `/handout`

**Files:**
- Create: `lib/bin/handout.js`
- Create: `commands/handout.md`
- Test: `lib/test/handout-cli.test.js`

**Interfaces:**
- Consumes: `playerSafe`, `renderHandoutHtml`, `resolveOutputPath`, `writeFileSafe`, `slugify`, `createLogger`.
- Produces: `buildHandout(input, env) → { html, outPath }` — `input = { kind, title, content }`. **Sanitizza** `content` se è strutturato (oggetto) via `playerSafe`, poi compone l'HTML. Il main legge da stdin, costruisce, rasterizza via renderer, scrive il PNG.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/handout-cli.test.js`:
```js
import { describe, it, expect } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildHandout } from "../bin/handout.js";

describe("buildHandout", () => {
  it("compone HTML e outPath; non espone segreti da contenuto strutturato", () => {
    const out = mkdtempSync(join(tmpdir(), "out-"));
    const { html, outPath } = buildHandout(
      { kind: "letter", title: "Avviso", content: { testo: "Venite.", secret: "trappola" } },
      { OUTPUT_DIR: out }
    );
    expect(html).toContain("Avviso");
    expect(html).toContain("Venite.");
    expect(html).not.toContain("trappola");
    expect(outPath.startsWith(out)).toBe(true);
    expect(outPath.endsWith(".png")).toBe(true);
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/handout-cli.test.js`
Expected: FAIL.

- [ ] **Step 3: Implementare `lib/bin/handout.js`**

```js
#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { playerSafe } from "../handout/sanitize.js";
import { renderHandoutHtml } from "../handout/render-html.js";
import { resolveOutputPath } from "../common/output.js";
import { writeFileSafe } from "../common/fs-atomic.js";
import { slugify } from "../common/slug.js";
import { createLogger } from "../common/logger.js";

function loadCss(root) {
  try { return readFileSync(join(root, "templates", "handout", "handout.css"), "utf8"); } catch { return ""; }
}

function contentToText(content) {
  if (typeof content === "string") return content;
  const safe = playerSafe(content);
  // serializza i valori rimasti (player-safe) come testo leggibile
  return Object.values(safe).map((v) => (typeof v === "string" ? v : JSON.stringify(v))).join("\n");
}

export function buildHandout(input, env = {}) {
  const root = env.CLAUDE_PLUGIN_ROOT ?? process.cwd();
  const kind = input.kind ?? "letter";
  const title = input.title ?? "";
  const content = contentToText(input.content ?? "");
  const html = renderHandoutHtml({ kind, title, content, css: loadCss(root) });
  const outDir = env.OUTPUT_DIR ?? join(process.cwd(), "output");
  const outPath = resolveOutputPath(outDir, `handout-${slugify(title) || kind}`, ".png");
  return { html, outPath };
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
    const input = await readStdin();
    const { html, outPath } = buildHandout(input, process.env);
    const { createRenderer } = await import("../../render/renderer.js");
    const png = await createRenderer().render(html, { width: 800, height: 1200 });
    writeFileSafe(outPath, png, { policy: "error" });
    logger.info(`handout scritto: ${outPath}`);
  } catch (e) {
    logger.error(e.message);
    process.exit(1);
  }
}
```

- [ ] **Step 4: Eseguire il test e verificare il successo**

Run: `cd lib && npx vitest run test/handout-cli.test.js`
Expected: PASS (1 test).

- [ ] **Step 5: Creare il comando `/handout`**

`commands/handout.md`:
```markdown
---
description: Genera un handout per i giocatori (vista-player, niente segreti)
argument-hint: [titolo]
---

Genera un **handout diegetico** (lettera, poster, nota) per i giocatori: "$ARGUMENTS".

1. Costruisci `{ kind: "letter"|"poster"|"note", title, content }`. Il `content` può
   essere testo o un oggetto strutturato: i campi `secret`/`secrets_and_clues` e le
   chiavi `*_dm` vengono **rimossi** automaticamente (vista-player).
2. Esegui:
   `echo '<handout-json>' | node ${CLAUDE_PLUGIN_ROOT}/lib/bin/handout.js`
3. Il PNG finisce in `OUTPUT_DIR`. **Mai** mettere informazioni segrete in un handout.
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -s -m "feat(handout): buildHandout (sanitizzato) + comando /handout"
```

---

### Task 12: `lib/dm-screen/assemble.js` — modello pannelli

**Files:**
- Create: `lib/dm-screen/assemble.js`
- Test: `lib/test/dm-screen-assemble.test.js`

**Interfaces:**
- Consumes: niente.
- Produces: `assembleScreen({ adventure = {}, monsters = [] }) → { title, panels: [{ heading, items: string[] }] }`. Pannelli: Strong start, Incontri (`encounters[].name`), Mostri (`name (XP)`), Ganci (`hooks`, max 5).

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/dm-screen-assemble.test.js`:
```js
import { describe, it, expect } from "vitest";
import { assembleScreen } from "../dm-screen/assemble.js";

describe("assembleScreen", () => {
  it("costruisce i pannelli dall'avventura e dai mostri", () => {
    const screen = assembleScreen({
      adventure: {
        title: "La Cripta", strong_start: "Il pavimento cede.",
        encounters: [{ name: "Agguato" }], hooks: ["g1", "g2"],
      },
      monsters: [{ name: "Muffa", xp: 100 }],
    });
    expect(screen.title).toBe("La Cripta");
    const headings = screen.panels.map((p) => p.heading);
    expect(headings).toContain("Strong start");
    expect(headings).toContain("Incontri");
    expect(headings).toContain("Mostri");
    const mostri = screen.panels.find((p) => p.heading === "Mostri");
    expect(mostri.items[0]).toContain("Muffa");
    expect(mostri.items[0]).toContain("100");
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/dm-screen-assemble.test.js`
Expected: FAIL.

- [ ] **Step 3: Implementare `lib/dm-screen/assemble.js`**

```js
export function assembleScreen({ adventure = {}, monsters = [] } = {}) {
  const a = adventure;
  const panels = [
    { heading: "Strong start", items: [a.strong_start ?? ""] },
    { heading: "Incontri", items: (a.encounters ?? []).map((e) => e.name ?? "incontro") },
    { heading: "Mostri", items: monsters.map((m) => `${m.name ?? m.id} (${m.xp ?? "?"} XP)`) },
    { heading: "Ganci", items: (a.hooks ?? []).slice(0, 5) },
  ];
  return { title: a.title ?? "Schermo del Master", panels };
}
```

- [ ] **Step 4: Eseguire il test e verificare il successo**

Run: `cd lib && npx vitest run test/dm-screen-assemble.test.js`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -s -m "feat(dm-screen): assembleScreen (modello pannelli)"
```

---

### Task 13: `lib/dm-screen/render-html.js` + CSS

**Files:**
- Create: `lib/dm-screen/render-html.js`
- Create: `templates/dm-screen/screen.css`
- Test: `lib/test/dm-screen-html.test.js`

**Interfaces:**
- Consumes: `htmlDocument`, `escapeHtml` da `lib/render/html.js`.
- Produces: `renderScreenHtml(screen, { css = "", width = 1920, height = 1080 } = {}) → string` — HTML a griglia con un `<section class="panel">` per pannello.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/dm-screen-html.test.js`:
```js
import { describe, it, expect } from "vitest";
import { renderScreenHtml } from "../dm-screen/render-html.js";

describe("renderScreenHtml", () => {
  it("rende i pannelli e gli item", () => {
    const html = renderScreenHtml({
      title: "Schermo", panels: [{ heading: "Mostri", items: ["Muffa (100 XP)"] }],
    });
    expect(html).toContain("Schermo");
    expect(html).toContain("Mostri");
    expect(html).toContain("Muffa (100 XP)");
    expect(html).toContain("width:1920px");
  });
  it("esegue l'escape di heading e item", () => {
    const html = renderScreenHtml({ title: "t", panels: [{ heading: "<h>", items: ["<i>"] }] });
    expect(html).toContain("&lt;h&gt;");
    expect(html).toContain("&lt;i&gt;");
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/dm-screen-html.test.js`
Expected: FAIL.

- [ ] **Step 3: Implementare `lib/dm-screen/render-html.js`**

```js
import { htmlDocument, escapeHtml } from "../render/html.js";

export function renderScreenHtml(screen, { css = "", width = 1920, height = 1080 } = {}) {
  const panels = (screen.panels ?? []).map((p) => `
  <section class="panel">
    <h2>${escapeHtml(p.heading)}</h2>
    <ul>${(p.items ?? []).map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
  </section>`).join("");
  const body = `<header class="screen-head"><h1>${escapeHtml(screen.title)}</h1></header>
  <div class="grid">${panels}</div>`;
  return htmlDocument({ title: screen.title, css, body, width, height });
}
```

- [ ] **Step 4: Creare `templates/dm-screen/screen.css`**

```css
.canvas{background:#14110c;color:#f1e9d2;font-family:Georgia,serif;padding:32px}
.screen-head h1{font-size:40px;margin-bottom:16px;border-bottom:2px solid #c8a24a;padding-bottom:8px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.panel{background:#221c12;border:1px solid #c8a24a;border-radius:8px;padding:18px}
.panel h2{font-size:26px;color:#c8a24a;margin-bottom:10px}
.panel ul{list-style:none}
.panel li{font-size:22px;line-height:1.4;margin-bottom:6px}
```

- [ ] **Step 5: Eseguire i test e verificare il successo**

Run: `cd lib && npx vitest run test/dm-screen-html.test.js`
Expected: PASS (2 test).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -s -m "feat(dm-screen): renderScreenHtml + CSS (1920x1080)"
```

---

### Task 14: `bin/dm-screen.js` + `/dm-screen`

**Files:**
- Create: `lib/bin/dm-screen.js`
- Create: `commands/dm-screen.md`
- Test: `lib/test/dm-screen-cli.test.js`

**Interfaces:**
- Consumes: `assembleScreen`, `renderScreenHtml`, `resolveOutputPath`, `writeFileSafe`, `slugify`, `createLogger`.
- Produces: `buildDmScreen(input, env) → { html, outPath }` — `input = { adventure, monsters }`. Il main legge da stdin, costruisce l'HTML, rasterizza (PNG o PDF se `--pdf`), scrive in `OUTPUT_DIR`.

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/dm-screen-cli.test.js`:
```js
import { describe, it, expect } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildDmScreen } from "../bin/dm-screen.js";

describe("buildDmScreen", () => {
  it("costruisce HTML e outPath", () => {
    const out = mkdtempSync(join(tmpdir(), "out-"));
    const { html, outPath } = buildDmScreen(
      { adventure: { title: "La Cripta", hooks: ["g1"] }, monsters: [{ name: "Muffa", xp: 100 }] },
      { OUTPUT_DIR: out }
    );
    expect(html).toContain("La Cripta");
    expect(html).toContain("Muffa");
    expect(outPath.startsWith(out)).toBe(true);
    expect(outPath).toContain("dm-screen-la-cripta");
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/dm-screen-cli.test.js`
Expected: FAIL.

- [ ] **Step 3: Implementare `lib/bin/dm-screen.js`**

```js
#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { assembleScreen } from "../dm-screen/assemble.js";
import { renderScreenHtml } from "../dm-screen/render-html.js";
import { resolveOutputPath } from "../common/output.js";
import { writeFileSafe } from "../common/fs-atomic.js";
import { slugify } from "../common/slug.js";
import { createLogger } from "../common/logger.js";

function loadCss(root) {
  try { return readFileSync(join(root, "templates", "dm-screen", "screen.css"), "utf8"); } catch { return ""; }
}

export function buildDmScreen(input, env = {}, { format = "png" } = {}) {
  const root = env.CLAUDE_PLUGIN_ROOT ?? process.cwd();
  const screen = assembleScreen({ adventure: input.adventure ?? {}, monsters: input.monsters ?? [] });
  const html = renderScreenHtml(screen, { css: loadCss(root) });
  const outDir = env.OUTPUT_DIR ?? join(process.cwd(), "output");
  const ext = format === "pdf" ? ".pdf" : ".png";
  const outPath = resolveOutputPath(outDir, `dm-screen-${slugify(screen.title) || "schermo"}`, ext);
  return { html, outPath };
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
    const format = process.argv.includes("--pdf") ? "pdf" : "png";
    const input = await readStdin();
    const { html, outPath } = buildDmScreen(input, process.env, { format });
    const { createRenderer } = await import("../../render/renderer.js");
    const buf = await createRenderer().render(html, { width: 1920, height: 1080, format });
    writeFileSafe(outPath, buf, { policy: "error" });
    logger.info(`schermo scritto: ${outPath}`);
  } catch (e) {
    logger.error(e.message);
    process.exit(1);
  }
}
```

- [ ] **Step 4: Eseguire il test e verificare il successo**

Run: `cd lib && npx vitest run test/dm-screen-cli.test.js`
Expected: PASS (1 test).

- [ ] **Step 5: Creare il comando `/dm-screen`**

`commands/dm-screen.md`:
```markdown
---
description: Genera lo schermo del master (PNG/PDF) da un'avventura
argument-hint: [--pdf]
---

Genera lo **schermo del master** per l'avventura attiva.

1. Costruisci `{ adventure: <adventure.json>, monsters: [{name, xp}] }` (i mostri dal
   `compendium-reader` con lo XP da CR).
2. Esegui:
   `echo '<json>' | node ${CLAUDE_PLUGIN_ROOT}/lib/bin/dm-screen.js`
   Aggiungi `--pdf` per l'export PDF invece del PNG.
3. L'output (1920×1080) finisce in `OUTPUT_DIR`. Lo scaling incontro on-the-fly è
   backlog. Richiede chromium per Playwright.
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -s -m "feat(dm-screen): buildDmScreen + comando /dm-screen"
```

---

### Task 15: Integrazione — `lib/index.js`, README, denylist, suite completa

**Files:**
- Modify: `lib/index.js` (riesporta le nuove API deterministiche)
- Modify: `README.md` (sezione Produzione)
- Test: `lib/test/index-production.test.js`

**Interfaces:**
- Consumes: tutte le nuove API deterministiche.
- Produces: import unico aggiornato; documentazione; verifica denylist + suite verde (lib + render).

- [ ] **Step 1: Scrivere il test che fallisce**

`lib/test/index-production.test.js`:
```js
import { describe, it, expect } from "vitest";
import * as api from "../index.js";

describe("lib/index — production", () => {
  it("riesporta le API deterministiche di produzione", () => {
    for (const name of ["resolveOutputPath", "localizeField", "escapeHtml", "htmlDocument",
      "cardModel", "renderItemCardHtml", "playerSafe", "renderHandoutHtml",
      "assembleScreen", "renderScreenHtml"]) {
      expect(typeof api[name]).toBe("function");
    }
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run: `cd lib && npx vitest run test/index-production.test.js`
Expected: FAIL.

- [ ] **Step 3: Aggiungere i riesporti in `lib/index.js`**

Aggiungere in fondo a `lib/index.js`:
```js
// Production / render (layer deterministico; il renderer Playwright è nel package render/)
export { resolveOutputPath } from "./common/output.js";
export { localizeField } from "./common/localize.js";
export { escapeHtml, htmlDocument } from "./render/html.js";
export { cardModel } from "./item-card/model.js";
export { renderItemCardHtml } from "./item-card/render-html.js";
export { playerSafe } from "./handout/sanitize.js";
export { renderHandoutHtml } from "./handout/render-html.js";
export { assembleScreen } from "./dm-screen/assemble.js";
export { renderScreenHtml } from "./dm-screen/render-html.js";
```

- [ ] **Step 4: Eseguire il test e verificare il successo**

Run: `cd lib && npx vitest run test/index-production.test.js`
Expected: PASS (1 test).

- [ ] **Step 5: Aggiornare il README con la sezione Produzione**

In `README.md`, dopo la sezione Avventure, aggiungere:
```markdown
## Produzione (materiale stampabile)

    OUTPUT_DIR=./output   # dove finiscono PNG/PDF generati

- `/item-card` — carta oggetto PNG (800×1200) da una voce `reward_loot`.
- `/dm-screen [--pdf]` — schermo del master (1920×1080) da un'avventura.
- `/handout` — handout diegetico per i giocatori (**vista-player**: i campi segreti
  vengono rimossi automaticamente).

Il rendering HTML→PNG/PDF usa **Playwright** (package `render/`). Installa il browser
una volta con `npx playwright install chromium`. Il layer di composizione HTML sta in
`lib/` (zero dipendenze, testato); il renderer è isolato in `render/`.
```

- [ ] **Step 6: Verificare denylist e suite completa**

Run: `node scripts/check-denylist.mjs`
Expected: `denylist: pulito`.

Run: `cd lib && npx vitest run`
Expected: PASS (tutti i file lib worldbuilding + adventure + production).

Run: `cd render && npx vitest run`
Expected: PASS (renderer unit; integration skipped senza chromium).

Run: `cd mcp/compendium-reader && npx vitest run`
Expected: PASS (35 test invariati).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -s -m "feat(production): riesporti lib/index + README + verifica suite/denylist"
```

---

## Self-Review

**1. Spec coverage (§ dello spec → task):**
- §7.1 Flusso carta (template HTML 2x → render) → Task 5 (model) + 6 (html+css) + 8 (bin/command) ✓
- §7.2 Loot legato (`reward_loot`) → consumato da `cardModel` (Task 5) ✓ (i dati loot e la tabella non-oggetto sono già nel piano adventure)
- §7.3 render-to-png robusto (Playwright, setContent, timeout, 1 retry, lifecycle, --no-sandbox opt-in, utility condivisa) → Task 7 ✓; riusata da item-card/dm-screen/handout (Task 8/11/14) ✓
- §8 dm-screen (HTML, pannelli, export PNG/PDF, legge Bible+compendio) → Task 12 (assemble) + 13 (html+css) + 14 (bin/command, PDF) ✓ (scaling incontro on-the-fly = backlog dichiarato)
- §12 handout giocatori (diegetico, separazione vista-DM/vista-player) → Task 9 (sanitize) + 10 (html+css) + 11 (bin/command) ✓
- §14 OUTPUT_DIR (naming + no-collisione) → Task 2 ✓; logging stderr → bin con `createLogger` ✓
- §16.2 image provider = fuori scope (modulo visuals, piano 5); l'arte è un riferimento opzionale nella carta ✓
- §15 denylist/compliance su nuova superficie → Task 15 ✓; CI estesa a `render/` (senza download browser) → Task 1 ✓
- Vincoli cross-platform/LF/ESM/atomicità/stderr → Global Constraints rispettati ✓

**2. Placeholder scan:** ogni step ha codice o comando concreto; nessun "TBD"/"gestisci errori" generico. Skill/comandi sono markdown senza test automatico (dichiarato); la logica testabile sta nelle lib e nel renderer (con launch mock). ✓

**3. Type consistency:**
- `htmlDocument({title,css,body,width,height})` / `escapeHtml` coerenti tra Task 4 e i renderer (6,10,13). ✓
- `cardModel(item,lang)→{name,rarity,attunement,description,image}` coerente tra Task 5 e 6/8. ✓
- `renderItemCardHtml(model,{css,width,height})` coerente tra Task 6 e 8. ✓
- `createRenderer({launch})→{render(html,opts)→Buffer}` coerente tra Task 7 e i bin (8,11,14) che lo importano via `await import("../../render/renderer.js")`. ✓
- `playerSafe(value,{denyKeys})` coerente tra Task 9 e 11. ✓
- `renderHandoutHtml({kind,title,content,css,width,height})` coerente tra Task 10 e 11. ✓
- `assembleScreen({adventure,monsters})→{title,panels}` coerente tra Task 12 e 13/14. ✓
- `renderScreenHtml(screen,{css,width,height})` coerente tra Task 13 e 14. ✓
- `resolveOutputPath(outputDir,baseName,ext)` / `localizeField(value,lang)` riusati come definiti in Task 2/3. ✓
- `writeFileSafe`, `slugify`, `createLogger` riusati dai piani precedenti; per i PNG si usa `policy: "error"` su un path già reso non-collidente da `resolveOutputPath` (nessun `dryRun` su binari). ✓

> Note implementative: (a) il renderer importa `playwright` in modo **lazy** — gli unit test girano col `launch` mock, l'integration test reale si auto-salta senza chromium; (b) i bin separano `build*` (HTML, testato) dalla rasterizzazione (dynamic import del renderer), così la suite `lib/` non dipende da Playwright; (c) lo scaling incontro on-the-fly del dm-screen e l'arte generata (image provider) restano backlog/altri piani.

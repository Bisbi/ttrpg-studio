# Contributing

*[English](#english) · [Italiano](#italiano)*

---

## English

Thanks for contributing! Non-negotiable rules (IP gate):

1. **No copyrighted content** in PRs (stat blocks, text from commercial
   manuals, etc.).
2. **No third-party brand or product names** in code, function/tool names, or
   documentation. Use "5E-compatible".
3. **No secrets** (keys, tokens) in commits.
4. All sample data must be **invented homebrew** or **SRD under CC-BY** with
   attribution; the `source` field in examples = `"HomebrewExample"`.

### DCO

Every commit must be signed with `Signed-off-by` (Developer Certificate of
Origin): use `git commit -s`.

### Running the tests

Each package has its own test suite. Install dependencies and run the tests:

- **mcp/compendium-reader** — `npm install` then `npm test`
- **lib** — `npm install` then `npm test`
- **render** — `npm install` then `npm test`. In CI, `render` runs with
  `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` to skip the browser download.

CI must stay green: make sure all tests pass before opening a PR.

### PR checklist

- [ ] No secrets
- [ ] No copyrighted data
- [ ] No third-party trademarks
- [ ] Tests green
- [ ] DCO (`Signed-off-by`)

---

## Italiano

Grazie per il contributo! Regole non negoziabili (IP gate):

1. **Niente contenuti coperti da copyright** in PR (stat block, testo di
   manuali commerciali, ecc.).
2. **Niente nomi di marchi o prodotti di terze parti** in codice, nomi di
   funzioni/tool, o documentazione. Usa "5E-compatible".
3. **Niente segreti** (chiavi, token) nei commit.
4. Tutti gli esempi di dato sono **homebrew inventato** o **SRD sotto CC-BY**
   con attribuzione; il campo `source` negli esempi = `"HomebrewExample"`.

### DCO

Ogni commit deve essere firmato con `Signed-off-by` (Developer Certificate of
Origin): usa `git commit -s`.

### Come girare i test

Ogni package ha la propria suite di test. Installa le dipendenze e lancia i
test:

- **mcp/compendium-reader** — `npm install` poi `npm test`
- **lib** — `npm install` poi `npm test`
- **render** — `npm install` poi `npm test`. In CI, `render` gira con
  `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` per saltare il download del browser.

La CI deve restare verde: assicurati che tutti i test passino prima di aprire
una PR.

### Checklist PR

- [ ] No segreti
- [ ] No dati coperti da copyright
- [ ] No marchi di terze parti
- [ ] Test verdi
- [ ] DCO (`Signed-off-by`)

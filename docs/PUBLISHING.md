# Publishing / Go-Online Checklist

**[English](#english) · [Italiano](#italiano)**

---

## English

Checklist to publish **TTRPG Studio** as a public GitHub repository.

### 1. Pre-flight (must all pass)
- [ ] Tests green:
  - `cd mcp/compendium-reader && npm install && npm test`
  - `cd lib && npm install && npm test`
  - `cd render && PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install && npm test`
- [ ] Trademark denylist clean: `node scripts/check-denylist.mjs`
- [ ] No secrets / no personal data in the publishable surface (audited).
- [ ] `node_modules/` not tracked; generated output ignored (PNG/PDF/`output/`, `battle-map-*.json`); user data ignored (`/setting/`, `/adventures/`, `voice-profile.md`).

### 2. Create the public repository
Pick an owner/name, then (GitHub CLI):
```bash
gh repo create <owner>/ttrpg-studio --public \
  --description "Worldbuilding and production of 5E-compatible game material: adventures, cards, DM screen, maps, art." \
  --source . --remote origin
git push -u origin master
```
(Or create the repo in the web UI, then `git remote add origin <url>` and `git push -u origin master`.)

### 3. After the first push
- [ ] GitHub Actions runs automatically on push/PR (Ubuntu + Windows): test suites + denylist + gitleaks secret-scan. For public repos `GITHUB_TOKEN` is provided automatically.
- [ ] Add the CI badge to the top of `README.md`:
  `![CI](https://github.com/<owner>/ttrpg-studio/actions/workflows/ci.yml/badge.svg)`
- [ ] Add `"homepage": "https://github.com/<owner>/ttrpg-studio"` to `.claude-plugin/plugin.json`.
- [ ] (Optional) Enable Issues, set the repo description and topics (`ttrpg`, `5e-compatible`, `worldbuilding`, `claude-code-plugin`).

### 4. Notes for users (already in README)
- The MCP server needs its dependencies: `cd mcp/compendium-reader && npm install`.
- Real HTML→PNG/PDF rendering needs a browser: `npx playwright install chromium`.
- Art and map providers are configured only via environment variables; no key is ever committed.

---

## Italiano

Checklist per pubblicare **TTRPG Studio** come repository GitHub pubblico.

### 1. Pre-volo (devono passare tutti)
- [ ] Test verdi:
  - `cd mcp/compendium-reader && npm install && npm test`
  - `cd lib && npm install && npm test`
  - `cd render && PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install && npm test`
- [ ] Denylist marchi pulita: `node scripts/check-denylist.mjs`
- [ ] Nessun segreto / nessun dato personale nella superficie pubblicabile (verificato).
- [ ] `node_modules/` non tracciato; output generato ignorato (PNG/PDF/`output/`, `battle-map-*.json`); dati utente ignorati (`/setting/`, `/adventures/`, `voice-profile.md`).

### 2. Creare il repository pubblico
Scegli owner/nome, poi (GitHub CLI):
```bash
gh repo create <owner>/ttrpg-studio --public \
  --description "Worldbuilding e produzione di materiale 5E-compatible: avventure, carte, schermo del master, mappe, arte." \
  --source . --remote origin
git push -u origin master
```
(Oppure crea il repo dalla UI web, poi `git remote add origin <url>` e `git push -u origin master`.)

### 3. Dopo il primo push
- [ ] GitHub Actions gira da sola su push/PR (Ubuntu + Windows): suite di test + denylist + secret-scan gitleaks. Per i repo pubblici `GITHUB_TOKEN` è fornito automaticamente.
- [ ] Aggiungi il badge CI in cima al `README.md`:
  `![CI](https://github.com/<owner>/ttrpg-studio/actions/workflows/ci.yml/badge.svg)`
- [ ] Aggiungi `"homepage": "https://github.com/<owner>/ttrpg-studio"` in `.claude-plugin/plugin.json`.
- [ ] (Opzionale) Abilita le Issues, imposta descrizione e topics del repo (`ttrpg`, `5e-compatible`, `worldbuilding`, `claude-code-plugin`).

### 4. Note per gli utenti (già nel README)
- Il server MCP richiede le sue dipendenze: `cd mcp/compendium-reader && npm install`.
- Il rendering reale HTML→PNG/PDF richiede un browser: `npx playwright install chromium`.
- I provider di arte e mappe si configurano solo via variabili d'ambiente; nessuna chiave viene mai committata.

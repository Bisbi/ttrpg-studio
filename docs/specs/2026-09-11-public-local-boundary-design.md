# TTRPG Studio — Confine pubblico/locale + wiki OKF

> **Status:** Approved design — ready for implementation planning
> **Date:** 2026-09-11
> **Target:** repo pubblico `ttrpg-studio` + repo privato annidato `local/`

---

## 1. Problema

Il repo pubblico contiene oggi due cose che non hanno lo stesso diritto di stare online:

1. **il prodotto** — il plugin: `lib/`, `mcp/`, `render/`, `commands/`, `skills/`, `agents/`,
   `templates/`, `docs/`, `examples/`;
2. **l'uso personale del prodotto** — l'adapter di import verso un formato JSON di terze parti,
   le note d'uso, i path della macchina, l'ambientazione personale, la voce d'autore.

Finora la separazione esiste solo per i **dati** (`.gitignore`: `/setting/`, `/adventures/`, `/data/`,
`voice-profile.md`) e per i **contenuti testuali** (`scripts/check-denylist.mjs`). Non esiste per il
**codice**: l'adapter di import è versionato nel repo pubblico e la denylist deve escluderlo
esplicitamente per non fallire.

Manca inoltre un posto dove vive la conoscenza che il codice non dice da solo: trappole note,
deviazioni deliberate dallo standard, invarianti di progetto. Oggi è dispersa in un ledger cronologico
(`.superpowers/sdd/progress.md`) e nella memoria dell'agente — due formati che non si consultano
prima di scrivere codice.

### Debolezze concrete del meccanismo attuale

- **L'eccezione è un buco.** `isExcluded()` salta `lib/import/` e due script: quel codice non è
  sottoposto ad alcun controllo di superficie.
- **La denylist legge i contenuti, non i nomi.** Il nome stesso del vecchio script di import
  conteneva il nome del fornitore ed è `git ls-files`-visibile: nessun controllo lo rileva.
- **Nessuna verifica del confine.** Niente fallisce se un file che doveva restare locale viene
  committato.

## 2. Principio guida

> **La separazione è per file, mai per riga. Un file sta di qua o di là.**

I marcatori inline (`// @local … // @end-local`) sono respinti per una ragione di sicurezza, non di
gusto: metterebbero il contenuto riservato *dentro* un file pubblicato, protetto solo finché una
pipeline di rimozione funziona. Ogni pipeline di rimozione è un punto di fuga, e la fuga avviene in un
repo pubblico, cioè in modo irreversibile.

I tag restano, ma cambiano funzione: **da filtro a dichiarazione verificabile**. Un documento dichiara
`scope: public` o `scope: local`, e uno script fallisce se la dichiarazione è smentita dallo stato di
git. Il tag non nasconde: afferma, e l'affermazione viene controllata.

## 3. Topologia

```
ttrpg-studio/                 repo pubblico (origin: github.com/Bisbi/ttrpg-studio)
├── lib/ mcp/ render/ commands/ skills/ agents/ templates/ docs/ examples/
├── lib/wiki/                 logica OKF (zero dipendenze runtime, testata in lib/test/)
├── lib/bin/wiki.js           CLI degli strumenti wiki
├── wiki/                     bundle OKF PUBBLICO (versionato)
├── AGENTS.md                 ingresso per gli agenti: punta a wiki/ e, se esiste, a local/wiki/
├── .gitignore                → /local/
└── local/                    REPO GIT PRIVATO, ignorato dal pubblico
    ├── wiki/                 bundle OKF LOCALE
    ├── import/               adapter di import + i suoi test
    └── voice/ …
```

**Perché annidato e non fratello.** L'adapter di import dipende da una sola interfaccia pubblica,
`SCHEMAS` di `mcp/compendium-reader/schema/index.js`. Annidato, la dipendenza è `../../mcp/...`: una
risalita, path stabile, un solo `cd` per lavorare su entrambi.

**Perché il confine regge.** `local/` contiene un proprio `.git`. Il repo esterno non può versionarne
il contenuto (al più registrerebbe un gitlink) e il `.gitignore` esclude comunque la directory. Non è
un file che si può dimenticare in un `git add -A`: è un altro repository.

**Verificato che il distacco è pulito.** Nessun modulo di `lib/`, `mcp/`, `commands/` o `skills/`
importa da `lib/import/`; le uniche entrate sono i suoi due file di test, che si spostano con lui.

## 4. Ripartizione del branch `compendio-2024`

Il branch non è mai stato pushato (`origin` ha solo `master`): non c'è storia pubblica da riscrivere.

**La separazione vale anche per la storia, non solo per l'albero corrente.** Rimuovere l'adapter con
un commit in avanti lascerebbe i file nei commit precedenti: una volta che il branch raggiunge
`master` e viene pubblicato, `git log` continua a esporne i nomi — e il nome del fornitore è nel nome
di uno dei file, dove la denylist non guarda perché scansiona i contenuti. Il branch va quindi
**ricostruito** da `master` portando avanti solo il lavoro pubblico, così che l'adapter non compaia in
alcun commit destinato a diventare pubblico.

**Verso il repo pubblico:** schema esteso (`16c9db9`), reader multi-root (`01da21e`), scaffold
`new-campaign` (`8b1ce29`), CHANGELOG e smoke test (parte non-import di `c12f535`).

**Verso `local/`, con storia nuova:** de-tagger (`addc702`), convertitori (`3fd6d11`), importer
(`c11a33d`, `4258dd8`), helper di verifica end-to-end (`422aac8`), messaggio d'errore archivio su
Windows (`d5d729c`).

**Eliminato:** l'eccezione della denylist per l'adapter di import. Se il codice non è nel repo, non
c'è nulla da escludere. `isExcluded()` torna a tre sole eccezioni difendibili (`docs/`, lo script
stesso, i lockfile), e la superficie pubblica torna interamente sotto controllo.

`new-campaign --reference` resta pubblico e generico: accetta qualunque path di compendio di
riferimento. È la *configurazione* a essere locale, non il comando.

## 5. Bundle OKF

[Open Knowledge Format](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing)
v0.1: una directory di markdown con frontmatter YAML, `type` unico campo obbligatorio, `index.md` e
`log.md` come nomi riservati, link markdown ordinari a formare il grafo. Nessun runtime, nessuna
dipendenza.

### Frontmatter

```yaml
---
type: Gotcha
title: CRLF breaks vitest on shebang entry points
description: Files with a shebang and CRLF endings fail under esbuild though node --check passes.
scope: public
covers: [lib/bin/, .gitattributes]
tags: [windows, tooling]
timestamp: 2026-09-11T10:00:00Z
---
```

`type` è richiesto da OKF. `title`, `description`, `tags`, `timestamp` sono opzionali per OKF e
**obbligatori qui**. `scope` e `covers` sono estensioni nostre, ed esistono entrambe per alimentare un
controllo automatico:

- **`scope`** ∈ {`public`, `local`} → verificato da `boundary`;
- **`covers`** — lista di path (file o directory) coperti dal nodo → alimenta `stale`.

### Tipi di nodo

| `type` | Cosa contiene | Cosa NON è |
|---|---|---|
| `Gotcha` | Una trappola: «se fai X succede Y, e non è ovvio» | Un bug aperto (quello sta nell'issue tracker) |
| `Decision` | Una scelta deliberata e il suo perché | Una preferenza di stile |
| `Invariant` | Una proprietà che deve restare vera | Una linea guida consigliata |
| `Module` | La forma di un modulo **quando non è deducibile dal codice** | Un riassunto di ciò che l'agente può leggere |
| `Workflow` | Come si esegue una procedura | Documentazione utente (quella sta in `README`/`docs/`) |

Un nodo `Decision` ha un corpo obbligato in tre parti — **cosa prescrive lo standard**, **perché qui
non si segue**, **cosa si romperebbe seguendolo**. È il tipo che risponde all'osservazione da cui
nasce questo design: un progetto ha punti in cui aderire allo standard peggiora il codice, e quella
conoscenza non sopravvive se non viene scritta.

### File riservati

`index.md` e `log.md` sono **generati** da `lib/wiki/index-gen.js` e non si scrivono a mano. `index.md`
elenca i nodi della sua directory con `type`, `title` e `description`; `log.md` accumula le modifiche
in ordine cronologico inverso.

### Contenuto iniziale

Il seed non inventa nulla: promuove a nodi la conoscenza già accumulata in
`.superpowers/sdd/progress.md`, in `HANDOFF.md` e nella memoria dell'agente.

*Pubblici:* CRLF ed esbuild sugli entry point con shebang · `${{ }}` dentro una mappa YAML inline
rompe il workflow CI · PowerShell 5.1 senza heredoc per i messaggi di commit · formula di
compatibilità nominativa e denylist · doppia licenza codice/contenuti · `lib/` a zero dipendenze
runtime · il principio di §2.

*Locali:* estrazione archivi su Windows · configurazione multi-root e path della macchina ·
ambientazione personale · debiti noti del materiale pregenerato · profilo di voce.

## 6. Politica dei commenti

1. **Header di modulo** — cosa fa il file e quale problema risolve. Sempre presente.
2. **Commenti nel corpo** — solo su scelte non ovvie, e spiegano *perché così*, mai *cosa fa la riga*.
3. **Mai referenziare altro codice** — niente «chiamato da X», «vedi Y», «usato in Z». Un commento
   deve restare vero se l'altro file viene rinominato.

**Corollario.** Se serve scrivere «vedi Y», quella è conoscenza trasversale: è un nodo wiki, non un
commento. È il confine operativo fra i due strumenti, e previene la duplicazione fra commenti e wiki.

**Lingua.** Codice e wiki pubblici in inglese; wiki locale e note d'uso in italiano. Il codice
esistente ha già commenti conformi nel merito (cfr. `lib/import/detag.js`): vanno tradotti, non
riscritti.

### Fonte unica di verità

| Informazione | Dove vive |
|---|---|
| Il perché di *questa riga qui* | Commento nel codice |
| Il perché *trasversale o duraturo* | Nodo wiki |
| Dove un documento ha diritto di stare | `scope` nel frontmatter |

## 7. Strumenti deterministici

Logica in `lib/wiki/` (zero dipendenze runtime, funzioni pure, testate in `lib/test/`), CLI in
`lib/bin/wiki.js`. Il frontmatter è analizzato da un parser proprio su un **sottoinsieme dichiarato**
di YAML — scalari e liste inline — perché `lib/` non può acquisire dipendenze runtime; qualunque
sintassi fuori dal sottoinsieme è un errore esplicito, mai un'interpretazione silenziosa.

| Comando | Funzione | Esito |
|---|---|---|
| `wiki validate` | frontmatter completo e valido, link interni risolvibili | **blocca** |
| `wiki index` | rigenera gli `index.md`, appende a `log.md` | scrive |
| `wiki boundary` | nessun file `scope: local` è tracciato da git; `local/` è ignorato | **blocca** |
| `wiki stale` | nodi il cui `covers` è stato modificato dopo il loro `timestamp` | **elenca** |

`boundary` è l'unico controllo che difende davvero il confine di §2, e blocca sempre.

`stale` produrrà falsi positivi — una ridenominazione cosmetica non invalida un `Gotcha`. Per questo
elenca e non blocca: la decisione è di giudizio e spetta a §8.

Esecuzione: hook di pre-commit e job di CI.

## 8. Guardiano

Un hook `Stop` di Claude Code, in sequenza:

1. nessun file tracciato modificato nel turno → esce, costo nullo;
2. esegue `wiki validate` e `wiki stale`;
3. diff irrilevante (soli test, sola formattazione) → esce; altrimenti avvia un sub-agente su
   **modello piccolo**, con in ingresso il diff, i due `index.md` e l'elenco dei nodi stale;
4. il sub-agente risponde **solo** con: nodi da creare o aggiornare, commenti mancanti o in
   violazione della regola 3 di §6, `scope` sospetti;
5. l'esito raggiunge l'utente come **proposta**.

Il punto 5 è vincolante. Un guardiano che riscrive la wiki da sé a ogni turno produce deriva che
nessuno rilegge, e una wiki di cui ci si fida a torto è peggio di nessuna wiki.

Se l'hook si rivelasse rumoroso o costoso, si sposta a pre-commit senza toccare §7: i due strati sono
indipendenti per costruzione.

## 9. Ordine di realizzazione

1. Topologia e ripartizione del branch — sblocca il merge fermo da luglio
2. Schema OKF e strumenti deterministici
3. Seed dei due bundle e `AGENTS.md`
4. Guardiano
5. Traduzione progressiva dei commenti

## 10. Fuori ambito

- Ricerca full-text sulla wiki (l'`index.md` basta alla dimensione prevista)
- Migrazione di `.superpowers/sdd/progress.md`: resta il ledger cronologico, la wiki è per stato
- Generatore di wiki dalla lettura automatica del codice: i nodi `Module` si scrivono a mano, quando
  servono
- `local/` come pacchetto npm pubblicabile

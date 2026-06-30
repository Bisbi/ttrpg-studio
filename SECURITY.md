# Security Policy / Politica di Sicurezza

**Language / Lingua:** [English](#english) · [Italiano](#italiano)

---

<a name="english"></a>

## English

### Reporting a vulnerability or an accidentally committed secret

Please email **giovanni.bibbo@gmail.com**. Do **not** open public issues for
security reports or for keys/secrets that have ended up in the git history.
Public disclosure can put users at risk before a fix is available, so keep
reports private until the issue has been addressed.

If a secret (such as an API key) has been committed by mistake, treat it as
compromised: rotate/revoke it immediately with the relevant provider, then
report it privately so the history can be cleaned up.

### Provider keys

Keys (for example `IMAGE_API_KEY`) must be supplied **only** through environment
variables, **never** committed to the repository. Do not place real keys in
source files, configuration files, example files, or commit messages. See
README → Configuration.

---

<a name="italiano"></a>

## Italiano

### Segnalare una vulnerabilità o un segreto committato per errore

Scrivi a **giovanni.bibbo@gmail.com**. **Non** aprire issue pubbliche per
segnalazioni di sicurezza o per chiavi/segreti finiti nella git history. La
divulgazione pubblica può mettere a rischio gli utenti prima che sia disponibile
una correzione, quindi mantieni privata la segnalazione finché il problema non è
stato risolto.

Se un segreto (ad esempio una chiave API) è stato committato per errore,
consideralo compromesso: ruotalo/revocalo subito presso il provider relativo,
poi segnalalo in privato così che la history possa essere ripulita.

### Chiavi dei provider

Le chiavi (ad esempio `IMAGE_API_KEY`) si forniscono **solo** tramite variabili
d'ambiente, **mai** nel repo. Non inserire chiavi reali in file sorgente, file
di configurazione, file di esempio o messaggi di commit. Vedi
README → Configurazione.

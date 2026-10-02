---
type: Workflow
title: Combining several compendium folders with GAME_DATA_PATH
description: GAME_DATA_PATH takes several folders separated by a semicolon, and on an id collision the last root listed wins.
scope: public
covers: [mcp/compendium-reader/lib/config.js, mcp/compendium-reader/lib/store.js]
tags: [multi-root, config, mcp]
timestamp: 2026-09-11T17:34:00Z
---

1. `GAME_DATA_PATH` accepts several compendium folders separated by `;` — a semicolon, not a colon.
   Every entry is trimmed, empty entries are dropped, and each remaining one must be an existing,
   readable directory or the server refuses to start.

   In PowerShell, set it for the current session with:

   ```powershell
   $env:GAME_DATA_PATH = "C:\path\to\reference;C:\path\to\campaign\compendium"
   ```

   Note the double quotes: unquoted, PowerShell reads the semicolon as a statement separator and only
   the first folder reaches the variable.

2. **Root order is significant: on an equal `id` between two roots, the last root listed wins.** The
   roots are read in the order given and each record is stored under its `id`, so a later root
   overwrites an earlier one. Put the broad reference compendium first and the campaign's own
   compendium last, so that campaign material overrides the reference wherever the two share an id.

3. A new campaign scaffold already writes this configuration, reference first and campaign
   compendium second.

4. Adding a folder that does not exist, or using `:` as the separator, fails at startup with a
   message naming the offending path rather than silently loading fewer roots.

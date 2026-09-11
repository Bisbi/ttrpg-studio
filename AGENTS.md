# Working in this repository

## Knowledge base

Before writing new code, read `wiki/index.md` and the nodes relevant to what you are about to touch.
It records traps, deliberate departures from standard practice, and invariants that the code does not
state on its own.

If a private bundle exists at `local/wiki/index.md`, read it too. It is not part of this repository and
may be absent.

After a change that produces knowledge the code does not carry by itself, add or update a node. Node
types: `Gotcha`, `Decision`, `Invariant`, `Module`, `Workflow`. A `Decision` must contain the sections
`## Standard`, `## Why not here`, `## What breaks`.

Never edit `index.md` or `log.md` by hand — regenerate them:

```
node lib/bin/wiki.js index
```

## Comments

- A module header on every file: what it does, which problem it solves.
- Body comments only on non-obvious choices, and they say **why**, not what.
- **Never reference other code** — no "called by X", "see Y", "used in Z".
- If you want to write "see Y", that is a wiki node, not a comment.
- English in this repository; the private bundle is in Italian.

## Boundary

Public material lives here. Personal use of the plugin — the import adapter, machine paths, setting
material, the author voice profile — lives in `local/`, a separate private repository ignored by this
one. The separation is by file, never by line.

```
node lib/bin/wiki.js boundary
node scripts/check-denylist.mjs
```

Both run in pre-commit and in CI, and both block.

## Environment

Shell is PowerShell 5.1: no heredocs, no `&&`, one `-m` per commit message line. Line endings are LF.
`lib/` takes no runtime dependencies.

---
type: Gotcha
title: CRLF endings break vitest on shebang entry points
description: An entry point with a shebang and CRLF line endings fails under esbuild while node --check still passes.
scope: public
covers: [lib/bin/, .gitattributes]
tags: [windows, tooling, tests]
timestamp: 2026-09-11T12:00:00Z
---

A file that starts with `#!/usr/bin/env node` and carries CRLF line endings is rejected by the esbuild
transform vitest runs, with an error that points at the first line and explains nothing. `node --check`
on the same file reports no problem, which sends you looking in the wrong place.

`.gitattributes` pins the repository to `eol=lf` for this reason. An editor configured to write CRLF,
or a file created by a Windows tool that ignores the attribute, reintroduces the failure.

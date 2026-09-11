---
type: Invariant
title: Only nominative compatibility wording, never a third-party trademark
description: The public surface says 5E-compatible and never names the game or its publisher.
scope: public
covers: [scripts/check-denylist.mjs, README.md, commands/, skills/]
tags: [legal, publishing]
timestamp: 2026-09-11T12:00:00Z
---

No third-party trademark appears in code, file names, command names, or documentation. The only
permitted formulation is nominative compatibility: "5E-compatible".

`scripts/check-denylist.mjs` enforces this over every tracked file, with three exceptions that are
deliberate and should stay that way: `docs/` holds internal design documents, the script itself
carries the forbidden terms as data, and lockfiles name third-party packages outside our control.

The check reads file **contents**, not file **names**. A file whose name carries a vendor name passes
the check while still exposing it through `git ls-files`.

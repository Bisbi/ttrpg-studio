---
type: Invariant
title: Only nominative compatibility wording, never a third-party trademark
description: The public surface says 5E-compatible and never names the game or its publisher.
scope: public
covers: [scripts/check-denylist.mjs, README.md, commands/, skills/, docs/]
tags: [legal, publishing]
timestamp: 2026-09-11T12:00:00Z
---

No third-party trademark appears in code, file names, command names, or documentation. The only
permitted formulation is nominative compatibility: "5E-compatible".

**One carve-out, and it is closed.** A handful of design documents written before this rule existed
still contain such terms, and were published that way. They are grandfathered until a cleanup pass
rewrites them; they are listed by name in the check, so the exemption cannot spread. Every document
written after the rule is scanned like everything else, and a new file does not inherit the exemption
by sitting in the same directory. Read those legacy documents as history, never as precedent.

`scripts/check-denylist.mjs` enforces this over every tracked file, with three exceptions that are
deliberate: the named legacy documents above, the script itself (it carries the forbidden terms as
data), and lockfiles (they name third-party packages outside our control).

The check reads file **contents**, not file **names**. A file whose name carries a vendor name passes
the check while still exposing it through `git ls-files`.

---
type: Decision
title: Comments explain the code they sit in and never reference other code
description: No "called by X" or "see Y" - cross-file knowledge belongs in a wiki node instead.
scope: public
covers: [lib/, mcp/, render/]
tags: [conventions]
timestamp: 2026-09-11T17:34:00Z
---

## Standard

A widespread convention is to use comments as navigation aids, pointing at callers, collaborators, and
related modules so a reader can follow the flow from any starting point.

## Why not here

A comment that names another file stops being true the moment that file is renamed or its caller
changes, and nothing fails when it does. It also creates a phantom coupling: the reader believes the
relationship is maintained.

The rules are: a module header stating what the file does and which problem it solves, always; body
comments only on non-obvious choices, explaining why rather than what; no references to other code.

The corollary is the useful half. When the urge to write "see Y" appears, the knowledge is
cross-cutting and belongs in a wiki node, which is versioned, indexed, and checked for staleness. That
is the operating boundary between the two tools, and it is what keeps them from duplicating each other.

## What breaks

Allowing cross-references would reintroduce comments that go stale silently, and would remove the
signal that tells an author when something should have been a wiki node.

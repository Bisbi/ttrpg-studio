---
type: Invariant
title: The lib package carries no runtime dependencies
description: lib/ has only vitest in devDependencies, and every deterministic feature is built on the standard library.
scope: public
covers: [lib/package.json, lib/]
tags: [architecture]
timestamp: 2026-09-11T17:34:00Z
---

`lib/` holds the deterministic logic of the plugin and installs nothing at runtime. Browser automation
lives in the separate `render/` package, and the MCP server keeps its own dependencies in
`mcp/compendium-reader/`.

The practical consequence is that anything `lib/` needs must be written against the Node standard
library: a YAML subset parser rather than a YAML package, a hand-written argument parser rather than a
CLI framework.

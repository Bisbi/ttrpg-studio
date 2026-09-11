---
type: Gotcha
title: Workflow expressions inside an inline YAML map break the run
description: Using an expression inside inline map braces makes the workflow fail in zero seconds with no useful message.
scope: public
covers: [.github/workflows/ci.yml]
tags: [ci, yaml]
timestamp: 2026-09-11T12:00:00Z
---

Placing a workflow expression inside inline map braces produces a parse failure: the run ends in about
zero seconds and the log shows nothing that names the offending line. Write the value on its own key
over multiple lines instead of using the inline form.

---
type: Gotcha
title: Multi-line commit messages break the PowerShell parser
description: Parentheses and newlines inside a commit message argument are parsed as shell syntax.
scope: public
covers: [.githooks/]
tags: [windows, git]
timestamp: 2026-09-11T12:00:00Z
---

PowerShell 5.1 parses parentheses and newlines inside an unquoted argument as shell syntax, so a
multi-line commit message fails before git ever sees it. Pass one `-m` per line, or write the message
to a file and use `git commit -F`.

The same shell has no `&&` chaining operator: use `;` or `X; if ($?) { Y }`.

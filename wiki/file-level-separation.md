---
type: Decision
title: Public and private material are separated by file, never by line
description: A nested private repository replaces inline markers for keeping personal use out of the published surface.
scope: public
covers: [.gitignore, lib/wiki/boundary.js]
tags: [architecture, publishing]
timestamp: 2026-09-11T17:34:00Z
---

## Standard

The common way to keep private fragments out of a published artefact is to mark them inline and strip
them at build time, with paired markers around the regions to remove.

## Why not here

That approach stores the private content inside a file that does get published, protected only for as
long as the stripping step works. Every stripping step is a place where the content escapes, and the
escape happens into a public repository, which cannot be undone.

Here the unit of separation is the file. Private material lives in `local/`, a separate git repository
that the public one ignores, so the outer repository cannot version its contents even by accident.
Documents declare `scope: public` or `scope: local`, and `wiki boundary` fails when the declaration
disagrees with what git tracks. The tag asserts; the check makes the assertion worth something.

## What breaks

Following the inline-marker approach would put private paths, personal setting material, and the
import adapter back inside tracked files, and would replace a failing check with a transformation step
whose silent failure is indistinguishable from success.

---
type: Gotcha
title: A shallow checkout makes the secret scan step fail instead of skip
description: Without full history, the secret scanner cannot resolve the pull request's commit range and the run fails with no secret ever having been checked.
scope: public
covers: [.github/workflows/ci.yml]
tags: [ci, git]
timestamp: 2026-09-11T17:56:00Z
---

The secret scanning step computes the commit range for a pull request as the parent of its first
commit through its last commit, then asks git to resolve that range. On a shallow checkout, history
stops at some fixed depth back from the tip; once the branch has more commits than that depth, the
parent of the branch's first commit sits on the base branch outside the shallow window and is simply
not present locally. Git responds with an "ambiguous argument ... unknown revision or path not in the
working tree" error and the step exits non-zero. No secret is found in that failure - the scan never
runs at all, so the exit code says nothing about whether the code is clean.

This stayed hidden for a long time because a shallow clone still contains a bounded number of recent
commits, and small pushes fit inside that window by chance: the base-branch parent commit happens to
be included anyway. The defect only surfaces once a single pull request accumulates enough commits to
push the required parent commit past the shallow boundary, which is a property of the pull request's
size, not of the code it introduces.

The fix is to give the checkout full history rather than a shallow one, so every commit range the
scanner needs to resolve is guaranteed to exist locally regardless of how many commits a pull request
contains.

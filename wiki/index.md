# Index

## Gotcha

- [CRLF endings break vitest on shebang entry points](crlf-shebang-entry-points.md) — An entry point with a shebang and CRLF line endings fails under esbuild while node --check still passes.
- [Multi-line commit messages break the PowerShell parser](powershell-commit-messages.md) — Parentheses and newlines inside a commit message argument are parsed as shell syntax.
- [Workflow expressions inside an inline YAML map break the run](ci-inline-yaml-expressions.md) — Using an expression inside inline map braces makes the workflow fail in zero seconds with no useful message.

## Decision

- [Comments explain the code they sit in and never reference other code](comment-policy.md) — No "called by X" or "see Y" - cross-file knowledge belongs in a wiki node instead.
- [Public and private material are separated by file, never by line](file-level-separation.md) — A nested private repository replaces inline markers for keeping personal use out of the published surface.

## Invariant

- [Code is Apache-2.0, content is CC-BY-4.0](dual-licensing.md) — Two licences cover two different kinds of artefact in the same repository.
- [Only nominative compatibility wording, never a third-party trademark](compatibility-wording.md) — The public surface says 5E-compatible and never names the game or its publisher.
- [The lib package carries no runtime dependencies](lib-zero-runtime-deps.md) — lib/ has only vitest in devDependencies, and every deterministic feature is built on the standard library.

## Workflow

- [Combining several compendium folders with GAME_DATA_PATH](multi-root-configuration.md) — GAME_DATA_PATH takes several folders separated by a semicolon, and on an id collision the last root listed wins.

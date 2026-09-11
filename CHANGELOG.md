# Changelog

**[English](#changelog)** · **[Italiano](#changelog-it)**

## [Unreleased]
### Added
- Foundation: repo skeleton, compliance files, `compendium-reader` MCP, sample
  homebrew dataset, CI.
- Multi-root compendium reader (`GAME_DATA_PATH` `;`-separated, merged by type).
- Extended schema record types: `species`, `background`, `feat`, `class`,
  `condition`, `deity`, `npc`, `pc`.
- `new-campaign` command: scaffolds a campaign project (Setting Bible, original
  compendium, output tree, `.claude/settings.json` config).

### Changed
- The import adapter now lives in a private repository outside the public surface.
- Denylist exceptions reduced to `docs/`, the script itself, and lockfiles.

---

# Changelog (IT)

**[English](#changelog)** · **[Italiano](#changelog-it)**

## [Unreleased]
### Added
- Foundation: scheletro repo, file di compliance, MCP `compendium-reader`,
  dataset homebrew d'esempio, CI.
- Reader compendio multi-root (`GAME_DATA_PATH` `;`-separato, fuso per tipo).
- Tipi schema estesi: `species`, `background`, `feat`, `class`, `condition`,
  `deity`, `npc`, `pc`.
- Comando `new-campaign`: scaffolda una campagna (Setting Bible, compendio
  originale, albero di output, config `.claude/settings.json`).

### Changed
- L'adapter di import vive ora in un repository privato, fuori dalla superficie
  pubblicabile.
- Eccezioni della denylist ridotte a `docs/`, lo script stesso e i lockfile.

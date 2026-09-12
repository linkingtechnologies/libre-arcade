# Changelog

## Unreleased

- Resolved the licensing question: located and dated (via the Wayback
  Machine) nklein software's own "Universal, Non-Exclusive License" at
  `nklein.com/etc/copyright.php`, which the 2001 archive's own webpage
  source was wired into, bracketing the 54321 release by dated captures
  from 2001 and 2005 and corroborated by LibreGameWiki. Original material
  is now formally licensed `LicenseRef-NKlein-Universal-NonExclusive`
  (`LICENSES/`, `REUSE.toml`); this repository's own browser-shell and
  faithful game-logic port are GPL-3.0-or-later. See `PROVENANCE.md` and
  `docs/LICENSE-RESEARCH.md`. Linked from the collection's public
  `index.html`/`README.md` as a result.
- Added to the Libre Arcade repository: restructured into the shared
  `public/` → `game/` layout, added `dev`/`build`/`start`/`lint` npm scripts
  and an ESLint config, and `PROVENANCE.md`/`SOFTWARE_ARCHAEOLOGY.md` linking
  back to the collection's own philosophy document. No gameplay or parity
  content changed.

## Milestone 8 — final EN/IT string audit and 58-test suite

- Generalized dimensional help to all five advertised games (previously
  Maze Runner only).
- Localized outcome overlays and completed the English/Italian string audit.
- Detailed archaeology dossier (`docs/archaeology/`), repository cleanup and
  `.gitignore`.

## Milestones 6-7 — production pass

- Added Maze Runner dimensional help, IT/EN localization, the reconstructed
  `SoundDev::ding()` Web Audio implementation, runtime-asset byte-integrity
  tests, and the release checklist in `docs/PRODUCTION-READINESS.md`.

## Milestones 1-5 — the five advertised games

- Ported Flip-Flop, Bomb Squad, Maze Runner, Peg Jumper and Tile Slider from
  Patrick Stein's 54321 (nklein software, 1.0.2001.11.16, 2001 1 MB SDL Game
  Programming Contest) to HTML5 Canvas 2D: the shared `Cube` n-dimensional
  topology, per-game rules and difficulty tables, wrap behavior, and selected
  original artwork verified byte-identical against `/reference`.
- Documented, not ported: the compiled hidden Life mode/easter egg, and
  SDL/SDL_image native window management (replaced by Canvas 2D with no
  original counterpart to be faithful to). See `SOFTWARE_ARCHAEOLOGY.md` and
  `PROVENANCE.md`.

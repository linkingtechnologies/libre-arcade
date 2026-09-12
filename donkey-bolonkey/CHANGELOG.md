# Changelog

## Unreleased

- Joined the Libre Arcade collection: restructured into the shared
  `public/` → `game/` layout, added `dev`/`build`/`start`/`lint` npm scripts
  and an ESLint config, and `PROVENANCE.md`/`SOFTWARE_ARCHAEOLOGY.md` linking
  back to the collection's own philosophy document. No gameplay, parity, or
  licensing content changed.

## Milestone 5 — production pass

- Added responsive desktop/mobile UI, touch controls, a real text field for
  high-score name entry, and localStorage persistence for the best score.
- 34-test suite covering gameplay, flow, audio events, six-level end-to-end
  progression, source-derived traces, bilingual UI structure, production
  markup and the repo-safe asset boundary.
- Headless layout pass from 320×568 through 1366×768; canvas keeps a 4:3
  display box, no document scrolling.

## Milestones 2-4 — faithful port and asset boundary

- Ported all six historical levels, gameplay loop, scoring, crusher/death
  behavior, particle equations and cadence, and title/banner timing from
  David A. Capello's Donkey Bolonkey (SpeedHack 2001, GPL-2.0-or-later).
- Established the asset boundary: the historical Allegro datafile
  (`dkbk.dat`), original tarball, and two screenshots are excluded from the
  public package for unclear media provenance (see `specs/ASSET_AUDIT.md`).
  Replaced with procedural graphics and Web Audio synthesis instead of
  researching clearance for the original assets.
- Documented, not ported: Allegro/DJGPP window, input and audio backends,
  and the exact libc `rand()` sequence (platform-dependent). See
  `SOFTWARE_ARCHAEOLOGY.md` and `PROVENANCE.md`.

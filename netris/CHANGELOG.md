# Changelog

## Unreleased

- Ported `sr.c` ("a sample robot for Netris", 1994-1996) — a Tetris-playing
  heuristic Mark Weaver wrote to demonstrate the original's external-robot
  pipe protocol, essentially unseen by players — as a selectable in-game
  autopilot (press `a`). The scoring and decision functions are ported
  directly; only the pipe-protocol I/O is replaced with direct calls into
  the engine. See `SOFTWARE_ARCHAEOLOGY.md`, `PROVENANCE.md`, and
  `specs/port-map.md`.

## 1.0.0 — 2026-09-07

- Ported the single-player core of Netris 0.52 (1994–1999, Mark H. Weaver,
  GPL-2.0-or-later) to JavaScript: board, the seven standard pieces (kept
  as the original's own turtle-graphics representation), falling, locking,
  line clearing, and the exact random-number generator. See
  `SOFTWARE_ARCHAEOLOGY.md` and `PROVENANCE.md`.
- Added a dependency-free canvas UI and dev tooling
  (`npm run dev`/`build`/`start`/`test`/`lint`/`check`), servable by any
  static web server with no framework or hosting platform required.
- Documented, not ported: the original's network two-player mode
  (`inet.c`), its external-robot pipe protocol (`robot.c`), and the sample
  Tetris-playing heuristic written to demonstrate that protocol (`sr.c`).

# Provenance

| Layer | Source | Exact revision | License | Treatment |
|---|---|---|---|---|
| Game engine (board, pieces, RNG, single-player rules) | [Netris](https://web.archive.org/web/20110831162119/http://netris.org/) by Mark H. Weaver | 0.52 (upstream tarball timestamped 13 Aug 2003; `game.c`'s own CVS `$Id$` tag shows the underlying code last changed 16 May 1999) | GPL-2.0-or-later | Preserved unmodified in `reference/netris/`; ported line-by-line to JavaScript in `public/src/engine.js` |
| Autopilot heuristic (`sr.c`, "a sample robot for Netris") | same source, by the same author | same tarball; `sr.c`'s own `$Id$` tag shows 9 Feb 1996 | GPL-2.0-or-later | Preserved unmodified in `reference/netris/`; ported function-for-function to `public/src/robot.js`, with only the pipe-protocol I/O layer replaced by direct calls into the engine — see `specs/port-map.md` |
| Web UI, canvas rendering, keyboard bindings | this repository | — | GPL-3.0-or-later | New code; no original counterpart (the original's UI was a terminal, `curses.c`) |

The frozen upstream tree in `reference/netris/` retains its original GPL-2.0-or-later license and copyright notices unmodified. The port exercises that license's "or later" permission to distribute this project as a whole under GPL-3.0-or-later; see [`LICENSE`](LICENSE) and [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

## What was not ported, and why

- **`inet.c`** (TCP two-player play) — requires a network server; meaningless for a single client-side browser game with no backend.
- **`robot.c`** — not an AI opponent. It is a line-based pipe protocol for driving Netris from an external process; it contains no play-selection algorithm of its own to preserve.
- **`curses.c`** — a terminal renderer, replaced with `public/src/ui.js`'s HTML5 canvas rendering, which has no original counterpart to be faithful to.

None of this is a "faithful port, improved" — it is scope the browser environment cannot meaningfully carry over. The single-player rules — spawn point, falling, locking, line clearing, the exact RNG, and the deliberate absence of scoring or automatic speed-up — are preserved exactly, and so is `sr.c`'s decision heuristic, now reachable in-game as the autopilot (press `a`) instead of only through `robot.c`'s external pipe.

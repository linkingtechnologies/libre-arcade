# The software archaeology behind Donkey Bolonkey

This is Donkey Bolonkey's own recovery story. For the philosophy shared by
every game in this collection — why reasoning is preserved rather than just
artifacts, why verification runs against executable originals rather than
screenshots, why provenance gaps are written down rather than smoothed over
— see [`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).

## Fifty-four hours, one weekend, one competition

David A. Capello — later the creator of Aseprite — wrote Donkey Bolonkey in
three days for SpeedHack 2001, a competition where independent programmers
met and wrote a complete game alone over a single weekend. His own
`readme.txt` logs the schedule literally hour by hour: Friday 10am to 2am,
Saturday 8am to 2am, Sunday 8am to 4am Monday, a ZIP emailed to the
organizer at 4:30am — "54 hours awake IN TOTAL," by his own count, minus
whatever time went to eating. The competition's own rules are baked into
the game's premise: it had to be a puzzle, it had to have a high-score
table, a particle system, a "banner," and — the one that produced the
name — it had to contain at least one donkey. Capello built a color-match
puzzle (his own README calls it a "Rat-Poker clone... only with donkeys")
that satisfies every rule of a contest brief, including the silly one, and
the result is what's preserved here.

## A license that didn't need any research at all

Unlike this collection's other software-archaeology cases, Donkey
Bolonkey's licensing required no detective work. Every single source
file's header states, verbatim: "either version 2 of the License, or (at
your option) any later version" — the author's own explicit grant, printed
at the top of `main.c`, `donkey.c`, and every other file, not a claim
recovered from a wiki or a Wayback Machine capture. `PROVENANCE.md` treats
this the same way [`netris/PROVENANCE.md`](../netris/PROVENANCE.md) treats
Netris's confirmed "or later" grant: the frozen original keeps its own
GPL-2.0-or-later notices, and this repository distributes the whole project,
including the ported logic, under GPL-3.0-or-later.

## Choosing not to use the assets, rather than researching whether it's allowed

The original SpeedHack README credits its own sound effects with unusual
candor: a motor sound "believe it or not, comes from a Playstation Colin
McRae Rally game," a donkey scream that's actually Capello's own voice
pitched up because "all sounded weird," a crusher sound made by hitting a
table plus a mouth noise, three background images "from a CD." None of that
has a documented redistribution grant of its own — it's charming
work-diary honesty, not a license. Rather than chase down whether a 2001
PlayStation rip and an unnamed CD's backgrounds could be cleared for reuse
(the kind of research this collection did for 54321's license), this
restoration takes the simpler, more conservative path: it excludes
`dkbk.dat` — the one file that contains all of it — from the repository
entirely, and rebuilds every sprite procedurally and every sound with
synthesized Web Audio. `test/production.test.js` enforces this as a
standing regression: no shipped file may reference `dkbk.dat` by name. The
game's actual, unambiguously-licensed content — the C source and level
data — is what gets faithfully ported; the ambiguously-sourced content
simply isn't carried forward at all.

## A game whose real language is a level file

`levels.h` is not configuration in the usual sense — it's the whole
authorial toolkit exposed as a tiny grammar of one-letter block types (`L`,
`U`, `R`, `D` for forced-direction movement, `H` for the single spawn point,
`E` for exits, `S` for waiting cells, `B` for the player's bubble, `T` for a
bubble's target), combined with the OR operator to stack directions and
behaviors on one cell. The original README explains how to add a level by
editing this file directly and adding a `case` to a `switch` in
`reset_level()` — no separate editor, no data format beyond the C header
itself. `public/src/core/levels.js` is a mechanical transcription of all six
level matrices from that exact file, not a redrawn approximation, so the
topology, spawn point, and every forced-direction cell match the original
author's own layout bit for bit — see `specs/ARCHAEOLOGY.md`.

## Verifying gameplay no compiler in this environment can run

`donkey.c`, `crusher.c`, and `particle.c` between them define death-donkey
timing, crusher hand-off, alarm cadence, and particle physics with equations
never observable just from playing the game — cascades, chain limits, and a
draw order (level → donkeys → young particles → crusher → older particles →
UI) that has to be read out of the C source directly. With no Allegro 4
toolchain available in this environment to build and trace the original
executable, this port relies on the next-strongest verification level in
this collection's own hierarchy: a source-derived deterministic trace,
checked into `test/fixtures/c-source-derived-level1-trace.json` and
replayed by `test/flow-parity.test.js` against the transcribed logic, plus
an end-to-end six-level state-progression test. `specs/PARITY.md` records
this honestly as "Implemented," not "verified against a native binary" —
the native Allegro trace is named as a specific, still-open future target,
not silently assumed complete.

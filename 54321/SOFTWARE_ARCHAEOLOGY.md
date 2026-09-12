# The software archaeology behind 54321

This is 54321's own recovery story. For the philosophy shared by every game
in this collection — why reasoning is preserved rather than just artifacts,
why verification runs against executable originals rather than screenshots,
why provenance gaps are written down rather than smoothed over — see
[`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md). This game also
has an unresolved provenance gap of its own kind — a missing *license*, not
a missing *source* — recorded in full in [`PROVENANCE.md`](PROVENANCE.md);
this file is about the game itself.

## Five games sharing one four-dimensional die

Patrick Stein built 54321 for the 2001 1 MB SDL Game Programming Contest —
Flip-Flop, Bomb Squad, Maze Runner, Peg Jumper and Tile Slider all sit on top
of one `Cube` model: a side length of 4 cells, up to 4 active axes, orthogonal
neighbours only, and an optional wrap that joins opposite edges per axis. The
"3D" and "4D" advertised on the box are not a polygonal engine — the contest
entry contains no 3D mesh code at all. Higher dimensions are rendered as
stacked 2D tiers, exactly as `code/view.cpp` blits them with SDL. Recognizing
that distinction early (`docs/archaeology/TECHNICAL_NOTES.md`) is what kept
this port on Canvas 2D instead of reaching for WebGL to build a "3D game"
that was never 3D-rendered in the first place.

## A counter the original author forgot to reset

`Peg::reset()` in the original never initializes `stepsTaken`, even though
the Noweb prose describing the class says game statistics are reset. In 2001
C++, that left the step counter holding whatever garbage value happened to
be in memory — undefined, not zero, not random-looking on purpose, just
whatever the allocator handed back. A browser port has no equivalent
"undefined" to reproduce; JavaScript numbers don't inherit stack garbage.
Rather than fabricate a plausible-looking random value to *simulate*
undefined behavior — which would be inventing a new, false kind of
"faithfulness" — `public/src/games/pegjumper.js` initializes it to zero and
`docs/PARITY.md` documents the discrepancy by name. Preserving reasoning
sometimes means preserving the honest boundary of what a straight port
*can't* preserve, not papering over it.

## A maze that tells you which walls are real, eight ways

`code/maze.cpp` builds its labyrinth as a randomized minimum-spanning-tree
carve: start with every orthogonal wall bit set on every cell, visit
candidate walls in random order, and remove a wall whenever it connects two
still-disconnected regions — with a difficulty-tuned chance to also knock out
an already-redundant wall (20% Easy, 10% Medium, 0% Hard). Hard mode is
consequently a mathematically perfect maze: exactly `cellCount − 1`
passages, one unique path between any two cells. `wall0.png` through
`wall7.png` — eight separate sprites for the eight negative/positive walls
across up to four axes — are the original's own way of drawing a concept a
modern implementation might collapse into a single bitmask icon. The port
keeps all eight, and a regression test checks wall symmetry across every
neighbouring cell pair, because a wall that's only visible from one side of
a shared edge would be a bug the original never had.

## Help text as a tiny scripting language

The original's in-game manual isn't prose rendered by a text engine — it's
`.hlp` files, a line-oriented script of commands (`image`, `subimage`,
`text_center`, `button`, `update`) that the original interprets to build
each help screen. That's a deliberately small domain-specific language
written to fit inside a 1-megabyte contest entry, alongside `.peg` board
files that similarly ignore every character except `-`, `o`, and `x`. Both
formats are preserved untouched under `reference/`, and the embedded Peg
Jumper board data in `public/src/games/pegboards.js` is regression-tested
character-for-character against all 18 original `.peg` payloads — including
confirming that every wrap/non-wrap file pair the original shipped encodes
identical board contents, a fact about the original author's own data that
isn't visible from playing the game at all.

## A sound with no sound file

`SoundDev::ding()` doesn't play a sample — it opens an 8 kHz mono 8-bit SDL
audio device and synthesizes the "ding" as a short generated waveform, so
the entire contest entry ships with zero bundled sound assets. The browser
port reconstructs the same idea with Web Audio rather than recording the
original device's output as a sample, which is why `PROVENANCE.md`
classifies it as a reconstructed *implementation* of an algorithm, not a
preserved *asset* — the same distinction the collection draws for Netris's
turtle-graphics pieces or For Science!'s Python 2.7 oracle: faithful to the
generating process, not just to one recorded output of it.

## A dossier that documents its own hidden game

The original binary also contains a compiled **Life** mode/easter egg —
`code/life.cpp`, `lifeController.cpp`, `lifeView.cpp` are all present in
`reference/`. It is not one of the five games the 2001 release advertised,
and `docs/archaeology/HISTORY.md` and `docs/ARCHAEOLOGY.md` record its
existence and activation path without porting it into the five-game
selector — preserving the discovery itself as part of the record, per this
collection's [own rule](../SOFTWARE_ARCHAEOLOGY.md#preserve-the-reasoning-not-just-the-artifact)
that what a programmer built and shipped, including the parts most players
never saw, is worth keeping legible.

## A license found by following the tarball's own includes, not by assuming one

Nearly every other restoration in this collection can point to a `COPYING`
file or a project page that names a license in words. 54321's archive has
neither — no `LICENSE`/`COPYING`, and no license line in its README. The
first pass at this research stopped there, at "unresolved," rather than
round an absence up to "probably fine." That caution was itself correct
practice; what changed is that the search continued instead of stopping.

The tarball's own webpage source — `data/webpage/hdr.php`, `tail.php` —
includes `nklein.com`'s site-wide `etc/hdr.php`/`etc/tail.php` header and
footer rather than standing alone. That's not a stylistic choice; it means
the 2001 release's own author wired his product page into whatever
copyright regime his site published globally, at the time he published it.
Following that thread to `nklein.com/etc/copyright.php` and fetching it from
the Wayback Machine — once from five months *before* the release and once
five months *after* — turned up the actual text: a "Universal, Non-Exclusive
License" granting broad copy/modify/redistribute rights, present and
unchanged years before anyone needed it for this port. LibreGameWiki,
consulted independently, cites the identical URL for the identical
classification. None of this required assuming anything; it required
reading what the preserved source itself pointed to and checking whether
that page still existed. See `docs/LICENSE-RESEARCH.md` for the full
citation trail and `PROVENANCE.md` for what it means for reuse: the original
material keeps that license, never GPL; this repository's own port code
does not.

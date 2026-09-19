# The software archaeology behind Disk Field

This is Disk Field's own recovery story. For the philosophy shared by every
game in this collection (why reasoning is preserved rather than just
artifacts, why verification runs against executable originals rather than
screenshots, why an unresolved search is reported as *unknown* rather than
*impossible*) see [`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).

This game carries an unusually complete public dossier already:
[`archaeology/README.md`](archaeology/README.md) indexes the full audit, the
1.0 to 1.01 source diff, per-file hashes, the oracle report and the rights
audit, and [`docs/milestones/`](docs/milestones/) records the port's own
history. This file does not repeat them. It picks out what makes this
specimen unusual and what integration into the collection checked again.

## A game frozen on the day the jam ended

PyWeek 5 ran from 2 to 9 September 2007. The contest release is `1.0`; the
author shipped `1.01` on 25 September. The two archives differ in 43 versus 33
files, and the difference is almost entirely packaging: 27 common files are
byte-identical, 5 changed, 11 compiled `.pyc` caches were dropped and one
`CHANGES.txt` was added. Every file under `data/` is identical, and so are
`DfConstants.py`, `DfDisk.py`, `DfLevelData.py`, `DfObjects.py` and
`DfVector.py`: the physics, the force formulas and all 17 levels did not move.

What changed is the shell around them. A crash on 64-bit systems (a
`glGenTextures()` result that had to be cast to `int`), crisper text on
graphics cards with non-power-of-two textures, cheaper arrow drawing, a mixer
initialization change, and a line in the author's own `CHANGES.txt` saying the
release version had psyco, the optional Python accelerator, disabled by
accident. The archaeological
answer to "what changed after the jam?" is that a finished design was
hardened, not revised. The port therefore takes 1.01 as its baseline and keeps
1.0 as the contest snapshot.

## Ticks, not seconds

The original advances one simulation step per rendered frame and never
multiplies by elapsed time. Per the audit's reading of `DfMain.py`,
`Clock.tick(30)` caps the frame rate but never catches up, so on a slow
machine the game runs slow. That makes the psyco
accident a gameplay fact, not just a performance one: the contest build could
fall below 30 steps a second where 1.01 did not, without a single per-tick
trajectory differing. The port runs a fixed 30 Hz simulation independent of
the display refresh, which is the one place it deliberately behaves more
consistently than the original.

## Float32 on purpose

The original keeps disk and field vectors in NumPy `float32` arrays, then
promotes to `float64` the first time a field vector is rotated, because the
rotation goes through a `matrix` of doubles. Matching the original's numbers
means matching that promotion. `engine.mjs` does it with `Math.fround` and
per-vector flags, so an arrow that has never been rotated stays `float32`
while one that has been rotated is a double. The oracle comparison stays
under 0.0025 px of positional drift over the recorded runs, including the long
cases that rotate the field.

## What the oracle is, and is not

The reference traces come from the original Python modules run headless under
current Python and NumPy with small stubs for Pygame and OpenGL. No Python 2
runtime was available, so nothing here claims bit-exact equivalence with the
2007 executable. Seven cases (2,238 ticks) and 85 vector-field samples are
compared against the port; every discrete event column matches exactly.

Integration added one check of its own. The seven Python modules bundled for
the oracle are not the archive's bytes untouched. Five of them
(`DfArrow`, `DfConstants`, `DfDisk`, `DfVector`, `DfWorld`) hash to exactly the
manifest's 1.01 values once LF is turned back into CRLF, so they are the
original code with normalized line endings. `DfLevelData.py` and
`DfObjects.py` are a few bytes off even after that, and the exact edits cannot
be listed without the private archive. `PROVENANCE.md` says so plainly, and
the dossier's earlier wording ("selected historical Python implementation
modules") was corrected to match.

## Fossils

The source keeps the traces of features the author cut. There are crumble
walls and a spin-to-break rule that no active level uses, matching the
author's own post-mortem about abandoning spin-to-break as hard to control.
There are disk shrink, grow and blade methods with no callers, power-up
colors without a power-up system, multi-disk plumbing with no disk-disk
collision, and a `WallGenerator` that only appears in a legacy block after an
early `return`. `DfHelpers.py` is empty and `DfData.py` duplicates `data.py`
byte for byte. Two quirks survive into play: a killer-wall reset restores
position and linear speed but keeps the disk's spin, and
`MovingObject.isMoving()` reads an attribute nothing ever sets, which only
works because every active mover has another truthy term ahead of it. The
port keeps the first quirk, since it is behavior, and models the second as a
plain "moving" flag that agrees with the original on all 17 levels.

## The font that needs a letter

The original bundle includes `MAKISUPA.TTF`, whose own license text asks for
written permission before it is included in distributed software or
collections. The music has an attribution but no license, five sound files
carry names that resemble old Freesound uploads whose license pages were never
recovered, and three collision sounds carry nothing but an encoder tag.
[`archaeology/inventories/asset-license-audit.csv`](archaeology/inventories/asset-license-audit.csv)
records each file's hash and status. None of it ships. The lettering is drawn
procedurally on the canvas, and the sound and music are synthesized, so the
public payload contains no font or audio file at all.

## A remake the source never reached

Contemporary coverage and Kongregate credit a later browser Disk Field by the
same author, released on 24 July 2009. The audit found no source or
repository for it, so the lineage is recorded here as "concluded in Python in
2007, continued as a Flash game whose code was not found", not as abandoned.

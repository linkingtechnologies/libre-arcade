# The software archaeology behind Wok

This is Wok's own recovery story. For the philosophy shared by every game in
this collection — why reasoning is preserved rather than just artifacts,
why verification runs against executable originals rather than screenshots,
why provenance gaps are written down rather than smoothed over — see
[`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).

## A contest game from one of freeware gaming's most prolific authors

Kenta Cho wrote Wok for the 2001 SDL Game Development Contest — one entry
among a body of work (rRootage, Torus Trooper, Tumiki Fighters, and dozens
more) released consistently under the same short, plainly-worded permissive
notice. That consistency matters here: this collection didn't have to guess
whether "Copyright 2001 Kenta Cho, all rights reserved" plus a two-clause
redistribution grant was really meant as a real license or just boilerplate
— the same author used the same wording across a two-decade body of freeware,
and the archive's own README states it in full, unambiguously. No Wayback
Machine research, no secondary corroboration, no "reasonably supported but
not certified" hedge was needed, unlike this collection's other recent
restorations. Sometimes the software archaeology finding is simply: the
author already told you, plainly, in the box.

## A pan whose tilt is just one line of damped feedback

`pan.c`'s controller doesn't track the mouse position directly — moving the
pan changes its tilt angle by `-velocity * 0.005`, then damps that angle by
`* 0.92` every tick regardless of further input. That's the entire feel of
the game's central mechanic: a wok that leans away from fast motion and
settles back toward level on its own, rather than a paddle that just follows
the cursor. `public/src/core.js` keeps both constants exactly, and
`test/parity.test.js` pins a specific numeric case (`pan.deg` within
`1e-9` of `0.092` for a known input) directly against this formula, not
against how the tilt merely looks in play.

## A scoring line drawn in two different places

The historical source scores a ball once it crosses 90% of the playfield
width — 576 of 640 pixels — but the yellow zone the original draws to show
the player where scoring happens starts at 93%. Anyone reading only the
rendering code, or only watching the game, would describe a different
scoring threshold than the one the collision code actually uses. This
restoration's parity tests pin both edges of that gap directly: a ball at
x=577 scores, a ball at x=576 does not, reproducing the original's own
mismatch between what it draws and what it counts rather than "fixing" the
threshold to match the visible zone.

## Six generators, one difficulty number

Wok has no levels or stage transitions in the ordinary sense — difficulty
rises continuously through a single `rank` value that scales gravity and
spawn pressure, while six named generator types (fire, volcano, tree,
bucket, cloud, water tap) phase in and out as temporary ball sources. It's a
different shape of difficulty curve than the level-based structure this
collection has already restored in 54321 and Donkey Bolonkey — no discrete
levels to enumerate, just one number that keeps climbing and periodically
unlocks a different way for balls to enter the field. `public/src/core.js`
keeps all six generators and the same rank-scaling formulas rather than
collapsing them into a simpler difficulty setting.

## A codec that outlived its own file format

The two music tracks are encoded with a pre-1.0 Xiphophorus Vorbis
bitstream — old enough that current FFmpeg/Chromium decoders recognize the
format as "Vorbis beta" and then refuse to decode its setup codebooks at
all, a genuine format-archaeology dead end for anything trying to play
these files unmodified in a 2026 browser. SoX still understands the historical
stream, which made a one-time, no-recompression decode to PCM WAV possible —
recorded with exact SHA-256 hashes of both the untouched `.ogg` originals and
the derived `.wav` runtime files in `specs/AUDIO_CONVERSION.md`, so the
derivation is itself as auditable as everything else this collection
preserves. This is different from every other audio problem this collection
has solved so far: not a licensing question, not a missing asset, but a
file format that was already, on its own, too old for the tools built to
read it.

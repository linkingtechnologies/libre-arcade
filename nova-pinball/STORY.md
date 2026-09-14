# Nova Pinball
A 2015 browser flipper table, rebuilt from Lua and checked against its own compiled proof.

## Highlights

This restoration keeps the whole historical table: 58 components, the 6-ball
game, the launch lane, TILT and Safe Mode, and both original camera modes
(follow the ball, or watch the whole table). The full mission chain survives
too, in its original order: Red Giant, Fusion, Black Hole, Wormhole and
Supergravity, with the dynamic Matter Jettison branch and true simultaneous
multiball once you get there. Scores persist in an 8-entry high-score table,
the pre-launch camera pan and the 36px green LED message strip are both
back, and the HUD text is drawn by a new procedural 5x7 dot-matrix font
instead of any historical font file. Eighteen Web Audio sound effects cover
every SFX role the original actually used, and three optional CC0 background
tracks are available if you want music beyond the archival "None" default.
It runs in Italian or English, fullscreen, with touch controls for anything
without a keyboard.

## For the nerds

Wesley "keyboard monkey" Werner wrote the original in Lua on top of the LÖVE
framework in 2015. His own README states the license plainly: GPL version 3,
"or any later version," which is worth checking rather than assuming, since
plenty of old GPL projects drop that clause. It's there, in his words, so
GPL-3.0-or-later is a direct quote, not an inference.

Two things were worth re-verifying by hand rather than trusting the bundled
provenance notes. First, the official v0.2.3 release assets: downloading the
actual `.love` file and the Windows `.zip` from GitHub and hashing them both
produces the exact SHA-256 values recorded as the audited baseline. Second, a
neat bit of self-corroboration in the Windows build: its executable is
literally the LÖVE runtime with the `.love` file glued on after byte
381,952. Slice off everything before that byte and hash what's left, and you
get the identical SHA-256 of the standalone `.love` release. The executable
carries proof of its own contents inside itself.

The table geometry tells its own small story of faithfulness. `nova.pinball`,
the original Lua-pickled table definition, records the play field as
620 wide by `759.49966716648` tall, an oddly specific number for a rectangle.
The restoration's `data/table.json` carries the exact same digits. That kind
of floating-point agreement, out to eleven decimal places, is what a
transcription looks like when nobody rounded anything on the way through.

Not every original asset made the trip, and the reasons are specific rather
than blanket caution. Advanced LED Board-7, the font behind the historical
HUD and LED text, turns out to be "freeware for home using only" by its own
license file, with commercial use priced at $24.95. That's a real
restriction, not a formality, so the restoration draws its own dot-matrix
glyphs instead of the historical typeface. Separately, the game's own engine
repository quietly changed hands at some point between 2017 and 2019: the
v0.2.3 release points to `wesleywerner/nova-pinball-engine`, while the later
maintained project page, credited to Eric Ahnell's 2019 LÖVE 11.2 update,
points at a different repository under a different account. Nothing
documents that handoff as a formal transfer; it's just there in two versions
of the same credit line, years apart.

## For everyone else

The whole game is built around one line of instruction: make the star go
nova. You work through a fixed chain of missions named for stages of stellar
death and rebirth, Red Giant through Supergravity, each one unlocking the
next. It's a small, focused design from a solo hobby developer, not a
licensed table recreating a real physical machine.

Werner's own README credits five other people for letting him use their
work: Beyond for the tracker music, Sizenko Alexander and Nate Halley for
two fonts, Steve Dekorte for a Lua data serializer, and Tomas Pettersson for
the SFXR tool used to generate sound effects. All five names are preserved
in this restoration's own credit record, even though several of the assets
themselves don't ship here. That split matters: Werner saying these people
let him use their work in his own 2015 game is real evidence he had
permission for that game. It isn't the same as evidence that permission was
ever meant to extend to a different person's modified, redistributed web
port a decade later, so the restoration keeps the attribution and leaves the
files where their licensing was actually settled: with the original release.

## Did you know

The original 2015 package shipped 19 sound effect files, but only 18 of them
are ever called by name anywhere in the game's own Lua source. The
nineteenth, `powerup-2.wav`, has been sitting fully recorded and completely
silent in every release since 2015: authored, packaged, and never once
triggered by a single mission, bumper, or menu action in a decade of
releases. Nobody who ever played Nova Pinball would have had any way to
notice.

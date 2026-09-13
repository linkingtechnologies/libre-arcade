# The software archaeology behind Bubble Train

This is Bubble Train's own recovery story. For the philosophy shared by every
game in this collection — why reasoning is preserved rather than just
artifacts, why verification runs against executable originals rather than
screenshots, why provenance gaps are written down rather than smoothed
over — see [`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).

## Deciding the license of files that were never meant to carry one

Most of this collection's licensing questions are about code: does a header
exist, does it say "or later," is a specific asset traceable. Bubble Train's
61 `.lvl` and 5 `.gms` files posed a different problem entirely — they are
plain XML level/game definitions with no comment syntax anyone bothered to
use, no author field, nothing to read. `specs/level-data-license-memo.md`
works through this properly instead of shrugging: the upstream `README`
states outright "Bubble Train is released under the GPL license," the
game's own `help.html` documents `.gms`/`.lvl` as the human-editable source
form a player is meant to hand-tweak or generate with the bundled level
editor, and the FSF's own GPL FAQ says a clear README statement is legally
sufficient to establish scope even where individual files carry no notice.
The memo goes further and cites *SAS Institute v World Programming*
(CJEU, 2012) to separate a genuinely different question — whether the XML
*format* itself is copyrightable — from the question actually being asked,
which is whether *these specific 66 shipped files* fall under the grant.
Both the README hash and the help-file hash were independently re-checked
against the memo's own citations before any of this was trusted, and both
matched exactly, including the README's forgotten
`[[[[[[[[[[[[[LINK IN HERE]]]]]]]]]]]` placeholder — the kind of loose end
a genuine, unedited shareware README leaves behind and a fabrication would
have cleaned up.

## A counter that changes on the sixteenth call, not the fifteenth

The Rainbow special bubble is supposed to cycle color periodically while it
waits in the cannon. The historical GP2X binary's `Bubble::animate` reads a
countdown *before* decrementing it, then resets to 15 once it reaches zero
— which means the visible color only actually changes every **16** calls,
not the 15 a first reading of "resets to 15" would suggest. It's the
classic pre-decrement/post-decrement one-off, the same shape of bug that
shows up in C code every decade under a different name, and it survived
because nothing about it ever looked wrong to a player watching bubbles
cycle color. `tests/rng-factory.test.js` locks the exact 16-call cadence in
as a regression guard, credited directly to disassembly of the compiled
binary rather than to the C++ source, which never needed to say anything
about it — the compiler's own arithmetic *is* the specification here.

## A filesystem that used to not care, on a server that does

The bundled `.gms` manifests refer to their level folders as `easy/`,
`normal/`, and `hard/` in lowercase. The actual folders inside the OS4
archive are `Easy/`, `Normal/`, and `Hard/`. On the AmigaOS4 filesystem this
was invisible — case-insensitive lookups just quietly did the right thing —
and nobody had a reason to notice or fix it before shipping. A browser
fetching static files over HTTP is case-sensitive, so the mismatch would
otherwise 404 every single level load. `AGENTS.md` rule 7 states the
governing choice plainly: resolve historical case/path quirks externally in
port code, never by editing the preserved XML to make it "correct." The fix
lives entirely in `public/src/level/original-campaigns.js`'s path
resolution, leaving all 66 historical files exactly as extracted — an
invisible 2005-era filesystem behavior, made visible again only by porting
it to infrastructure that no longer offers it for free.

## A decoy that looked like extra evidence and wasn't

A second playable port existed — a 2006 GP2X handheld contest entry — and
it was tempting evidence: a second independent compiled build of the same
game. Direct comparison of all 66 XML files between the OS4 and GP2X
packages found only 4 byte-identical; the other 61 had been rescaled for a
320×240 handheld screen at very close to **0.4×** the original 800×600
coordinates, with cannon length, bubble radius, bomb radius and diameter
all shrunk by the same factor, train speeds retuned, and the frame loop
slowed to roughly 30 Hz from the original 25 Hz. None of that is a parity
failure to fix — it's a different port's own deliberate tuning for
different hardware. `docs/executable-parity-report.md` uses the GP2X
binary for exactly one purpose instead: its debug build still carries
readable function-name fragments (`rippleMove`, `triggerBomb`, `rotateLeft`,
`calcRadius` among them — independently re-confirmed here by searching the
binary's own bytes), which let the restoration confirm gameplay-core
behavior by direct disassembly rather than by C++ source reading alone. The
800×600, 25 Hz baseline the restoration actually implements comes from the
OS4 build throughout; the handheld port supplied confirmation, not values.

## A cannon that's exactly forty-five pixels long, because the binary says so

`CANNON_LENGTH = 45`, `BUBBLE_RADIUS = 15`, `BOMB_RADIUS = 60`, and a touch
threshold of exactly `31` — one more than the 30px bubble diameter — are
not numbers pulled from the C++ source and trusted at face value. The GP2X
binary's compiled literals (`18`, `6`, `24`, `12`, each scaled by the same
0.4× handheld factor) and the OS4 binary's own big-endian literal scan both
independently corroborate the upstream-scale values, and both binaries'
SHA-256 hashes were re-verified here against the report's citations before
any of it was trusted. The `+1` on the touch threshold in particular is
easy to mistake for a rounding fudge; it isn't — it's a deliberately
compiled constant, present byte-for-byte in two independently built
executables on two different processor architectures, and the restoration
keeps it as `TOUCH_THRESHOLD = BUBBLE_DIAMETER + 1` rather than smoothing
it into a plain `30`.

# The software archaeology behind Memonix: Builder

This is Builder's own recovery story. For the philosophy shared by every
game in this collection — why reasoning is preserved rather than just
artifacts, why verification runs against executable originals rather than
screenshots, why an unresolved search is reported as *unknown* rather than
*impossible* — see [`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).
For the shared Memonix archive format and the GPL-3.0-only licensing finding,
both already fully told in
[`../memonix-mosaic/SOFTWARE_ARCHAEOLOGY.md`](../memonix-mosaic/SOFTWARE_ARCHAEOLOGY.md),
this is the Builder-specific half: what turned up while reading the part of
the source Mosaic never touches, the house-generation algorithm itself.

## A house built from a grid of four-digit codes

Builder's target house isn't drawn from a bitmap or assembled from a hand
placed list of pieces. `game_start.cpp` carries eleven fixed 8×8 grids of
plain integers — `10150`, `203`, `30430`, `404`, and so on — and a single
`switch` statement, almost five hundred lines long, that turns each code
into a specific piece. The first two digits name a piece family (`10`
through `40`), the rest is itself meaningful: `_50` and `_30` mark corner
variants, a bare `_03`/`_02`/`_04` marks a repeating mid-wall run. Reading
a template is closer to reading a serial number than a picture. This
restoration's `public/src/templates.js` keeps all eleven grids as the exact
same integers, and every one of their 704 cells was diffed, cell by cell,
against the recovered source: zero differences.

## A house always tells you which one it is, except when it doesn't

Before generating a house, the original code picks a template number from 0
to 10 and loops — `while (GameMask==MaskT) GameMask = fmod(rand(),11)` —
until it lands on one different from the last. It is a small rule, easily
dropped by accident in a port that just calls random-pick-once, and it is
the entire reason this restoration's own test suite specifically checks that
back-to-back New Game presses never repeat the same structural layout twice
in a row.

## A pool of near-duplicate pieces, with a bug baked into how it's drawn from

Three of Builder's piece codes — the plain mid-wall (`103`), the taller
mid-wall (`203`), and a roof section (`403`) — don't choose their visible
piece from a clean uniform draw every time. On the two easiest difficulties,
the game instead fills up to three "cache" slots the first time it needs a
variant, then on later repeats of the same code either reuses one of those
three slots or, if all three are already full, rolls a fourth value meant to
pick among them: `test1 = 1 + fmod(rand(), 2)`. That expression can only
ever come out to 1 or 2. The slot stored first, slot zero, is still sitting
there in the source and is simply never read again once the cache fills up.

It isn't a crash, and nothing about play looks obviously wrong: the facade
still varies, just with one fewer option in the rotation than the author
likely intended. This restoration's `cachedFacadePick` keeps that exact
arithmetic, including the unreachable slot, because changing `1 +
fmod(rand(),2)` to the probably-intended `fmod(rand(),3)` would be fixing a
bug nobody asked this port to fix.

## The one case that quietly disagrees with its two siblings

Codes `103`, `203` and `403` all share the same cache-of-three structure
almost verbatim, which makes the one place they diverge easy to miss unless
you read all three side by side. On difficulty 1, `103` and `203` draw their
cached variants from the same pool size as difficulty 0 — 34 options and 29
options respectively, unchanged. Code `403` does not: difficulty 0 draws
from a pool of 10, but difficulty 1 narrows that same pool to 6. Nothing in
the surrounding code calls attention to it; the three blocks are shaped
identically enough that a port written from the first one as a template,
rather than read case by case, would naturally carry 10 into all three.
`public/src/model.js` passes a narrower `d1Range` argument specifically for
`403`'s call and no other, because that's what the four-hundred-some lines
actually say, not what the pattern suggests they should say.

## Gutters that remember which side they're on

Two piece codes, one per side of a house, set a flag the moment they're
drawn: the left corner post (`10150`) can set `Ltr`, the right one (`10550`)
can set `Rtr`. Every piece code below them on that same side — the wall
corner, the roof corner — checks that flag before choosing its own variant,
so a drainpipe at the top of a house constrains what kind of drainpipe-free
or drainpipe-matching segment appears beneath it all the way down. It's a
one-bit memory carried through an otherwise code-by-code independent
generation pass, present on both sides of every template, and it has to be
threaded through the port's own per-house generation state in exactly the
order the original computed it — `public/src/model.js`'s `generateBuilder`
walks the board in the same `for (x=7..0) for (y=7..0)` order as
`game_start.cpp`, specifically so `Ltr`/`Rtr` are already known by the time
a lower piece needs to check them.

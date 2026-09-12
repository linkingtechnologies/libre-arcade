# The software archaeology behind Yanoid

This is Yanoid's own recovery story. For the philosophy shared by every
game in this collection — why reasoning is preserved rather than just
artifacts, why verification runs against executable originals rather than
screenshots, why provenance gaps are written down rather than smoothed over
— see [`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).

## A group entry, a size limit, and a Python library that had to be rebuilt

Three Danish developers — Mads Bondo Dydensborg, Jonas Christian Drewsen,
Bjarke Sørensen — entered "Yet Another arkaNOID" as a group into the 2001
SDL Game Development Contest. Their own README spends its opening section
not on gameplay but on a workaround: the contest's 1 MB size limit meant
players needed a *dynamically linked* Python library, so the entry ships a
whole secondary mini-project (`dyn-python-lib`) whose only job is rebuilding
a static Python install into a dynamic one, because the static version alone
would blow the budget by 800 KB. The README even reports the exact compile
time on the judges' likely hardware ("Cel 550: 96.19user 5.78system
1:43.09elapsed") with a note hoping the judges "will have mercy on
us/yanoid" for exceeding an informal one-minute build target. A contest
entry's paperwork is itself a kind of historical record of what constrained
1 MB, 2001-era game development actually looked like.

## A README that marks its own uncertainty, and never resolves it

Yanoid's `CREDITS` file lists exactly what it reused from elsewhere — and
for two of them, the license field itself is a visible placeholder:
`License : ? (Probably GPL, fill in)`, once for the SDL_Console code, once
for a libsge-derived pixel-collision fragment. Nobody ever went back and
filled it in; the placeholder is still there, unresolved, in the final
contest submission. That's a genuinely different kind of provenance gap
than this collection has restored before — not a missing file, not a
missing license page to go find, but an author's own honest admission,
preserved in their own commit, that they weren't sure. The right response
to an author's own "TODO: verify this" is not to either wave it through or
delete the evidence of it having been asked — it's to keep the question
visible and route around it, which is exactly what excluding those two code
areas from the port (while still preserving them as evidence) does.

## An exclusion that was broader than the actual problem

The restoration this collection received had already done the hard part of
this audit — reading `CREDITS` line by line, separating "the team's own
work" from "stuff we brought in" — and reached the right conclusion about
the code's license (GPL-2.0-or-later, textually confirmed). But its
public-release packaging then excluded the *entire* extracted source tree,
describing it as containing "historical third-party material with imprecise
license metadata." Rereading the actual `CREDITS` shows that's true of
exactly two code areas and ten binary files, not of `game.cc`, `motion.cc`,
`map.cc`, or the other several thousand lines the three authors wrote and
put their own names and GPL notice on. Verifying a claim by going back to
the primary source — the same discipline this collection applied to
54321's licensing question — here cut the other way: it showed an existing
conservative decision was *more* conservative than the evidence required,
not less. `PROVENANCE.md` records the corrected, more precisely scoped
boundary: the source stays, ten specific files don't.

## A paddle that starts by driving off without you

`TMap::SetPaddle()` in the original initializes the paddle with target
velocity 0 but *current* velocity 2.0 — meaning every single map begins
with the paddle already drifting right for a brief moment before player
input or deceleration takes over, an artifact of how the acceleration model
was initialized rather than a deliberate "gentle launch" feature. It would
be easy for a rewrite to normalize this away as an obvious bug (why would a
paddle start moving on its own?), but it's present in the shipped contest
source and therefore part of what a faithful restoration means here.
`public/src/core.js` keeps `INITIAL_PADDLE_CURRENT_SPEED` at exactly 2.0,
and `specs/PARITY.md` documents why it's kept rather than "fixed."

## A power-up that mathematically cannot be won

The weighted power-up selector walks a cumulative-weight table and picks
the first entry whose cumulative total is `>=` the random roll — except the
comparison operator used is `<=`, which shifts every boundary value to the
*preceding* entry instead. With the 0.3.0 table's specific weights, the
random roll ranges 0–42 while the cumulative total reaches 43, and the
boundary value 42 gets absorbed by the second-to-last bucket. The result:
the final `+1000` score power-up is defined in the table, has a nonzero
weight, and can never actually be selected — a genuine, provably-unreachable
prize hidden in plain sight in code that shipped and was played. The port's
`historicalWeightedPowerup()` reproduces the exact `<=` comparison rather
than the `>=` a reader might expect, specifically so this quirk survives
intact; `test/core.test.js` pins it directly ("weighted selector preserves
the unreachable final +1000 quirk").

## Comment says 20%, code says 19%

Similarly, the Python source's own comment claims a 20% power-up spawn
chance, while the actual guard is `randrange(0,100) > 80` — which passes
only for the 19 values from 81 through 99, an effective 19%, not 20%. The
discrepancy between what the author wrote in a comment and
what the interpreter actually executes is exactly the kind of thing that's
invisible from playing the game and only findable by reading the source
directly — this collection's whole reason for preferring source-level
verification over behavioral guessing.

# The software archaeology behind PSY PONG 3D

This is PSY PONG 3D's own recovery story. For the philosophy shared by every
game in this collection — why reasoning is preserved rather than just
artifacts, why verification runs against executable originals rather than
screenshots, why provenance gaps are written down rather than smoothed over
— see [`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).

## Pong, but nobody told the ball it's supposed to move in a straight line

Quetzy Garcia's 2009 original is instantly recognizable as Pong — two
paddles, a ball, a score limit — until you look at what the ball's motion
equation actually does. Every gameplay step changes the ball's X and Z
coordinates by *the same magnitude*, which means the ball can never travel
straight down the court the way real Pong's does: every trajectory is a
45-degree diagonal, always. It's such a specific, deliberate-looking choice
that it would be easy to "improve" into more varied angles without realizing
you'd changed the actual feel of the game. `public/src/core/game.js` keeps
the same-magnitude X/Z update rule exactly, so the diagonal-only motion
carries over unchanged — see `specs/PARITY.md`, "Motion and collision."

## "Every two seconds," except it isn't

The original's own documentation describes the level going up every two
seconds. The source does something subtly different: it tests whether the
elapsed time in seconds is *odd*. That means the first level increase lands
around one second in, not two — then three, five, seven, and so on. A
faithful-sounding paraphrase ("increase the level every 2000ms") would have
silently produced a different game than the one that shipped, running
consistently half a beat ahead of what the author's own README claims. This
port's test suite pins the actual observed cadence directly
(`test/core.test.js`, "level reproduces original odd-second increment
cadence"), not the documented-but-wrong one.

## An AI that gets better by getting luckier, not smarter

The CPU paddle doesn't track the ball with any predictive logic — each
gameplay step, it's simply granted permission to move one step toward the
ball when `level > random(0, level)`. As the level number climbs, that
inequality succeeds more often, so the paddle appears to react faster and
more consistently purely because the odds shifted, not because any decision
logic changed. It's an unusually elegant way to make a Pong opponent
"harder" using one probability comparison instead of a difficulty curve,
speed table, or reaction-time constant — and it means the CPU's behavior at
level 1 and level 20 is driven by literally the same one-line rule with a
different number plugged in. `public/src/core/game.js` preserves that exact
comparison rather than reimplementing "AI difficulty" as a separate concept.

## A field that has no straight edges — the walls warp

Pong paddles historically stop at the top and bottom of the screen. This
one doesn't: travel far enough past the floor's Z boundary and the paddle
warps to the opposite edge instead of clamping. Combined with an
occasional random side-swap — which can only trigger when the ball sits
exactly at the court's center line and at least one point has already been
scored — the playing field behaves less like a bounded rectangle and more
like the wrap-around topology this collection has already restored in 54321
and Netris, just applied to a paddle instead of a whole board. Both quirks
are preserved exactly, including the specific condition (`ball.x===0`, at
least one score) that gates the swap — not "sometimes, randomly," which
would be a different, looser rule than the one actually shipped.

## Choosing not to redistribute rather than researching further

Unlike 54321, where this collection went looking for — and found — primary
evidence resolving an unclear license, PSY PONG 3D's *code* was never in
question: the archive ships the full GPLv3 text and every source header
says so plainly. The three BMP textures are a different matter — a GIMP
logo-generator image, a Flickr photo, and an AdobeUserSite.com tutorial
result, each credited to someone other than the game's author, with no
redistribution grant recorded anywhere in the archive. Rather than treat
"the code is clearly GPL" as license to wave through everything shipped
alongside it, `reference/audit/LEGAL_AUDIT.md` treats the media as its own
separate question and answers it conservatively: excluded, replaced with
new artwork built for this restoration and documented on its own terms in
`public/assets/ASSET_PROVENANCE.md`. Two restorations, two different
answers, both arrived at by actually checking rather than assuming either
way.

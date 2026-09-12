# The software archaeology behind For Science!

This is For Science!'s own recovery story. For the philosophy shared by every
game in this collection — why reasoning is preserved rather than just
artifacts, why verification runs against executable originals rather than
screenshots, why an unresolved search is reported as *unknown* rather than
*impossible* — see [`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).

## A week-long game, patched once, then left alone

Juan J. Martínez wrote For Science! in a single week for [PyWeek
16](https://pyweek.org/e/useboxnet3/) in April 2013, on top of two Python
frameworks — Cocos2d 0.5.5 for scenes/actions and Pyglet 1.2alpha1 for the
window and audio backend. Two releases survive: the PyWeek final entry
(20 April 2013) and a post-compo release, 1.0.1, two days later. Only four
project files differ between them — `README.txt`, `setup.py`,
`game/const.py`, `game/scenes.py` — described by the author as "minor fixes
and AI tweaking" (see `specs/version-diff.md`). No game asset changed a
single byte. This port treats 1.0.1 as the primary baseline and keeps the
PyWeek release solely as a historical comparison, both preserved as archives
with SHA-256 manifests in `reference/`.

## An AI tweak small enough to miss, big enough to matter

The entire functional difference in 1.0.1 is a few lines: the move-finder now
also prioritizes shield tiles instead of only money, and the attack selector
is rewritten to only ever pick attacks the player can actually afford, going
aggressive once money passes 90 or the opponent's shield drops below 25. It
would have been easy to port "the AI" as one paraphrased idea instead of two
literal, dated algorithms. `public/src/ai/original-ai.js` keeps both
decision functions traceable line-by-line to `game/scenes.py`, not
reconstructed from playing the game — see `specs/version-diff.md` and the
source-anchor checks in `test/source-anchors.test.js`.

## A discrete 101-tick clock disguised as 20 seconds

Upstream's turn timer isn't a wall clock. It starts an integer at 100,
accumulates frame `dt`, and only when accumulated time exceeds 0.2 seconds
does it decrement the counter and re-test — discarding whatever time above
0.2 s was left over each tick. That means a turn actually needs **101**
discrete ticks to time out, landing around 20.2 real seconds with
frame-dependent overshoot, not an idealized 20.000. A faithful-looking
`setTimeout(20000, ...)` would have quietly replaced a tick-based mechanic
with a continuous one — behaviorally close, but not the same clock the
author wrote. The browser reconstruction reproduces the discrete tick
counter itself; see `specs/timing.md`.

## An explosion that dies mid-fade, on purpose now

Upstream's explosion action composes two branches in parallel: a 2-second
scale-up that kills the sprite the instant it finishes, racing a 1-second
delay before a nominal 2-second fade-out even starts. The scale branch always
wins — the sprite is killed at the 2.0 s mark, while its fade has only been
running for 1.0 of its intended 2.0 seconds. Every explosion in the original
game visibly vanishes at roughly 50% opacity, not because anyone chose that
look, but because two independent timers happened to race that way. That
race is preserved exactly rather than smoothed into a clean fade — see the
"Explosion action quirk" in `specs/timing.md` and the coverage in
`test/visual-parity.test.js`.

## Verifying against a language with no compiler in this environment

The board logic, scoring, and AI in `public/src/core/` and
`public/src/ai/original-ai.js` are transcriptions of Python 2.7 running on
Cocos2d/Pyglet — neither of which run in this environment. Rather than trust
a JavaScript re-implementation to check itself, `tools/regenerate-python27-oracle.py`
independently re-derives expected outputs in Python-2.7-compatible logic, frozen
into `test/fixtures/python27-oracle.json` and replayed across multiple seeds by
`test/python27-oracle.test.js` — the strongest verification level available
without an actual Python 2.7/Cocos runtime (see the collection's [verification
hierarchy](../AGENTS.md#verification-hierarchy-strongest-first), level 2/3).
A separate 1000-seed AI stress run (`npm run test:stress`) exercises
`original-ai.js` for crashes and invariant violations no fixed-seed oracle
would reach.

## Assets carried four different licenses inside one GPL game

The author's own README calls out four exceptions to the game's GPL-3.0
license: a NASA Blue Marble background image (CC BY 2.0), the Russo One
display font (SIL OFL 1.1), the Droid Sans Mono font (Apache License 2.0),
and a cow sound effect from SoundBible (CC BY 3.0). `setup.py` also
contradicts itself — `license='GPL'` alongside a PyPI `MIT License`
classifier — which is recorded as an upstream metadata mistake, not treated
as a second license grant nobody else documented. None of this is
paraphrased away: `THIRD_PARTY_NOTICES.md`, `PROVENANCE.md`, and
`specs/legal-audit.md` keep each asset's real license distinct from the
game code's GPL-3.0-or-later, exactly as the collection's
[provenance discipline](../SOFTWARE_ARCHAEOLOGY.md#record-provenance-instead-of-erasing-it)
requires.

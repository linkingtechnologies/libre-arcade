# The software archaeology behind Game of the Goose

This is Game of the Goose's own recovery story. For the philosophy shared by
every game in this collection — why reasoning is preserved rather than just
artifacts, why verification runs against executable originals rather than
screenshots, why provenance gaps are written down rather than smoothed
over — see [`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).

## A rule that tells you 54, while the code sends you to 53

The classic ruleset's tile 9 is the traditional "first throw" special: roll
3-and-6 on your opening throw and you jump to tile 26; roll 4-and-5 and you
jump further ahead. `reference/game-of-the-goose-e8b804f/src/rulesets.js`
shows both halves of this rule living right next to each other — and
disagreeing. The code that actually executes the move sets
`tileNumber = 53`. The player-facing string describing that exact same
event, four lines later in the same object literal, reads *"...or to 54 if
you rolled 4 and 5."* One digit, never caught, sitting in the same file as
the code it's supposedly describing.

Two ways to resolve this: change the code to match the sentence, or change
the sentence to match the code. `RESTORATION_NOTES.md` records the choice
made here — the code is the executed truth of how the original game actually
played for however long it shipped this way, so `public/src/rulesets.js`
keeps tile 53 and fixes only the sentence, now reading "or to 53 if you
rolled 4 and 5." A future reader comparing the restoration's copy against
the archived original's copy will find them differing by exactly one
character, and now knows why: this is the one place this restoration
corrected upstream's own words instead of its behavior.

## The same trap, two different doors out

Classic and Modern share the same board and the same two "you're stuck"
tiles — the well at 31 and the prison at 52 — but resolve them by opposite
philosophies, and the difference isn't cosmetic. In Classic
(`reference/.../src/rulesets.js`, and preserved the same way in
`public/src/rulesets.js`), landing on either tile sets `stuck = true` with
an `escapeCondition` that only becomes true when *another player* lands on
your exact tile — a purely social mechanic with no way to free yourself
solo. Both tiles are also flagged `endGameIfAllStuck: true`: if every
remaining player ends up trapped with nobody left outside to free anyone,
the classic game can end in a genuine draw. Modern replaces both traps with
a private, solo-solvable check instead — the well waits for you to roll
exactly 6 on your own, the prison is a flat two-turn timeout — and
correspondingly ships with `endGameIfAllStuck: false` on both, because a
solo-solvable trap can never produce that stalemate. This isn't a case of
one ruleset having a bug the other fixed; it's the same original project
shipping two deliberately different social contracts for what happens when
you get unlucky, and the port preserves the fork intact rather than quietly
picking a favorite.

The classic mutual-rescue mechanic has a sharp edge worth naming: a stuck
player's fate depends on *other stuck players' positions*, not just their
own. `tests/game-logic.js` exercises this directly — three players sharing
one trap can free each other in a chain even while a naive implementation
checking only `ctx.currentPlayer`'s own escape condition would wrongly call
it a draw the instant the *current* player alone looks unrescuable. Getting
this right meant testing the multi-player case explicitly rather than
trusting that a single-player escape check would generalize.

## A license grant with no license text to grant it

`package.json` says `"license": "ISC"`. That's the entire written record.
The audited commit — independently re-fetched from GitHub and walked file
by file via the API, not taken from the bundled audit's word — contains no
`LICENSE`, `COPYING`, or `NOTICE` file anywhere in its 37 tracked paths, and
no source file carries a header repeating the grant. A `package.json`
field is a real, citable declaration of intent, but it is also the entire
extent of what upstream ever wrote down. `UPSTREAM_NOTICE.md` records
exactly that boundary — an intent to license permissively, with nothing
further to interpret beyond it — rather than either inventing a fuller grant
or discarding the one clear signal that does exist.

## Two geese and a die that never say who drew them

`img/goose.svg` and the six numbered player pieces carry no embedded
copyright comment, and the SVG's own DOCTYPE and path structure read like
output from a generic clipart-to-vector conversion rather than bespoke
artwork — the kind of file that's easy to pick up from somewhere and just
as easy to forget where. `src/roll-a-die/` tells a related but distinct
story: it isn't declared as an npm dependency anywhere in `package.json`,
meaning it was copied in by hand rather than installed, yet carries no
header crediting wherever it came from. Neither is a dramatic discovery —
just two ordinary, unremarkable-looking pieces of a hobby project that
happen to be the two pieces nobody can trace. Both are preserved, unloaded,
in `reference/`; the playable board draws its own geese from scratch and
rolls dice built from CSS pips instead.

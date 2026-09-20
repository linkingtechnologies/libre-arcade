# The software archaeology behind HighMoon

This is HighMoon's own recovery story. For the philosophy shared by every game in this collection (why reasoning is preserved rather than just artifacts, why verification runs against executable originals rather than screenshots, why an unresolved search is reported as *unknown* rather than *impossible*) see [`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).

The game arrives with a five-phase audit trail in [`specs/`](specs/) (identity, legal and asset audits, a native oracle plan and results, the asset decision, QA evidence), the preserved source and oracle tooling in [`reference/`](reference/) and the release notes in [`docs/`](docs/). This file does not repeat them. It picks out what makes this specimen unusual and what integration into the collection checked again.

## A game that owes its randomness to how it draws

The most instructive finding is that in HighMoon 1.2.4 drawing is not innocent. `draw()` methods move planets after an impact, advance moon and ring orbits and animate the opening galaxy. Storms, wormholes, stars, bonuses and the winner effect call `rand()` while they are being drawn, and world generation and the CPU opponent draw from the same global C random stream. So what is on screen changes which numbers the computer player sees on its next turn.

A port that gave the simulation and the display separate random streams would be tidier and would no longer play the same game once an effect had fired. `public/src/historical-runtime.js` exists for this reason: it keeps every state change and every random call that drawing used to make, and draws nothing. The tests count them for a settled galaxy (858 visual random calls, 165 Storm wraps, 57 Wormhole resets, 3 Star resets), and the CPU turn that has to match the native trace consumes 12,585 shared random values in total.

## Gravity that is not Newton's

Shots are bent by an inverse-distance pull, not an inverse-square one, with weights Jupiter 350, Earth 300, Mars 200, Venus 180 and Saturn 250. Storms (the old black holes, renamed in 1.2.1) have weight -100, so the same formula pushes shots away, and touching one does nothing. Wormholes have weight 50 and move a shot to the exit point plus a random offset while leaving its velocity alone. The header constant `WEIGHT_WORMHOLE=100` is stale: the live wormhole uses 50. The audit calls the model deliberately non-Newtonian and says it should not be corrected. The port does not.

## Moons that do nothing

The game's own description says shots are pulled by planets and moons. In 1.2.4 the gravity loop only visits the top-level objects, so moons and Saturn's ring stones collide with shots but exert no pull at all. This is a difference between what the game says and what it does, and the port keeps the behavior.

## The details the oracle exposed

Projectiles store speed and direction and rebuild a polar vector on every tick. A mirror that carries the Cartesian velocity straight through drifts by one bit of a 64-bit float and then wanders, so the port repeats the round trip. Collision is a plain center-distance test after a full 30 ms step, tested in array order with the first hit winning; a very fast shot could in principle tunnel through a body. A human shot can also fire on the release of an unrelated key once charging has begun. All of these are in the port on purpose.

## What the numbers say, and what they do not

On the fixed Laser scenario the port and the original agree on 688 of 816 compared values bit for bit, with a largest absolute difference of `7.1e-15` and a worst case of 48 units in the last place. The gap comes from the math library (C++ `libm` against the browser's functions) and was left visible instead of being absorbed by a fudge factor. The random generator, the seed-54321 galaxy, the seven candidate shots of the canonical CPU turn, the wormhole teleport and storm repulsion match exactly. What this does not show is that a whole game played on two different machines would match to the bit. The documents say so plainly.

## Fossils in a mature game

There is no music. The announced Exploding shot, described in the 1.2 notes, is unreachable and falls back to the Cluster shot. Trainer mode and thread mode are compiled out, and the thread mode's own comment admits it did not run faster. A path cache ignores the state of the galaxy, and one sound check accepts an out-of-range value that normal code never sends. Twelve of the seventeen source files still name the game *HighNoon - Duell im All* in their headers, while the README, AUTHORS and NEWS say HighMoon.

## A release history, and a page that agrees with it

The audit reconstructs the line from the release notes: 1.0 on 14 January 2005, a burst of versions through 1.2 (19 February 2005, bonuses, Heavy and Cluster shots), 1.2.1 (11 March 2005, Storms), Italian in 1.2.3 and Dutch in 1.2.4 on 25 March 2006. No version-control repository was found, so there is no upstream "last commit" to cite, and the release notes are the record. An archived copy of the upstream site, supplied at integration, agrees with the audit: its news list ends with 1.2.4 on 25 March 2006, its downloads are that version for Linux (403 KB, which fits the 413,137-byte gzip that FreeBSD recorded) and Windows, both dated 6 August 2007, and its news text is identical to the preserved `NEWS` apart from the e-mail address, which the site obfuscates. The screenshot's capture date is not known, so it cannot say what came after, and the live site could not be fetched (its certificate has expired). The audit's conclusion that no successor exists therefore still rests on the audit.

## Assets: what could not be proved

The original ships 30 bitmaps, an icon and 8 WAV files with no credits. The audit traced seven of the sounds to the historical OpenOffice.org gallery family (two carry an embedded 1995 date, so they are older than the game by about a decade) and one to a 2002 sample from QNetWalk, and it found nothing about who drew the planets. None of it ships. The browser game draws its own planets and synthesizes its own sounds, and `tests/reference-integrity.mjs` fails if a historical image or sound ever appears in this folder.

## What integration changed

The package arrived with the game and everything around it under one deployable folder, tests, docs and fixtures included. The collection's layout has a small `public/` for the runtime, so the game was split accordingly: runtime in `public/`, tests and the JavaScript oracle fixtures beside it, the oracle bundle in `reference/`, the audits in `specs/`. The tests were repointed (path changes only), the package's Python commit gate was replaced by a Node test that keeps its checks on the preserved upstream files and on media, and the collection's lint rules were added. The simulation modules were not touched.

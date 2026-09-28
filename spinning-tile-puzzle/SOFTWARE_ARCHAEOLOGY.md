# The software archaeology behind Spinning Tile Puzzle

This is Spinning Tile Puzzle's own recovery story. For the philosophy shared by every game in this collection (why the reasoning is preserved and not only the artifact, why verification runs against executable originals rather than screenshots, why an unresolved question is reported as *unknown* rather than *impossible*) see [`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).

This is the third and last of Jonathan Hulka's Virtual Toybox Puzzle Collection to join this collection, after [`../libre-jigsaw/`](../libre-jigsaw/) and [`../sliding-tile-puzzle/`](../sliding-tile-puzzle/). All three share the same three preserved archives. This file covers what is specific to the spinning-tile game.

## Seven tiles, six vertices, and a permanent geometry problem

Picture seven hexagons arranged two-three-two, like a short stack of coins with the middle row wider than the top and bottom. Between every group of three touching hexagons sits a vertex, six of them in total, and clicking a vertex spins the three tiles around it: they trade places and each one turns 120 degrees.

The interesting part is how the original program keeps track of where everything is. Internally, `HexTileManager` thinks in terms of a 6-column, 3-row super-grid of 18 cells, of which only 9 actually hold anything (the rest are the gaps that make hexagons tile the way they do), and of those 9, two more are permanently empty to leave exactly seven real tiles. Converting between "the seventh tile" and "row 1, column 4 of an 18-cell grid, skipping the two that don't exist" is not a calculation with an obvious right answer; it is a specific piece of arithmetic that either matches the original or doesn't, with nothing external to check it against except the original itself.

So that's what this restoration did: read the original indexing functions, ported them line for line, and then let the position oracle be the judge. Every one of the seven tile positions and six vertex positions, at four different board sizes, came out in the exact pixel location the real `HexSpinnerManager` class reports. The internal arithmetic was never validated on its own terms, because it doesn't need to be. If it were wrong, the positions it produces would be wrong too, and they aren't.

## A method that reaches through `private`, twice

Sliding Tile Puzzle's oracle used Java reflection once, to call `SliderHandler`'s private shuffle method. This game's oracle needed that trick again for `SpinnerHandler.mix()`, which is also private, but the actual spinning operation, `HexSpinnerManager.spin()`, turned out to be a public method all along. So the oracle harness for this game calls one method by force and the other one directly, and both routes land on the same original code, unmodified, still inside the jar it always lived in.

That let the restoration check something the delivered documents only described in words: that a single spin moves exactly three tiles and turns each of them by exactly two of the six sixty-degree steps. Run against the real class for all six vertices in both directions, the JavaScript port's result matched exactly every time, tile identity, rotation amount, and the specific list of which three tile slots changed.

## Seven names shuffled, six seats available

`SpinnerHandler.mix()` runs five passes. In each pass, it shuffles an array holding the numbers zero through six, seven numbers for seven tiles, and then walks through that shuffled list calling `spin()` on each one. There are six vertices. The seventh number, whichever position six lands in that pass, gets handed to `spin()` as an argument it was never meant to receive.

`HexSpinnerManager.spin()` protects itself against exactly this with one line: `if(flatIndex>=0&&flatIndex<6)`. Outside that range, the call does nothing. So roughly one time in seven, one of the five shuffle passes quietly wastes an attempt on a vertex that was never going to move.

This isn't a bug in the sense of producing a wrong or broken puzzle; the shuffle still mixes the board thoroughly across five passes even with the occasional no-op. It's a design detail that only shows up if you read both classes side by side: `mix()` was written to shuffle "the tiles," and there happen to be one more of those than there are things you can spin. Whether anyone in 2010 ever noticed is impossible to know from the code. The restoration reproduces it exactly, because the shuffle oracle's result depends on the exact number of no-op attempts landing in the exact places they land in the original's random sequence, and getting that wrong would have shown up immediately as a mismatch.

## A photograph collection with one more thing in it

The ten photographs and their license are shared, byte for byte, with the sibling jigsaw and sliding-tile restorations, and were not re-checked here since they already were, twice. What is new to this game is a pair of small cursor images, a clockwise arrow and a counter-clockwise one, that the original program shows while you hover over a spinnable vertex. Both were pulled from the jar's `images/` folder and compared, byte for byte, against the copies bundled here. Both matched. It's a small detail, easy to have skipped, and the kind of thing that would only ever be noticed by its absence.

## What integration changed

The package arrived already shaped to the collection's contract, the same as its two siblings: `public/index.html` at the root of `public/`, self-contained, no restructuring needed. It needed the same scaffolding every restoration in this collection needs: `package.json`, `scripts/serve.mjs`, `scripts/build.mjs`, an ESLint config, `.gitignore`, the GoatCounter snippet, a "Play here" link, and the license file renamed from `COPYING` to `LICENSE`, along with the same fix its two siblings needed: the delivered `COPYING` was a two-line pointer at `LICENSES/GPL-3.0.html` rather than the full text this collection's rules require at the root.

The one structural finding was the same one found twice already in this same family of games: `test/spinner-parity.cjs`, as delivered, compiled and ran the Java oracle live, on every single `npm test`. It was run here, confirmed against the real jar, and its output frozen into three fixture files that the tests now check against instead. The original harness is still in `test/`, unchanged, for whenever it needs to run for real again.

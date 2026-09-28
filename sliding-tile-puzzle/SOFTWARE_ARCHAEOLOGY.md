# The software archaeology behind Sliding Tile Puzzle

This is Sliding Tile Puzzle's own recovery story. For the philosophy shared by every game in this collection (why the reasoning is preserved and not only the artifact, why verification runs against executable originals rather than screenshots, why an unresolved question is reported as *unknown* rather than *impossible*) see [`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).

This game shares its origin with [`../libre-jigsaw/`](../libre-jigsaw/), restored earlier: both come from Jonathan Hulka's Virtual Toybox Puzzle Collection, and both keep the same three preserved archives. This file covers what is specific to the sliding-tile game.

## A reflection trick instead of a rewrite

`SliderHandler.mix()` is a private method on a class nobody was going to recompile from source, because the source that ships in the jar and the compiled class that also ships in the jar might not even be perfectly in sync after fourteen years of nobody checking. So the oracle harness for this game does something more direct: it loads `SliderHandler.class` straight out of `puzzlegames.jar`, and with three lines of Java reflection, reaches past `private` to set the exact fields the shuffle depends on (`random`, `tileCount`, `tilesAcross`, `missingTile`) and call the exact method that shuffles the board. No recompilation, no risk of a transcription error, no question of whether the harness is testing the same code the jar actually runs. It is the same code, because it never left the class file.

That harness was compiled and run again when this game joined the collection, against the same jar, under a real JDK. Nine scenarios, three grid sizes crossed with three seeds, and every single board position came back identical to what the JavaScript port produces from the same `java.util.Random` seed. Not similar. Identical, tile for tile, down to which cell is empty.

## The coin that only ever lands on one side

Reading `SliderHandler.java` turns up a line that would look like a typo if you saw it anywhere else:

```java
coords.x += coords.x == 0 ? 1 : coords.x == tilesAcross - 1 ? -1 : random.nextInt(1)*2 - 1;
```

`random.nextInt(1)` asks Java's random generator for an integer strictly less than 1. There is exactly one such integer: zero. So `nextInt(1)*2 - 1` is not a coin flip between +1 and -1. It is -1, always, unconditionally, every single time this line runs. Somewhere in 2010 somebody almost certainly meant to write `nextInt(2)`, which does flip between 0 and 1, and typed the wrong bound.

This line only fires when a tile being repositioned during a shuffle is not already against an edge, which is most of the time, so this typo has been quietly biasing every game of Sliding Tile Puzzle in one direction since the collection's first release. It's the kind of thing that would be invisible to a player and invisible to most code reviews, because the expression looks intentional: it has the shape of a coin flip, uses the random generator like a coin flip should, and simply never flips.

The port keeps it. `randomInt(rng, 1) * 2 - 1` in `src/game.js` reproduces the exact same always-minus-one behavior, not the coin flip the original author probably intended. The shuffle oracle match above is itself indirect confirmation: change this one line to a genuine coin flip and the nine-scenario match would break immediately, because the sequence of values drawn from the shared random generator would shift from that point onward.

## A color you can predict from a picture

Long before this restoration, whoever built the original game pre-computed the average color of each of the ten bundled photographs and stored it in a small XML file, `pics.xml`, that ships inside the jar. At runtime, `PuzzleCanvas.setMeanColor()` takes that average, converts it to hue/saturation/brightness, spins the hue by exactly half a circle, and uses the result as the puzzle's background. The effect is a background that always contrasts with the photograph sitting on top of it, computed once at design time rather than guessed at runtime.

Both halves of this were checked independently here. The ten mean colors were read directly out of `pics.xml`, not copied from the delivered test, and a small Java program calling the real `java.awt.Color.RGBtoHSB()`/`getHSBColor()` reproduced the exact same eleven hex colors (the ten photos, plus the neutral gray default for a user's own image) that the JavaScript port computes. Pick "Light of the Sky", a photograph of blue sky and white cloud, and the board around it turns a warm amber, exactly as the math dictates it will, on the first load, with no user ever having to see the number that made it happen.

## What integration changed

The package arrived already shaped to the collection's contract: `public/index.html` at the root of `public/`, self-contained, no restructuring needed. What it lacked was the usual scaffolding: `package.json`, `scripts/serve.mjs`, `scripts/build.mjs`, an ESLint config, `.gitignore`, the GoatCounter snippet, a "Play here" link, and the license file renamed from `COPYING` to `LICENSE`.

One thing about that renamed file needed more than a rename. The delivered `COPYING` was two lines pointing at `LICENSES/GPL-3.0.html` for the actual text, which this collection's own rules ask against: the root license file has to carry the full text itself, not a pointer to it. The two-line file became the complete GPL v3, copied from the sibling Libre Jigsaw project's own verified copy.

The other real finding was structural rather than legal. `test/mix-parity.cjs` and `test/background-parity.cjs`, as delivered, compiled and ran the two Java oracle programs live, every single time `npm test` ran. That is a reasonable thing to do once, by hand, to prove a point, and a bad thing to bake into a test suite that is supposed to run on any machine with Node installed and nothing else. Both harnesses were run here, confirmed against the live jar as described above, and their output frozen into two small JSON fixtures that the tests now check against instead. The original `.java` harnesses are still in `test/`, unchanged, for whenever they need to be re-run for real.

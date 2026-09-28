# The software archaeology behind Libre Jigsaw

This is Libre Jigsaw's own recovery story. For the philosophy shared by every game in this collection (why the reasoning is preserved and not only the artifact, why verification runs against executable originals rather than screenshots, why an unresolved question is reported as *unknown* rather than *impossible*) see [`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).

The game arrives with a genuinely rare thing in this collection: the historical archives themselves, not just their hashes. `specs/ARCHAEOLOGY.md`, `specs/LINEAGE.md` and `specs/ORACLE.md` record the reading; this file picks out what makes the specimen unusual and what integration checked again.

## Two generations of the same idea

Jonathan Hulka's Virtual Toybox Puzzle Collection shipped a jigsaw game in August 2010. Its square pieces come from `SquareJigsawManager.buildEdge()`, a self-contained method with its own bubble and corner variance factors. Its hexagonal pieces come from a similar method in `HexJigsawManager`.

Sometime in the following year and a half, the jigsaw line split off, kept evolving on its own, and became Libre Jigsaw. Somewhere in that evolution the square and hex cutters were both refactored into a shared `JigsawCutter`, and the square tuning changed with them: the stem factor disappeared, and the two variance factors roughly halved. The hex tuning did not change, because the 2010 hex code already used the construction the refactor later generalized.

This is a distinction worth taking seriously rather than smoothing over. It would be easy to treat "the game got refactored" as "the game got the same, tidier." It didn't, for the squares. Reading both `SquareJigsawManager.java` files side by side shows five named constants, and three of the five changed value. The port keeps two square cutters for exactly this reason: `geometry2010.js` and the square half of `geometry2012.js` are not a copy and its cleanup, they are two different curves, and a player can choose between them.

## An oracle that still runs

Most of the ported games in this collection cannot execute their original: the interpreter is Python 2, or the binary is Windows-only, or the source was never supplied. This one is different. `puzzlegames.jar` from August 2010 ships both `.java` source and compiled `.class` files for its tile managers, and Java 8 is old enough that today's `javac --release 8` can still target it.

So the port includes `test/Print2010Layout.java`, a tiny harness that constructs the real `SquareTileManager`, `HexTileManager`, `SquareJigsawManager` and `HexJigsawManager` from the actual jar and prints their layout numbers: tile counts, dimensions, offsets, for four board sizes and four piece counts, in both cuts. That is thirty-two scenarios, and none of them are guesses about what the Java code does. They are the Java code, still running, fourteen years later.

When this game joined the collection, that harness was compiled and run again, against the same jar, on a real JDK. All thirty-two numbers matched the recorded log exactly. This is the strongest kind of evidence this collection recognizes, and it is available here specifically because the archives were kept rather than reduced to a manifest.

## A changelog that names its own turning point

The later archive, `libre-jig-master.zip`, carries its own development changelog, dated entry by entry back to August 2010. One entry, from 8 February 2011, reads: "JigsawHandler: Changed tile snap algorithm: Positions are now adjusted to the largest on-board connected group." The line directly above it in the file says "New changes above this line," meaning that entry was, at the moment this snapshot was taken, the most recent thing that had happened to the snapping code.

This turns an otherwise invisible behavioral choice into something checkable. Before that date, merging your dragged piece into a larger structure could shift the whole result: the code took a weighted average of every group's position and moved everyone toward the middle. After it, the largest group stands still and everything else moves to meet it. Anyone who has played a physical jigsaw puzzle knows which of those two behaviors feels right, and the changelog names the exact day the game started doing it. Both behaviors are implemented here, selectable, because the changelog is direct evidence that both existed.

## The photographs

Ten wildflower and landscape photos ship with the historical game, credited to JS Nature Photos under a share-alike Creative Commons license. Every one of the ten full images and their ten thumbnails, twenty files in total, was extracted from the 2010 jar and compared byte for byte against the copies in this repository's `public/assets/photos/`. All twenty matched exactly. This confirms a claim the delivered documents make but do not show working: that the browser gallery is not a re-export or re-compression of the originals, but the same files.

## A trace the delivered documents did not have

The audit that produced this port names two archives and dates them by internal metadata: the 2010 jar, and a 2012 source tree whose newest files are stamped 4 March. Neither document names a canonical home for the project online, and none was searched for.

One exists. Jonathan Hulka maintained a Launchpad PPA, `ppa:jon-hulka/libre-jigsaw`, and its most recent package is versioned `2012.09.09`, uploaded to the archive in February 2013. That does not prove a release happened on exactly that day, only that the project was still being packaged six months after the source snapshot in this repository was cut. It is a small fact, and it belongs in the record for the same reason every other date in this file does: not because it changes anything about how the game plays, but because "the project's history stops here" and "the project's history is documented up to here" are different claims, and only one of them is true.

## What integration changed

The package arrived already shaped to the collection's contract: `public/index.html` at the root of `public/`, self-contained, no restructuring needed. What it lacked was the collection's own scaffolding: `package.json` and its six standard scripts, `scripts/serve.mjs`, an ESLint config, `.gitignore`, the GoatCounter snippet, a "Play here" link, and the license file renamed from `COPYING` to `LICENSE` for consistency with the rest of the collection.

Two real bugs turned up, both in 2026 code rather than in anything ported from Java. `test/build-bundle.py`, moved to `scripts/` since it is a build step rather than a check, wrote the regenerated bundle without naming an encoding, which corrupts the file's one em dash under Windows' default codepage; the fix was one keyword argument, and regenerating the bundle from source now reproduces the delivered file byte for byte. The second was found the way the delivered smoke checks could not find it: by loading the actual page in a real browser tab rather than inlining its code into a script. `updateViewport()` read the canvas's on-screen size twice, once when it was known good and once moments later inside the call to the viewport helper, which throws rather than returning a guess when given a zero size. On a page that has not yet been laid out when its image finishes loading, an ordinary and not even rare condition, that second read could come back zero and the game would throw during its very first draw, leaving the canvas blank until something unrelated, like a window resize, happened to trigger another one. It now retries once through `requestAnimationFrame` instead of throwing. A combined test runner, `test/run-all.mjs`, now runs all twelve delivered smoke checks plus a new one that keeps the reference archives' checksums verified as part of `npm test` rather than as a manual `sha256sum -c`.

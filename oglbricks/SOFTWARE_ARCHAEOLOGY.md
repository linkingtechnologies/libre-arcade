# The software archaeology behind OGLBricks

This is OGLBricks' own recovery story. For the philosophy shared by every game in this collection (why the reasoning is preserved and not only the artifact, why verification runs against executable originals rather than screenshots, why an unresolved question is reported as *unknown* rather than *impossible*) see [`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).

The audit trail is condensed into [`specs/AUDIT.md`](specs/AUDIT.md); the extracted piece geometry the tests compare against is in [`specs/`](specs/). This file picks out what makes this specimen unusual, and what integration into the collection checked again.

## A falling-block game whose author kept the interesting part

There are thousands of falling-block games. Alexey Markarov published this one on SourceForge in January 2013, wrote it in C++ over Qt and OpenGL 1.1, released it under MIT, and put two things in it that almost nobody else does.

The first: the field is not a fixed 10 by 20. Width and height are each settable from 10 to 50, independently. A 50 by 10 field is a different game from a 10 by 50 one, and the scoring notices, because points are `clearedLines² × fieldWidth × speed`. Widening the field does not just change the shape of the problem, it multiplies the reward.

The second: the pieces are not the seven you expect. There are 27, grouped by how many blocks they contain, and you choose which groups can appear. One block, one; two blocks, one; three blocks, two; four blocks, seven; five blocks, sixteen. Enable only the five-block group and you are playing something that has no familiar name. Enable only the one-block group and you are dropping single cells into a 50-wide field, which is either meditative or absurd depending on your mood.

Everything else follows from those two choices. The catalog of 27 is the artifact worth preserving, which is why it exists here twice: extracted from `Shape.cpp` into `specs/original-spatial-contract.json`, with every shape at each of its four quarter turns, and transcribed into `public/js/shapes.js`. A test walks both and compares them entry by entry. If the port ever drifts, that test says which shape and which turn.

## What could not be done, and is not pretended

This collection prefers to run the original and diff against it. That did not happen here, and it never happened during the port either.

OGLBricks is a Windows binary built on Qt 4, Assimp and OpenGL. Nobody in this project has run it. What exists instead is a set of observations the user made while playing it themselves, on their own machine, and reported back: movement and rotation work, a cleared row does not stall the game, a 10 by 15 field is playable, the five-block-only configuration is playable, a real save file loads. Eight of twelve planned scenarios, none of them recorded, four never attempted.

That places the rules of this port at the third level of the collection's evidence hierarchy: careful reading of the source, transcribed rather than redesigned. The shape catalog is better than that, because its values are exact and machine-compared, but the rules around it rest on somebody having read `GameEngine.cpp` attentively. `specs/port-map.md` says so in the row where a stronger claim would sit.

## The ten points that should have been forty

One observation refuses to fit. Clearing two rows at once, on a width-10 field at speed 1, the original reported ten points. The source formula, `clearedLines² × fieldWidth × speed`, gives forty.

There are ordinary explanations. The two rows might have been cleared as two separate events rather than one. The speed might not have been what it looked like. The observer might have misread a counter that was mid-animation. Any of them would resolve it, and none of them has been demonstrated.

So the port implements the formula, because the formula is what the source says, and the discrepancy stays written down in three places rather than being quietly resolved in favour of whichever number was more convenient. A port that silently adopts an unexplained observation is no more honest than one that ignores it.

## A reference folder that holds an address

Every other ported game here keeps a frozen copy of what it was ported from. This one keeps a license notice, four SHA-256 values and the URL they came from.

The reason not to bundle is defensible: the Windows archive carries Qt 4 and Assimp runtime files and 3D models whose redistribution terms nobody established, and the audit decided not to publish any of the four archives rather than sort them one by one. Rather than close the gap by copying, it was closed by pointing: `reference/SOURCES.md` names the two SourceForge folders the archives live in, so anyone can fetch them and check them against the manifest.

Both folders were checked when the game joined the collection and hold exactly those four files, with dates that turn out to be the release history itself: 0.1 on 25 January 2013, the day the project was registered; 0.1.1 four days later; 0.2 on 14 February; and then nothing new until the project's last update at the end of May.

What this arrangement costs is worth naming. The shape catalog in `specs/` is an extraction from a `Shape.cpp` that is not in this repository, so the tests compare the port against the extraction, and the extraction against nothing. Everywhere else in this collection that second comparison is available locally. Here it needs a download first.

## What integration changed

The package arrived in two copies of itself. Six files lived in `src/`, the same six lived in `public/oglbricks/`, a Python script copied one onto the other, and a test asserted that the two were byte-identical. The collection's contract wants `public/index.html` to be the game, at the root of `public/`, with no indirection and nothing to synchronize. So `src/` and the nested folder collapsed into one tree, the copier and the equality test went with them, and the remaining tests and tools were repointed. Thirty-eight tests pass, the same thirty-eight as before minus the one that no longer had two sides to compare.

The rest was the usual: the collection's scripts, an ESLint config, a `.gitignore` covering `/game/` and `.claude/`, the analytics snippet and a "Play here" link. Two dead bindings in the tests went. One assertion got stronger: the page was checked for remote scripts with a pattern that only caught an explicit `http:` or `https:`, so a protocol-relative one would have slipped past. It now lists every remote script and allows exactly the analytics beacon.

And the HTTP gate that every milestone had left open was closed, because the blocker was never in the code. That environment's Chromium refused to navigate to localhost, so all six milestones injected their JavaScript into a blank page. Served normally over HTTP, the game loads, plays, and comes back after a reload with the board where it was.

# The software archaeology behind 100-Square Challenge

This is 100-Square Challenge's own recovery story. For the philosophy shared by every game in this collection (why reasoning is preserved rather than just artifacts, why verification runs against executable originals rather than screenshots, why an unresolved search is reported as *unknown* rather than *impossible*) see [`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).

The game arrives with a short audit trail ([`specs/`](specs/)), the original Java archives ([`reference/`](reference/)) and the fixtures the tests use ([`test/fixtures/`](test/fixtures/)). This file does not repeat them. It picks out what makes this specimen unusual and what integration into the collection checked again.

## A whole project in 10 kilobytes

The original release is a single 10,089-byte JAR with 11 entries and no third-party library. It was meant to be a launcher for many games ("Project TAJJAVA is a project to create multiple games in Java Swing as a single application", says its README, in English and Russian) and in this first release exactly one game is finished. Its main menu has one button. The SourceForge project page, last updated in May 2013, now reads "This project is now inactive. It has been split into separate projects for each of the games."

## The split, and a license that changed with it

The separate 100-Square Challenge project was registered on 15 May 2011 and its code snapshot is dated 28 May 2011. It is licensed GPLv3 where TAJJAVA was AGPL, and its Java package is `tajjada` where the original's is `tajjava`. The snapshot holds a startup menu, a configuration window and a shared-settings class, and none of the grid or knight-move logic: the game engine never reached it. The playable historical game therefore exists only in the AGPL JAR, which is what this port follows. The snapshot is preserved beside it as family history and nothing in the port derives from it.

## Two bugs you can read in the source

The Java original is small enough that its defects can be read as well as observed. The Undo button guards itself with `plsq != lastsq`, a comparison of object references rather than coordinates. At startup both fields point at the same object, so Undo does nothing (the button is enabled anyway). After the first move they are different objects, so Undo runs. Undoing move 1 blanks the top-left square and then offers knight moves from it, instead of offering the top-left square again. In the browser version Undo is disabled until there is something to undo and undoing move 1 offers the corner.

The second defect is in the mouse handler: its first line is `if (gended) reset()`. Any click on a finished or blocked board wipes it, including a click meant only to look at the result, and `reset()` clears the squares without clearing the ended flag or the Undo button. The browser version ignores clicks on a finished board, so the result stays visible until you choose Undo or New game. Neither change touches the geometry of the puzzle.

## Running the original again

The delivered oracle log came from an audit that ran the original JAR. When the game was integrated, the same 15 scenarios were run again, headless, on the original classes under Java 1.8.0_503. The harness sits in the game's own Java package to reach the package-private fields, calls the real click and action handlers, and replays the same witness paths. Every state matched the log exactly, the two bugs included (`tools/oracle/`, output in `tools/oracle/rerun-output.txt`). A small Node test keeps that stored output consistent with the delivered log.

## Witnesses that are not hints

The tests replay 15 complete 100-square paths, one for each start-square symmetry class, plus one 24-square dead end. They come from mathematical analysis and are not extracted from the Java game, so they show that the puzzle can be completed and that the rules accept every step. The one that starts in the top-left corner ends on (6,7), which is where the original oracle log ends its full-solution scenario. The game never uses them.

## What integration changed

The package arrived with the deployable page nested one level down (`public/100-square-challenge/`). The collection wants `public/index.html` at the root, so the page moved up, the tests were repointed (path changes only) and the collection's lint rules, scripts, analytics snippet and license notes were added. The game logic was not touched.

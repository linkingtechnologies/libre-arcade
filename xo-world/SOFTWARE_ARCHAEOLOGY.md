# The software archaeology behind XO World

This is the recovery story of this one game. The philosophy shared by every game in the collection (preserve the reasoning and not just the artifact, verify by execution rather than resemblance, record provenance instead of erasing it) is in [`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).

## A program that kept its first language

XO World is one of the applets in JavaGames 1.0, an archive dated 7 February 2007 that the file headers credit to Milan Babuškov for "2000-2007". He is also the author of Njam, which is in this collection too. The source of the game, `xoworld.java`, opens with a warning in its author's own words: the first version was written in C and in Serbian, a lot of the code is copied over unchanged, and it is probably not an example to learn Java from.

The Serbian shows. The identifiers are `potez` (move), `igraj` (play), `pobeda` (victory), `dubina` (depth), `znak` (mark), `mesto` (place), `brojac` (counter). The port keeps every one, so the two sources can be read side by side. The dates agree with the comment: seven of the eight images of the game are stamped 5 April 2000 in the archive, while the Java source and its compiled class are from 6 February 2007, ten minutes apart.

## What the computer player is

It is not a minimax search. `igraj()` is a ladder of tactical detectors tried in a fixed order, and the first one that fires decides the move. In the order of the source: a fixed reply to the first stone, the "X_X" bridge on the second move, an immediate five for the computer and then a block of the human's, a chance to make an open four, double closed fours, a closed four with an open three, the human's equivalents, a bounded forced-sequence search for each side, double open threes, three small patterns called Cross, Box and "between", a "dummy defence" next to the human's stones, two weaker pattern moves, and finally a random empty square next to an occupied one.

The search is `checkSerie()`: it tries a move that makes a threat, plays the answer the other side's own detectors would choose, and recurses, giving up at depth `DUBINA = 7`.

The original keeps some oddities that the port keeps too. `check2o3c()` leaves its trial stone on the real board when it finds a hit, which is harmless only because the caller overwrites that square. Both diagonals of `check5()` write into the same helper array. The random fallback uses `Math.random()`, which cannot be seeded.

## What the restoration package could and could not show

The package that brought the port to the collection described a Java oracle with 22 expected moves, but the harness (`XOM2OracleHarness.java`), its run log and a document of known bugs were not in it. The expected values had to be taken on trust. The original archive turned up next to the package, with the SHA-256 the package's own notes give for it, and the Java was run.

## What running the original showed

- The 22 expected moves are what the original answers.
- Two thousand seeded games were played against the original and the port in lockstep, with every click compared: 27,287 clicks, 5,690 of them replies by the random fallback, 2,467 clicks the original refused. There was no difference. That run exercises every line and 98.9% of the branches of the ported engine, and reaches the search cap of seven in 18 games.
- The same run agrees on Java 21 and on the compiled `xoworld.class` of 2007, a Java 5 class file.
- The original's `new game` does not reset its working arrays and the port's does; over 2,000 games on one persistent original object, that made no difference to any reply.

The human side of those games is weak by design, four styles of play chosen to provoke the computer, and the computer won 1,541 of the 2,000 games to the human's 68. That says the sample was made to explore the opponent's tactics, not that the opponent is strong. The limits of the method are in [`specs/port-map.md`](specs/port-map.md).

## What a real browser found

The package's own notes say its real-browser screenshots could not be taken in its environment. They were taken here, and two faults of the browser build came out: the board was 644 by 646 pixels, because the canvas size subtracted a fixed 12 pixels where the padding is 14, and below 430 pixels wide the container was wider than the room the page left it, so the help button sat 2 pixels off the right edge of the screen. Both are fixed in `public/` and neither touches the engine.

## The rest of the archive

The archive also holds the sources of `tetris`, `pogodi` and `stomak`, pages for the Memory and 100 Mack games, and 48 images in all. They belong to other applets and are not part of this folder; `reference/javagames-1.0/ARCHIVE_SHA256.txt` lists all 63 files so each can be identified later.

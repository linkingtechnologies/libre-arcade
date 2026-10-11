# The software archaeology behind 5ud0ku

This is the recovery story of this one game. The philosophy shared by every game in the collection (preserve the reasoning and not just the artifact, verify by execution rather than resemblance, record provenance instead of erasing it) is in [`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).

## A generator that lived on the phone

5ud0ku 1.8 is a Java ME application for CLDC 1.0 and MIDP 1.0 phones, written in 2006 by Ivonne Engemann and Marcus Wagner, who published as Ive&Case. It is not a viewer for puzzles made elsewhere. It contains a complete generator, two solvers, a check that each puzzle has exactly one solution, three difficulty levels, pencil marks, a hint that reveals a cell, undo and redo, saves in the phone's record stores, and a way to type in a puzzle of one's own and have it solved. Its source is 32 Java files, about 10,500 lines, with dictionaries in five languages (German, English, Hungarian, Polish, Slovak).

Preservation value lies in the algorithms and in how they fit a small device, not in the pictures: the grid is a nine by nine array of slots, each slot holds its candidates as one integer bit mask, the undo history is a ring of 100 entries, and a puzzle is saved in a few hundred bytes.

## What the generator does

`GridCreator` fills the three diagonal boxes with random permutations (they share no row or column, so any order is legal), completes the grid with the first solution of a plain search, and hides numbers in symmetric groups (one of three symmetries is drawn for the whole puzzle). The first 36 are hidden without a check. After that the mixed solver in `GridSolver` (singles, hidden singles, then guessing the first empty cell with the digits in order) proves that exactly one solution remains, and each further group is removed only if that stays true. The targets are 40, 33 and 23 numbers left for Easy, Normal and Hard.

Hard is selected: `CreatorTask` generates three unique puzzles (the original's default, with a 15-second limit) and keeps the one with the deepest backtracking, then the one with fewer singles plus given numbers, then fewer given numbers. A last pass, `Grid.randomizeDigits()`, renames the digits with a second random generator.

The program uses `java.util.Random` twice, once in the generator and once in the final renaming, both seeded from the clock. That is why the oracle seeds them by reflection, and why the port takes two seeds.

## What the restoration package could and could not show

The package that brought the port to the collection records a Java oracle of its own (its "M2" and "M3A"): the generator and solver classes compiled unmodified with a stand-in for the phone's dictionary and record store, three generated games and ten solver puzzles with their results, and a save written by the original `Grid`. Its notes also say, in one place, that the 63 KB jar was run in a compatibility runtime at two screen sizes, and in another that the emulator test "remains open in the current environment". They cannot both be right, and no log of such a run is in the package. The documents also count 28 Java files where the archive holds 32.

The source archive itself, with the SHA-256 the package's notes give, was inside the package. It is byte for byte the file in the Internet Archive's snapshot of the authors' own download address (7 December 2013), downloaded and compared by SHA-256. The licence is in a file inside the archive (LGPL 2.1 or any later version) and on the authors' manual page; the Java files carry only a copyright banner.

## What running the original showed

- The package's three generated games and ten solver puzzles are what the original classes produce.
- 1,300 seeded games (500 Easy, 500 Normal and 300 Hard) were run through the original `CreatorTask` and through the port, with the board, the solution, the numbers shown, the singles, the backtracking depth, the type, the solution count and the bytes of the save compared: no difference. About half of the Easy and Normal games needed more than one try before a unique grid came out, and Hard up to 12 failed tries before its three candidates, so the retry loops were exercised on both sides.
- 514 puzzles for the solver, in the order of the original's `SolverTask` (rules check, then search): 106 broken, 6 without solution, 184 with one, 218 with two or more.
- 600 sequences of moves on a grid and its history, 81,910 commands. The original ring buffer holds 99 moves and not 100; the port does the same, and its `stepBack()` returns the position the original returns.
- The same on Java 8 and on Java 21.
- Twenty-six faults put into a copy of the port, one at a time: 23 caught, 3 that change no result the harness can see. The first harness missed a `clone()` that copied the elapsed time, and learned two commands for it.
- The first harness never finished: it gave the plain solver a puzzle with two equal digits in a row, which the solver does not notice because it compares only the digits it places. The original's `SolverTask` checks the rules first, so the harness does too.

The limits of the method are in [`specs/port-map.md`](specs/port-map.md): the 15-second limit of Hard is not reproduced, the user interface has no executable original, and a random draw of exactly `Integer.MIN_VALUE` (one in 4.3 billion), which the original would turn into an out-of-range index, was not compared.

## What reading the original showed

The user interface (`SudokuUI`, `SudokuStateControl`) cannot run here, so it was read and compared with `GameSession` and the browser code. One difference mattered: the original calls a board finished when it is full and `isValidSolution()`, where the package compared it with the stored answer. The two agree for a generated puzzle, which has one solution, and not for a typed one with several. The port follows the original now. Four more behaviours of the phone interface were added after the same reading: the digit typed twice clears the cell and pencil mode gives way on a cell with a digit, the display of the solution, the reset, and editing the current puzzle. The remaining differences (the marks on the number pad and a few menu commands) are listed in the port map and were left as they are.

## What a real browser found

Three faults in the page, none in the engine: below 380 pixels wide the labels of the tool buttons were hidden with `display:none`, which also removes them from the accessible names; at 568 by 320 pixels the board shrank to 94 pixels, because the side-by-side layout began only at 650 pixels; and in Italian the six tool buttons did not fit the 210-pixel column of the landscape layout, so one left the screen. They are fixed in `public/src/browser/styles.css`, and the layout was measured again at 35 window sizes in English and a dozen in Italian, from 320 by 568 to 2560 by 1440.

## The rest of the archive

Besides the Java files, the archive holds the five dictionaries and a `lang` file, the Ant and EclipseME build files with `building.txt` (Eclipse 3.1, EclipseME, Antenna 0.9.13, Sun Wireless Toolkit 2.2, ProGuard 3.4), the two licence files, a descriptor, and nine PNG images (the icon and eight sheets of digits). The images are not redistributed because nothing says who drew them; `reference/5ud0ku-1.8/ARCHIVE_SHA256.txt` lists all 55 files so each can be identified later, and `reference/5ud0ku-1.8/SOURCE.md` says how to fetch the archive again.

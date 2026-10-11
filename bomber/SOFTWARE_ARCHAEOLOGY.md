# The software archaeology behind Bomber

This is the recovery story of this one game. The philosophy shared by every game in the collection (preserve the reasoning and not just the artifact, verify by execution rather than resemblance, record provenance instead of erasing it) is in [`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).

## A game of one button and one loop

Bomber is a plane that flies over a city in rows, drops one bomb at a time, and has to level every building in its path before it reaches the ground. The J2ME program that this game restores is one class, `GameCanvasBomber`, whose whole logic is a single `run()` loop: a `switch` on a variable called `appStatus` (startup, title, new city, playing), a sleep of 141 ms at the end of every turn, and almost nothing else. Its author credits the idea on the title card: "ORIGINAL GAME BY JOSEPH DUFFY", "J2ME ADAPTATION BY JUAN J LUNA".

The J2ME source credits Joseph Duffy as the author of the "original game", and the SourceForge page calls it "based on a Spectrum 48k classic original game". World of Spectrum catalogues a ZX Spectrum Bomber attributed to Joseph Duffy and dated 1983, which is a plausible match; nothing independent proves that it is the very program the J2ME author had in mind, so this folder says only what the J2ME game says and treats the match as a proposed genealogy. Other programs share the name, among them another Spectrum Bomber by Paul Shreeve in 1984 (which the Spectrum Computing database describes as inspired by Blitz) and the unrelated Java ME project `j2mebomber`. The J2ME source refers to the Spectrum once: the block size is "inherent to Spectrum char of 8x8". Its other comments are in Spanish ("si x==0, gana", "control de fps"), which fits its author.

## What the archive shows

The archive is a small project tree, `Bomber.zip`, with `bin/`, `classes/`, `lib/` (empty), `res/` and `src/`. The sources are dated 21 December 2008, the compiled jar and classes 18 December, and the four PNG resources 5 December: the code was touched after it was last compiled, three days later, and the header's "Copyright (C) 2007" is older than every file. The SourceForge project that published it, `bomberj2me`, was registered on 21 December 2008, the day the sources were last saved, and its `Bomber.zip` was released the next day under a folder called "Bomber 1.0". Its description calls the game "based on a Spectrum 48k classic original game" and "tested on Nokia 6234 mobile phone"; its licence label says GPLv2 where the files say version 3. The descriptor names CLDC 1.1 and MIDP 2.1, a vendor "Unknown", declares a jar size of 100 bytes for a jar of 9,061, and points at an icon `Bomber.png` that is not in the archive.

In `GameCanvasBomber.java` a keyword `private` stands in front of a block of comments and fields, and covers only the first of them, `appStatus`. Every other field is package-private. That is why the verification could set the original's random generator, and why it needed reflection to read one variable.

## A key that is read twice

The loop calls `getKeyStates()` at the top of every turn and ignores the answer, then calls it again where the bomb is launched. The MIDP rule is that the call reports keys pressed since the previous call, so the first call clears whatever was latched during the 141 ms sleep. The second call, moments later, sees only a key that is still down. A tap shorter than a turn can therefore be lost on a phone as well. The port first read the held state at each tick, which is the same rule; measured in a browser, a press of 30 ms drops a bomb between half and two thirds of the time, one of 70 ms between half and four times in five, one of 150 ms always. A web page is tapped, not typed, so the port now remembers a press until the next turn and every press counts: a deliberate difference, recorded in the port map.

## What running the original showed

- A landing needs more than surviving: every one of the first 25 buildings has to be levelled to zero or below, because the plane at the last column collides with any building of height 1 or more. In 138 landings found in the original's own traces, none had a standing building left.
- Building heights can go below zero. An impact removes up to three blocks in a loop that does not check the height again, so a building of height 1 hit from a low bomb ends at -1. The port keeps it.
- The random generator is the one thing the original takes from the clock. Replacing it with a seeded one made the whole game reproducible, and the port's generator, a 48-bit congruential generator written in BigInt, gives the same numbers as `java.util.Random` for every bound from 1 to 100.
- After a successful landing the original keeps going through the rest of the same turn and plays a motor tone before the next city's melody. The port does not. It is the only difference the oracle reports over 750,000 iterations.

## The trick that made it fast

The original sleeps for 141 ms every turn, so a game takes minutes in real time. The oracle compiles the original unmodified together with a class called `Thread` in the same package: a class of the same package shadows the ones imported on demand, `java.lang.Thread` among them, so every `Thread.sleep` in the original lands in a stand-in that only adds up the milliseconds. The loop runs in microseconds and reports what it would have waited.

## The binary and the source, three days apart

The compiled class is from 18 December 2008 and the source from 21 December. Run through the oracle after redirecting its one `java.lang.Thread` reference in memory, the binary produces the same 750,000 iterations as the source: the same totals (1,540 games, 1,290 crashes, 93 landings, 37,474 impacts), the same tones, the same waits, and the port agrees with it after every one. Whatever the author changed in the three days after compiling, it did not change the game's behaviour on this sample. One technical trace of the build remains: the binary calls `Graphics.drawImage` with a `void` descriptor, so it was linked against a library where that method returns nothing.

## What was not preserved

The compiled `.class` files and the jar are not redistributed, and neither are the four PNG resources, because nothing in the archive says who drew them. The browser build draws its own plane, bomb and buildings. The original's compiled class names `java.lang.Thread` directly in its bytecode, so the same trick does not reach it; it was run anyway, after rewriting that one reference in a copy held in memory (see below).

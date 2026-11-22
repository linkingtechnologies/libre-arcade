# Can You Compile a NES Game Into a Modern Application?
What restoring Lawn Mower taught me about emulation, static recompilation, and the difference between preserving code and preserving behavior

I wanted to find out whether an old Nintendo Entertainment System game could become a modern, maintainable application without an emulator inside it. Not a ROM running in a browser window, and not a JavaScript wrapper around someone else's virtual console. I meant code that a developer can read, change, test and build with familiar tools, while the game still behaves like the original.

The game is Lawn Mower, a small homebrew that Shiru wrote in 2011. You drive a mower that never stops, cut every patch of grass, fetch fuel cans before the tank runs dry, and try not to waste petrol on flowers and stones. It sounds like something you could rewrite in a weekend, which is one reason I picked it for [Libre Arcade](https://linkingtechnologies.github.io/libre-arcade/), a collection of old open games brought to the browser.

Three things could be done with it: run the original ROM on an emulator, translate the ROM into host code ahead of time (static recompilation), or write a new implementation of the rules. I did the first and the third, and used the first to check the third. I did not do the second, and this article says where that leaves the question.

## What we recovered

The first artifact was the package Shiru entered in the 2011 NintendoAge NES Coding Competition: a ROM, a manual, a cartridge label and his notes. The ROM says `Lawn Mower v1.1 30.05.11`. A separate source archive holds a later revision, v1.12, dated 1 July 2011, written in 6502 assembly for NESASM (the main file is about 2,700 lines), with the level editor's source and the FamiTracker exports of the music. Shiru declares the game Public Domain in the source itself, and so does his sound library.

The ROM is 24,592 bytes: a 16-byte iNES header, one 16 KiB bank of program and one 8 KiB bank of graphics, mapper 0 (NROM), vertical mirroring. No banking logic sits between the CPU and the code. But the graphics memory is not only graphics. The ten levels are stored in it, in the space the patterns leave free, as ten 95-byte records at `$1000`. Their widths grow from 14 tiles to 20, 25 and 30. Looking only at pixels would not have recovered the game.

There are three programs to keep apart, and the provenance of each is different:

- **The competition ROM, v1.1.** I have the file that came with the first port. I found no upstream copy to compare it with.
- **The author's own v1.12 build.** The Internet Archive holds a zip with a ROM that says `Lawn Mower v1.12 01.07.11`, which the Archive says it took from Shiru's site. I downloaded it. Its graphics are identical to the competition ROM's. Its program differs in 7,728 of 16,384 bytes, which is not 7,728 changes of behaviour: the program moved from the lower to the upper mirror of the cartridge, and the author's cleanup moved most of the code when a loop was inlined.
- **The v1.12 source, assembled.** The source archive is byte for byte the Internet Archive's copy. The author's assembler is not in it.

That last point has a postscript. My first assembler, a port of one that came with the first version of the port, built the source into a program that differed from the author's v1.12 build in 7,013 bytes. It was missing one rule of NESASM: an operand is encoded as a zero page address only when it is a plain number of one or two digits (or is written with `<`), and a symbol is always an absolute address. With that rule, which I worked out for another game of the collection, the source assembles into the author's v1.12 ROM with no byte different. So the source in the archive is the one the author built from.

## Four ways to give old code another life

Before choosing a tool I needed to stop using four related words as if they were one.

**Emulation** reproduces enough of the original machine that its binary runs: CPU, memory map, graphics and sound hardware, interrupt timing, cartridge behaviour. The old program still talks to a model of the old machine.

**Static recompilation** translates identified machine instructions ahead of time into a host language, usually C, which is then compiled for a modern CPU. The generated program still needs a runtime that models the console's memory, registers, graphics and sound. It is not automatically a clean rewrite of the rules.

**Decompilation** tries to recover higher-level structure from machine code. A disassembler can tell you that a byte is loaded from `$CB`; it cannot reliably tell you that the byte is the remaining fuel.

**Semantic porting** starts from a different question: what did the game do, and which behaviours must survive? You recover the rules, and write the graphics, input and sound again for the new platform. The rules become readable, at the cost of having to rediscover every hardware quirk that influenced them.

My shorthand is that emulation preserves the machine, static recompilation preserves execution, and semantic porting tries to recover intent. It is a lens, not a taxonomy, and real projects mix the techniques.

## What I actually did

The first port of Lawn Mower came from a restoration package written with an AI coding assistant: a JavaScript game, reports, and tests. Its tests compared the port with its own earlier output and with pictures its own scripts drew. None of them ran the original.

The second pass, with a different assistant and under my direction, replaced those tests with an oracle. I wrote a small NES, with a 6502 core that counts cycles, the memory map, the controller ports, the vertical blank and the NMI, the scroll registers and the sprite 0 hit, and a log of every write to a picture register. It runs the ROM beside the JavaScript game with the same buttons. At every NMI it compares the game's variables, the picture unit's memories (nametables, palette, sprites), the eleven bytes the sound player hands to the sound chip and, composed scanline by scanline from those memories and the register log, the picture pixel by pixel.

It runs against all three programs: the competition ROM, the author's own v1.12 build and the source assembled here. The last long run covered about 455,000 frames against each, with two seeds and five scenarios (a player that mows and fetches fuel, one that uses the game's cheat code to reach all ten levels and the final screen, two that press buttons at random, and one that never mows and runs dry), and found no difference in any frame except one documented below. The oracle is only worth something if it can fail, so there is a test that breaks the port in thirteen ways, one at a time (a bit of the random generator, the pacing, the pad's edge rule, a tile of the picture memory, one note of the music), and each break is seen.

One caveat belongs here. The NES is mine, not an independent emulator, and an error in my 6502 core would be shared by every comparison. The core has tests of its own, and the tables the ROM holds are checked byte for byte against the source, but that is not the same as an external reference.

## What the oracle found

The package's port had been written from the text of the source, and the ROM disagreed with it in many places. Some are rules, and some are the machine.

**The pacing.** On NTSC the game skips its logic on every fifth NMI. The skip is decided by a register, X, that the main loop passes to its end. The routine that looks for a place for the next fuel can does not preserve X, so whenever it searches, it leaves X nonzero and the skipped NMI runs the whole game anyway. A loop written as "update at 60 frames a second, skip every fifth" cannot reproduce that, and the fuel can's timing follows from it.

**The pad.** The original reads the controller only in some of its loops, and takes a button as pressed when it was not down at the previous read. START un-pauses, or acknowledges the final screen, only when it is the one new button. The first port took a one-shot START from the page. There was also a cheat on the title screen (right, up, left, left, then SELECT skips levels) that the port did not have at all.

**The random numbers.** The generator is an 8-bit Galois register:

```js
const carry = (seed >>> 7) & 1;
seed = (seed << 1) & 0xff;
if (carry) seed ^= 0xcf;
```

It is seeded once, on a cold reset, not when a game begins. The title screen takes a number on every processed frame once it waits for START. Fuel cans, the variant of each cut tile, the shake of the screen and the cuttings the mower throws into the air all share it, so the position of the next can can depend on a piece of grass. A port with separate random streams for cosmetics and for the game would be cleaner, and it would not be Lawn Mower.

**Fixed point.** Position is 12:4 fixed point. Speed starts at 20 raw units, boost adds two while the speed is below 48 (47 can become 49), and speed then decays by one per frame, by two on even frames, down to 15. Small differences in these units compound over a level. The fuel system is as concrete: 232 at most, 38 for hitting flowers, 77 for a stone, and a can refills it.

**The picture.** The 64 sprites have a priority, the lower number in front, and at most eight to a line. The first port drew them in table order, so the mower's body lost its details. The fade is the original's four-step brightness table applied to half the palette on each NMI; the first port laid black over the picture. The message's flash band is at lines 118 to 155, two lines lower than the first port drew it. The frame counter goes on counting while the display is off between screens, and the fuel decrement and the speed decay read its low bit, while the can blinks with its fourth.

Where the original's two versions differ in what the game does, the oracle says so exactly. In the no-control path of `checkPad` (the level is cleared or the tank is empty), v1.1 clears the requested direction and v1.12 does not, so a moving mower in v1.12 starts into the next tile, at most 14 sixteenths of a pixel, before the end of the level takes over. The page follows v1.12, with a switch that follows v1.1, and a test measures the difference in each of the four directions.

## What is not the same

The author's v1.12 build loads the fifth lawn with the display off for 10 NMIs on some entries, and for 9 on others; the competition ROM and the assembled source take 9 every time. The port's table says 9. It has no cycle counts, so it cannot say 9 for one entry and 10 for another. A replay with the same buttons at the same moment found the fuel falling a frame earlier or later on that lawn. The median gap between the two mowers was under a tenth of a pixel, and the peaks were 0.3, 1.6 and 6 pixels. I know the likely cause now: the author's ROM is what the corrected assembler produces, and the assembled program in my oracle was laid out differently, and an absolute operand takes a cycle more than a zero page one. I have not yet run the oracle on the corrected assembly to confirm it.

Other limits are written in the game's notes. The oracle does not compare the few lines where the original changes a register in the middle of a line. The colours are a table chosen for the port. The sound is compared at the input of the sound chip, not as a waveform, and the browser's synthesis of it is heard, not measured. The port is NTSC only.

## What I did not do: static recompilation

I read the documentation of the available NES recompilers, and I have not run any of them on Lawn Mower.

- [NESRecomp](https://github.com/mstan/nesrecomp) translates 6502 into C and supports mapper 0, which makes Lawn Mower a plausible input. Its default backend emits C that performs each CPU bus cycle against a hardware model, and a legacy backend uses direct calls. Its documentation is clear that the command-line tool does not produce a playable game by itself: it generates C, a proposed configuration and build files, and each game still needs its own configuration and runner. Its licence is PolyForm Noncommercial 1.0.0, and I would not bundle its runtime in a GPL-3.0 collection, however free the game itself is.
- [NES Recompiled](https://github.com/SeppoPakonen/nes-recompiled) is MIT-licensed and builds with SDL2, but every entry of its compatibility table is still marked TBD.
- [NESgen](https://github.com/Xenomega/NESgen) was a university compilers project. It says its support for real ROMs is very limited, states no licence, and was archived in November 2023.
- [GB Recompiled](https://github.com/arcanite24/gb-recompiled) and [N64Recomp](https://github.com/N64Recomp/N64Recomp) do the same job for the Game Boy and for the Nintendo 64, with a shared SDL2 runtime in the first case and a separate runtime project in the second. They cannot take a 6502 ROM, but they show how much of the work is the runtime and not the instruction translation.

So the honest answer to the question in the title is that I have a tested semantic port and a compared-against-the-original emulator, and a promising but unrun route to a recompilation. I cannot say which approach is better. That would confuse ambition with evidence.

## Which approach next time

Maintainability is a different output from fidelity. In the port, a stone costs `Math.floor(FUEL_MAX / 3)`, a constant in a file you can read, and a change to 60 is one line and a test. The kernel is a transcription of the assembly, routine by routine, and it keeps the original's variables and units so that they can be compared with the ROM's memory. In statically generated C, the same rule would appear as loads, compares, branches and carry manipulations, because the tool preserves how the 6502 executed it and not what a stone costs. A function called `nes_adc` is not more maintainable than the instruction it replaces.

The advantage can run the other way. A recompiled game keeps many CPU-level details for free, and a runtime with an accurate graphics and sound model could keep the title screen's split lines and the timing side effects without my having to translate them one by one. That is the experiment I want to run next, with the same buttons and the same checkpoints as the oracle: cold reset, first patch of grass, first can, flower, stone, running dry, a level cleared, all ten.

For a small homebrew title I would keep the emulator in the lab even if it never reaches the final application. The ROM is the part I trust most. Not because it tells me what Shiru intended, but because, once instrumented, it tells me what his program did.

## Where the AI comes in

The first port and the second pass were both made with AI coding assistants. The first had no way to tell whether it was right, because nothing in its tests ran the original. The second had the ROM to run, and found that the first port disagreed with the original in the pad, the pacing, the frame counter, the picture and the sound. What does not depend on who wrote the code is the comparison. Decisions that are in no source, such as which of the two versions the page follows, are written down in the game's notes, with the switch that reverses them.

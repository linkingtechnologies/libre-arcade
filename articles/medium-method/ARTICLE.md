# A port that looks right is not a port
How I check old games against the programs that made them

Take a game from 2006 whose author has moved on, write it again for the browser, and play it for ten minutes. It will feel right. That feeling is worth very little, and most of what I have learned in the Libre Arcade project comes from finding out how little.

Libre Arcade is a collection of old open-source games brought to the browser: NES homebrew, Java games for phones, SDL games from programming contests, a Linux toy train. The rule of the project is that a game is not finished when it looks like the original. It is finished when it has been compared with the original, and when the page says honestly what that comparison did not cover.

## The original is the judge

Most of these games still exist in a form that can be run. A cartridge image runs on an emulator. C++ source builds with a current compiler. Java source compiles. So the first question for every game is not "how do I write this?" but "can I run the original next to my version, give both the same input, and see where they part?"

That turns a vague worry ("is it faithful?") into a diff. The answer stops being a matter of taste.

## Three ways to run an original

**A ROM, on a core written for the purpose.** Lan Master and Lawn Mower are NES games by Shiru, released into the public domain along with their source. Rather than trust an existing emulator, I wrote a small NES and 6502 core, and ran the author's ROM on it beside the JavaScript page, with the same buttons. After every frame the harness compares the picture pixel by pixel, about forty of the game's variables, and the calls to the sound player. For Lan Master that covers seven scenarios, all 50 levels from their passcodes, and a bot playing 20,000 ticks. The source also assembles here into exactly the bytes of the author's ROM, which took one rule: an operand is a zero page address only when it is a plain number of one or two digits, and a symbol is always an absolute address.

**The original C++, compiled and run without a screen.** Ri-li is a toy train game from 2006. Its source builds with a current g++ after three changes, none to its logic. It links against SDL 1.2.15, built from the official archive, on a video driver that draws nothing on a monitor but gives the program real surfaces to draw on. The clock is a counter: the original sleeps until a sixtieth of a second has passed, and the harness lets that sleep move the counter forward. A minute of play takes a moment and gives the same result every time.

**The original Java, in virtual time.** MilCity is a strategy game for J2ME phones, built from clocks and threads. Its core, model and drawing code are compiled unmodified, and a class loader changes three names inside them: the thread, the clock and the random generator become stand-ins that live in virtual time. After every tenth of a second the state of both games is reduced to a checksum and compared.

The trick shared by all three is determinism. Fix the clock, the input and the random seeds, and any difference between two runs is a finding, not noise.

## What the comparison finds

In the games that came with an existing port, the first runs found places where it was wrong in ways nobody had noticed.

Ri-li's pieces around the quiz panel each get a random frame and a random offset, drawn in one call: `Affiche(100, 160 + rand() % 130, rand() % 18)`. C++ does not say which argument is computed first, and g++ computes the last one first. The port had them the other way round. It used up the same random numbers, so a comparison of the numbers saw nothing. Only a comparison of the pictures could tell.

In MilCity, when the computer fires, the original creates a second random generator just to choose which opponent to hit. In a game with one opponent the choice is trivial, but the numbers it uses up are not, so every later choice of the computer came out different in the port. The port also gave points to the computer for hits that the original never scored: in the original the score goes only to the local player.

In Lan Master, the figure at the top rose to 50 at the start of a level with nothing joined, because a computer that reaches no cable was counted as connected. In a real browser the cursor left a black hole in the board.

Ri-li had a package whose proof was a list of keys for each level that the page follows to the last wagon. That proves the page is consistent with itself, and the original is not part of it. Once the page did what the original does, 14 of the 50 routes stopped working.

## Keep the quirks

The opposite mistake is just as easy: "fixing" what looks like a bug. Lan Master compares a new percentage with the largest it has seen by looking at the high byte and then at the low byte, and gives up if either is smaller. A larger figure with a smaller low byte is not taken. Level 26 shows it. It looks like a mistake, the ROM does it, and so the page does it.

The rule I follow is that if the oracle says the page is wrong, the page is wrong. A restoration that improves on its source is a new game, which is a fine thing to make, but it is not a restoration.

There is one place where I did choose. The original Lan Master cursor glides for eight frames and ignores START while it moves. The page first jumped a whole tile at once. Which one to keep was a decision for the person who owns the collection, and the original's was chosen.

## Test the test

A comparison that never fails proves nothing. For MilCity I introduced nine deliberate faults into the port, such as a missile silo that costs 11 or a shield that covers a larger area, and each one is caught. After the fixes, the two agreed in 65 scenarios, 37,800 seconds of game and 7,308 actions of the player, and in 39 more on the classes of the author's own deployed jar.

## Where the AI comes in

I built these ports and their comparison harnesses with Claude Code. That includes the small NES core and the class loader that puts MilCity in virtual time. I think it is fair to say so plainly, and it is also the reason for this whole method: a model can write a port that looks right as easily as I can, and a reader has no way to tell by looking. What does not depend on who wrote the code is the comparison. The ROM, the compiled C++ and the original Java do not care, and the first runs found errors in code written by people and by the model alike. The decisions that are not in any source, such as keeping the original cursor in Lan Master, were mine.

## Say what was not compared

Every game in the collection carries a statement of how strong its evidence is, in three levels. Level 1 is an executable oracle: the original runs and its behaviour is diffed. Level 2 is hand-computed exact values, for pure arithmetic when nothing can run. Level 3 is a documented source-level review, reading the original function by function. The game's own notes record which level applies, so that a reader never mistakes one for another.

Ri-li's notes say that the page's own texts exist only in Italian and English, that the level editor of the original is not in the page, that the music is a conversion nobody recorded, and that the pointer and frames longer than 16 milliseconds were not compared. MilCity's say that the comparison covers the game and not the page: menus, panels, touch controls and saving were tried in a browser, not compared with the handset. Some games have only the browser check, and say so.

It is more useful to read a page that says what it did not check than one that says "verified".

## Provenance is part of the port

Old software comes with licences that are easy to get wrong. Ri-li's headers say "either version 2 or version 3" and not "or any later version", so the original is licensed that way and nobody gets to write "or later" for it. MilCity's original is GPL version 3 only. Where the original artwork or sound has an unclear licence, it is not shipped, and the page draws or synthesises its own. Where the original's licence is clear and permissive, as with Shiru's public domain ROMs, it is kept and the oracle runs on it.

None of this is exciting to write, and all of it matters to the next person who wants to build on the work.

## If you want to try this

1. Look for an executable form of the original before writing anything. A compiler, an emulator or a Java runtime is a bigger asset than the source.
2. Make the original deterministic: a virtual clock, scripted input, fixed seeds.
3. Compare at several levels: state, random numbers, sounds, and the pictures. One of those alone will miss something.
4. Break your own comparison on purpose, and see if it notices.
5. Write down what you did not compare.

The collection is at https://linkingtechnologies.github.io/libre-arcade/ and the code is on GitHub. Each game has its own folder with a short story of how it was recovered, the provenance of every file, and the list of what is and is not verified.

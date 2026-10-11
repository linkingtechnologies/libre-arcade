# Port map

Original: `reference/ConcentrationRoom-0.02/source/src/` (6502 assembly for `ca65`, about 5,000 lines in 13 files, plus the release ROM `release/croom.nes`). Port: `public/src/` (the rules, the generator and the deal, the frame state machine, the CPU player, the pad model, the story tables and the sound data, as ES modules) and the drawing, input, dialogs and languages of `public/index.html` and `public/src/app.js`, which are new code and not a port.

## Verification level

Following the collection's verification hierarchy (root `AGENTS.md`):

- **Level 1, an executable oracle, for the game itself.** The preserved release ROM is run, and the port is compared with its memory. This covers the state machine and every timer, the scores and the turns, the cursor, the generator and the deal, the CPU player, the pad model, the Solitaire counter, the story's flow between stages, and the game's own random numbers.
- **Level 1 for data, by the ROM's own bytes.** Every table of the port is looked for in the ROM's program, byte for byte (`test/rom-data.test.js`): the English text, the story table, the sound and music data, the five layouts, the palettes. No code is run for this.
- **Level 1 for the pictures of the game screen, the title menus and the story screens.** The picture the ROM would put on the screen is composed from its memory (`tools/nes-frame.mjs`: nametable, attributes, palettes, scroll, sprites) and compared pixel by pixel with what the page's own renderers draw (`tools/render-oracle.mjs`, `test/render-title.test.js`, `test/render-story.test.js`). The game screen is compared at every iteration of the ROM oracle's scenarios: 119,426 frames of the 64 scenarios, identical. The title menus (with the arrow on every line), the 14 opponent scenes and the three opening and instruction texts (at 14 moments of their scroll, and the three steps of the fade) are compared by calling the ROM's own routines.
- **Level 3, source-level review, for what is left.** How the page turns the sound data into Web Audio (nothing here plays sound), the browser shell (the page, the dialogs, the page's own fades, the mouse and touch input) and the screens that were not compared (see the limits).

### How the oracle works

`tools/rom-oracle.mjs` boots the ROM on a minimal NES: `tools/mos6502.mjs` is a 6502 core with cycle counts (the 151 documented opcodes; `test/mos6502.test.js` checks addition, subtraction and comparison against their definitions for every accumulator, operand and carry, and the addressing modes, the stack, the branches, the indirect-jump page bug and the interrupt sequence against hand-written programs) and `tools/nes-machine.mjs` provides what the game touches: 2 KiB of RAM, the 16 KiB of program mirrored, the picture unit's status, address and data ports with the nametable, palette and sprite memory and the sprite DMA, the two controller ports with the strobe and shift protocol, and a frame of 29,780 cycles with the vertical blank flag and the NMI at its start. It draws nothing and plays nothing; everything the program computes is computed by its own code.

A scripted player steers the ROM through the title menu (mode, difficulty, the opening text) and then plays the game with seeded input, either random presses or a player that knows the board and walks the cursor to a card. The port plays the same game:

1. **The deal.** When the ROM's code is about to deal, the harness takes the generator's four bytes and the frame counter that the program is about to mix into them, and gives them to the port, which deals. The two boards must be equal (the 72 bytes of the ROM's board against the port's).
2. **The loop.** From then on the pad bytes the player puts on the ROM's controller ports are given to the port, once per iteration of the original's main loop (one iteration of `cardsLoop` is one frame, for the port as for the ROM; the harness hooks the entry of `read_pads`). At the start of every iteration the 174 fields below are compared with the ROM's RAM.
3. **The end.** When the ROM's `play_memory` returns, the last iteration is compared, and so is the generator (so the port consumes exactly as many random numbers as the ROM). In a session of several games, or a Story, the next game starts from the generator the ROM has by then, and the port's own `storyOutcome` decides the next stage: if it were wrong, the next game would not have the ROM's mode, difficulty or CPU noise and the comparison would stop there.

The 174 fields are the state, the state timer, the two selected cards, the two scores, the turn, the active pad, the first card's flip frame, the cursor, the background colour, the combo flag, the position and velocity of the collecting animation, the number of players, whether the last player is the computer, the difficulty, the scoring method, the CPU's state, timer and noise level, the four generator bytes, the 72 cards of the board and the 72 flags of what the CPU remembers.

The ROM's variables sit where the author's build tool shuffled them to, and nothing here labels them. The harness finds the frame counter, the generator, the entry of `read_pads`, the board and the two places where the program mixes the time into its seed by their code. It finds every other address by elimination: an address is the home of a field only if it held the same value as that field at every iteration of every game. A field left with no address is a difference.

### What was compared

The recording (`test/fixtures/rom-oracle.json`, made by `node tools/rom-oracle.mjs record --games 64 --seed 20100718`) has 64 scenarios, built from one seed:

| Scenarios | What they play |
|---|---|
| Four in every eight | one game of Solitaire, 2 Players or Vs. CPU (in turn) against a player that knows the board, at a random size of the five. A stray button is sometimes held as well, so that the computer's turns see the human pad being used |
| One in every eight | one game with random presses, at the two smallest sizes |
| One in every eight | three games in a row of random modes, with the generator carried over from one to the next |
| Two in every eight | the Story from its opening text, four stages (Solitaire, Vs. CPU, Solitaire, Vs. CPU), with the scenes between them passed by the A button |

In all, **310,756 iterations in 128 games** (124 finished, and 4 still going at the iteration limit, which agree up to that point): Solitaire, 2 Players and Vs. CPU at all five sizes, and 64 Story games. The states visited: 59,207 iterations waiting for a card, 25,830 turning one, 108,468 collecting a pair, 95,305 turning a miss back, 19,260 on a cleared table, 1,143 handing over a controller and 1,547 in game over. The events: 4,305 cards turned, 1,179 matches, 973 misses, 448 Solitaire misses, 861 jumps of the B button to a random card, 525 turns passed, 172 hand-overs acknowledged with A and B, 353 turns passed to the computer, 3,068 frames spent forgetting, and the computer's four ways of choosing (an unknown card as first, 250 times; an unknown second, 180; a remembered pair, 77; a remembered second, 147). 107 tables were cleared; 17 games ended in game over (Solitaire misses used up, or the computer winning).

**No difference remains.** 173 of the 174 fields have an address pinned down by the data; the 174th, the CPU's memory of the card at column 0, row 4 (which exists only on the 72-card table and which the CPU never remembered in these games), is placed at its place in the array, which the other 71 entries show to be contiguous (`placedByLayout` in the fixture). The addresses alone then explain all 64 scenarios again (the recording refuses to be written otherwise).

### What the oracle found

The package's port was written from the text of the source. Running the ROM showed it to differ in these places; all are fixed in `public/src/frame-input.js` and `public/src/state-machine.js`, with the reasons in their comments:

| Difference | In the ROM |
|---|---|
| Direction order | The release was built with the author's `shuffle.py -r` (`shufflemode = -r` in the makefile), which runs each `.shuffle` block in the reverse of its written order. The four handlers of `memorygame.s` therefore run Right, Down, Left, Up. It shows only when opposite directions are held together, which a keyboard can do and a pad cannot. |
| Handing over a controller | The jump that skips movement in `PASS_CONTROLLER` lands after the first handler to run, so only Right is skipped; Down, Left and Up still move the cursor. |
| The human pad during the computer's turn | The loop does not look at whose turn it is: the active pad keeps moving the cursor and B keeps jumping to a random card while the computer plays. |
| The computer's turn and pad 1 | `doAI` discards the new presses of pad 1, so A on that pad does nothing during the computer's turn. |
| Passing to the computer | In Vs. CPU a miss by the human leaves `PASS_CONTROLLER` at once; it waits for A and B only in the game for two. |
| A cleared table | `handleStateCleared` falls through into `handleStateStill` on its last frame, so A and B are read there. |
| The state timer | `play_memory` does not initialise it, so a game starts with what the last one left (255 after a game over). Compared only outside the waiting state. |

The "frame" nature of the original also showed that the **Select** button, held, makes the loop wait 15 vertical blanks (`USE_SELECT_FOR_SLOWDOWN = 1` in `memorygame.s`). It is not offered in the page. The oracle's players press Select now and then; an iteration is still one pass of the loop, so the comparison is unaffected.

### What the pictures showed

The package's renderers were written from the source and compared with a picture that its own script made. Comparing them with the ROM's pictures found these, all fixed (the first is what a player saw: the emblems of the open cards sat above the cards):

| Where | In the ROM |
|---|---|
| The table | The background is scrolled up by 12 pixels (`memorygame.s` writes `PPUSCROLL = 0, 12` every frame) and the sprites are not, so the emblems sit in the middle of the cards. The port drew the background without the scroll. |
| Card backs | The back is the tiles `$04 $05` over `$14 $15`; the port had the lower two swapped. |
| Emblems | An emblem is the sprite tiles `$6e $6f` over `$7e $7f` (the atlas is 16 tiles wide: below is +`$10`); the port swapped the lower two, which cut a hole in every emblem. |
| The arrow, the card that turns, the "Press A+B" message | Sprite palette 2 is white, red and black; the port's entries were one place off, so they came out red. |
| Corners of the table | `card_get_surrounds` starts the four corner cards with the bit of a neighbour outside the table, which rounds the corners of the playfield; the port did not. |
| The card that turns | Its sprites are one line lower than the port drew them (a sprite's `y` is the line above it). |
| Two collected cards | The second card's sprites come first in sprite memory, so they are on top where the two overlap; the port had the first on top. |
| Sprites and the background | Sprites are above the score boxes and the game-over wipe; the port drew those last. |
| The score boxes | The turn marker and the WIN mark reach the screen one iteration after the change (`handleStatePassController` and `handleStateCleared` rebuild them); the port showed them at once. |
| The arrow | During the hand-over it is parked under the new player's score box, off the bottom of the screen, and slides in from there; and a new game starts with it at its start position, not where the last game left it (in one page session the port kept the old one). |
| The opponent scenes | The text is double spaced (16 pixels a line); the character was one line too high in the package's pictures. |
| The opening and instruction text | Black text on the orange, rows 16 pixels apart; the scroll lasts (rows + 11) × 16 pixels, twice what the port had, and goes on while the screen fades; the fade is three palette steps (orange, darker, black) of 4, 4 and 3 frames, and the logo's white steps down with it. The port had white text, 8-pixel rows, a smooth fade and a logo one line too high. |
| The title | The black band at the foot of the screen starts at y = 224; the page's cover for the original's notice reached 8 pixels into it. |

The pictures of the opponents and of the Hombon logo were made by Python scripts in the package, which cannot run here and which put the character and the logo one line too high (the title's picture was already the ROM's, apart from its menu text). All of them are now made from the ROM itself (`tools/render-assets.mjs`, with `--check` to compare the files with a new run of the ROM), and the scripts and the package's reference board image (`test/fixtures/board-oracle.png`, drawn without the scroll and with both swaps) are gone.

### Fields compared only where they mean something

The original leaves some variables as they were; the port keeps tidier values. They are compared only while the original gives them a meaning:

- `collectingDX`, `collectingDY`: only while collecting, during the first 27 frames (the original never clears them).
- `aiTimer`: only while the computer is doing something (`curAIState` not idle).
- `stateTimer`: not in the waiting state, where it holds what the previous game left.
- `score1`: only in games for two; `solitaireMode` sets the misses left and never the second score.
- The CPU's memory (72 flags): only when the computer plays. The ROM marks a remembered card with any non-zero byte, so the flag is compared as zero or not.
- `isCombo` and `lastPlayerIsAI` are compared as flags.

### Limits

- The sample is seeded and broad, not exhaustive: 128 games, with the Story played to its fourth stage. Its ten-stage table (80 bytes) is compared with the ROM, so the later stages' modes, levels, noise levels, scenes and successors are the original's; but their games were not played.
- The deal's inputs are taken from the ROM: the generator and the frame counter at the moment of the deal. The page takes the frame counter from its own clock; the oracle shows that the same inputs give the same board, not what the page's clock will give.
- The machine plays no sound. It does not draw, but `tools/nes-frame.mjs` composes the picture from its memory (a still-frame compositor, not a picture unit: nothing about timing inside a frame, and the eight-sprites-a-line limit is the only hardware effect it keeps). The title menu and the opening text are driven by taps on the ROM, and the port starts at the deal.
- What the picture comparison leaves out: the first three iterations of every game (the original fades in through palette changes; the page fades in on its own); the page's own overlay for the scenes and its fades; the original's notice at the foot of the title ("room lite 0.02", the copyright, "Press Select for details"), which the page covers with white on purpose; the Italian text, which the original does not have; and the last opponent's lost text, whose missing terminator makes the original type past the end of the screen into the attribute table and spoil the colours of the picture after a few seconds (the port keeps the text and not the spoiled colours). The ink of the port's text is pure black where the console shows $0F (5, 5, 5): a tolerance of 6 per channel.
- The ROM was run on one machine model, with frames of 29,780 cycles and the picture unit's flags reduced to the vertical blank. The original's main loop waits for a frame, so every iteration here took one frame; a slower real console that dropped frames would not change the game, which counts iterations.
- The iteration limit (30,000 for the players that know the board, 5,000 for the random one) left 4 games unfinished, at the largest tables.

### Can the oracle see a fault?

A set of 30 deliberate faults was put one at a time into a copy of the port and replayed against the ROM:

- **Timings:** a flip of 4 frames, a miss shown for 89, a second card turned back after 5, a cleared table held for 179, a game over of 89, a collecting animation a frame early, a Solitaire miss counted a frame late, a repeat delay of 14 frames.
- **Rules:** a miss that does not pass the turn, an early win that needs a strict lead, a match worth 2, a miss budget of 19 plus 20 per level, a second score not cleared at the start, a tie that wins a Vs. CPU stage in the Story.
- **The generator and the deal:** a deal that swaps with the wrong offset, one wrong bit of the polynomial, the title mixing shifted by 2, the deal mixing stepped 7 times instead of 8.
- **The CPU player:** forgetting one frame fewer, forgetting into the wrong slot, waiting 29 frames for its second card, the wrong offset for an unknown second card, the human A not lost on the CPU's turn, the pass to the CPU waiting for A and B, the B button jumping to the lowest card instead of a random one.
- **The input:** all four directions skipped while a controller is handed over (the package's behaviour), the directions in the order of the source text, a repeat interval of 4 frames.
- **The Story and the end of a game:** the third stage's CPU noise of 11 instead of 12, and a cleared table that does not fall through into the next handler.

**28 of the 30 were caught.** The six quick scenarios caught 25 at once, with the first difference named (the field, the game and the iteration). The other three needed scenarios the quick set does not hold: a repeat delay of 14 frames showed only in one of the random players of the full set (the pad is held for 15 iterations or more rarely), the missing fall-through in one scenario of the full set, and the wrong noise level in a Story chain that reached its fourth stage. **Two were never caught:** a repeat interval of 4 frames instead of 3, because the oracle's players almost never hold a direction for 18 iterations with room left to move (the interval is checked by the package's unit test and by the source), and a tie that wins a Vs. CPU stage, because no Story game ended in a tie (the rule is read from the source: `cmp score` then `bcc notFail`, so a tie fails). This was done once during the integration (`--ids` on the replay picks the scenarios); the script is not kept.

### Recorded and live

`npm test` runs six scenarios against the ROM, again from reset, on worker threads (8,804 iterations, about ten seconds): a cheap cover chosen by the recording, which shows Solitaire, 2 Players, Vs. CPU and the first Story stages at the two smallest sizes, every state but the last, and the main events. It does not reach the three largest sizes, the computer's choice of a pair it already knows, or a session of several games; those are in the live replay. `npm run test:live` (`node tools/rom-oracle.mjs replay`) runs all 64 and prints the first difference with the field, the game and the iteration; `npm run test:render` (`node tools/render-oracle.mjs --all`) does the same for the pictures, 119,426 frames (about ten minutes). The fixture is tied to the ROM by SHA-256 and holds no copy of the ROM's output: it is the plan, the addresses and the totals. To record again, `node tools/rom-oracle.mjs record --games 64 --seed 20100718`, which refuses to write unless every scenario agrees and every field has an address.

## Modules

| Assembly (`reference/.../source/src/`) | JavaScript (`public/src/`) | Notes |
|---|---|---|
| `shuffle.s` `random`, the seed mixing in `litetitle.s` and `shuffleCards` | `prng.js` `CroomPRNG` | The four generator bytes as a 32-bit CRC register, the bit-by-bit step, `mixTitleSelection` (the title's mode and the frame counter) and `mixDealTime`. Level 1. |
| `shuffle.s` `findPattern`, `countCardsInPattern`, `shuffleCards`; the card sets in `drawcards.s` | `layouts.js`, `shuffle.js` `dealBoard` | The five layouts (one byte per column), the card sets of each level, the pairs laid out first and each position swapped from the last. Level 1 (the boards), and the layouts by bytes. |
| `memorygame.s` `play_memory`, `stateDispatch` and the eight state handlers | `state-machine.js` `FrameGame` | One `tick` is one iteration of the main loop. States STILL, FLIPPING, UNFLIPPING, COLLECTING, PASS_CONTROLLER, CLEARED, GAME_OVER, DONE. Level 1. |
| `memorygame.s` `cardsLoop`, the cursor, `read_pads` use | `frame-input.js` `applyHistoricalGameInputFrame` | Moves the cursor in the ROM's order and runs the state handler. It lives apart from the page so the oracle runs exactly the code the page runs. Level 1. |
| `pads.s` `read_pads`, `autorepeat` | `input.js` `HistoricalPads` | New presses, a repeat after 15 frames and then every third, the A+B scan of pad 2 before pad 1. Level 1 through the state machine's use of it. |
| `aidiocy.s` `doAI`, `aiStart`, `aiForget`, `aiFindKnownPair`, `noKnownPairs`, `aiFindMatchFor`, `randomCard` | `ai.js` `ArtificialIdiocy` | The state machine of the computer player, its memory of the cards it has seen, its forgetting at a noise level (16, 12 or 8) and its use of the shared generator. Level 1. |
| `litemain.s` `storyMode`, `storyStages` | `story.js` `STORY_STAGES`, `storyStageConfig`, `storyOutcome` | The ten-stage table (compared with the ROM's bytes), the loss rule (a tie in Vs. CPU is a loss; Solitaire is lost on zero misses left). Stages 0 to 3 are played against the ROM. |
| `litemain.s` `solitaireMode`, `twoPlayerMode`, `vsCPUMode`, the title dispatch; `litetitle.s` `titleDoMenu` | `title-flow.js` `TitleFlow`, `app.js` | The mode and difficulty menus: their pictures are Level 1 (compared with the ROM's), the flow Level 3; the generator mixing they feed is Level 1. |
| `litetitle.s` `scrollOpeningText`, the opening and instruction text | `story.js` text tables, `story-presentation.js` `OpeningScroller` | The English text is in the ROM (checked). The scroll (one pixel every six frames, held Down once per frame, Up pauses): the picture at each moment is Level 1; the keys that speed it up or pause it are read from the source. The opening text falls through into the instruction text, as in the original. |
| `liteopponents.s` `doOpponentScene`, `drawOpponent`, the dialogue | `story.js` `storyScene`, `story-presentation.js` `OpponentTypewriter`, `story-renderer.js` | One character per frame, double spaced. The loss text of the last opponent has no terminator and falls through into her win text; the port keeps that. The English text is in the ROM (checked) and the scenes are compared with it; the Italian is a translation. |
| `drawcards.s` (tiles, sprites, score boxes, the arrow, the collecting animation, the game-over wipe), `litetitle.s` `titleScreen` | `renderer.js`, `title-renderer.js`, `nes-visual.js` | Drawn on a canvas from the two original tile atlases and compared with the ROM's pictures, pixel by pixel (Level 1), for the game screen, the title menus and the story screens. |
| `sound.s`, `music.s`, `musicseq.s` | `audio-data.js`, `audio.js` | The sound effects, music patterns, conductors and instruments are compared with the ROM's bytes. The playback is Web Audio and approximates the console's sound chip. Level 3. |
| `bcd.s`, `unpkb.s`, `nes.h`, `ram.h`, `testcases.s`, the build files | none | Number display and graphics unpacking for the console; the page draws from the atlases directly. |
| none | `rules.js` | `MODE`, the miss budget and an earlier rules model (`RuleCore`) that the package kept for its tests. The page uses `FrameGame`, which the oracle checks, not `RuleCore`. |
| none | `app.js`, `preferences.js`, `viewport.js`, `index.html` | The browser shell: title and dialogs, saved language and difficulty, scaling, mouse and touch input, the Continue button. |

## What the port changes, and why

Differences that are on purpose:

- **Mouse and touch.** Tapping a card moves the cursor to it and flips it (`FrameGame.select`). In the original only the pad exists.
- **Keyboard.** Player 1 uses the arrows with Z (A) and X (B); player 2 uses WASD with N (A) and M (B); Enter and Space flip as well and, in the title and the scenes, advance. The pad model and the held-key handling are the original's.
- **Passing a shared device.** After a miss in a game for two, the player who takes the turn presses A and B, as in the original, or the **Continue** button.
- **Italian text.** A translation made for Libre Arcade, with the same rows and markers as the English. The English is the original's.
- **The title menu entries** are written in the page's language.
- **Select slowdown** is not offered (see above).
- **Sound** is synthesised from the original's data and approximates the console's chip.
- **The seed.** The page seeds the generator from the menu choice and its own frame counter (`floor(performance.now() / frame time) mod 256`), which plays the part of the console's NMI counter.

Not reproduced, because it is a hardware matter: the 2016 "Terriblegate" fix to the order of two picture-unit writes in `blitCardSprites` (see `PROVENANCE.md`).

## Tests

| File | What it checks |
|---|---|
| `test/rom-oracle.test.js` | The ROM is run again on the quick scenarios, from reset, and the port must agree at every iteration; the recording's totals, the addresses and the ROM's hash. |
| `test/mos6502.test.js` | The 6502 core of the oracle. |
| `test/rom-data.test.js` | The port's text, story table, sound and music data, layouts and palettes, looked for in the ROM byte for byte. |
| `test/reference.test.js` | The preserved original still hashes to its checksums and to the archive's list; the atlases are the archive's; nothing of the original is shipped in `public/`. |
| `test/state-machine.test.js`, `test/final-parity.test.js`, `test/ai-story.test.js` | The package's own checks of the frame state machine, the pad model, the CPU player and the story logic. They are the package's files with their import paths changed (and an unused import removed), and still pass: none of them had seen the differences listed above. |
| `test/behavioral-oracle.test.js` | The package's list of facts (layouts, card counts, miss budgets, the generator from the reset seed) and its five frozen boards. |
| `test/historical-audio.test.js` | The sound data and the model that plays it. |
| `test/story-presentation.test.js`, `test/title-menu.test.js` | The opening text, the scenes, the title flow. |
| `test/render-oracle.test.js` | The game screen at every iteration of the quick scenarios, against the ROM's picture (`node tools/render-oracle.mjs --all` does it for all 64). |
| `test/render-title.test.js` | The title's main and difficulty menus against the ROM's, with the arrow on every line. |
| `test/render-story.test.js` | The six pictures of the story (as the ROM draws them), the opponent scenes and the opening and instruction text, against the ROM's. |
| `test/visual-parity.test.js` | The card tiles and the geometry (adjacent cards agree on their shared borders; the arrow and the cursor); the rest of what the package pinned here is replaced by the three render tests. |
| `test/production-ready.test.js` | Markup, accessibility and preference contracts of the page, and the notices. |

# Port map: Zooming Secretary v1.02 (NES, C) to JavaScript

How the original's functions correspond to the port's modules, what was compared with the original and how, and what the comparison
found. The original is the ROM of v1.02 (`reference/SOURCE.md`; it is not in this repository); the port is `public/src/` (the rules) and
`public/web/` (the page).

## Verification level

Collection-wide levels (`AGENTS.md` at the root): 1 an executable oracle, 2 hand-computed values, 3 careful reading.

- **Level 1, for the game's rules.** The ROM is run on a small NES written for the purpose (`tools/nes-machine.mjs`, with a 6502 core) next to the
  port, with the same buttons, and about ninety values of the game's state are compared after every iteration of its main loop. That covers
  the player's movement and ladders, falling and wrapping, the filing cabinets and the topic the player carries, the telephones (their
  three heats, answering, missing, the delay between calls), the coffee, the speed, wisdom, all seven characters (Chief, Bouncer, Chatter,
  Geek, ManBox, Dibrov and the Dream's Ghost), the Dream's telephone that runs away, the decorative hearts as far as they decide what the
  generator returns, the random generator itself, and what ends a stage. It also covers the campaign: the stage after a win, after a loss and
  after the Dream, the allowance of missed calls, and the random generator's byte at the start of each stage and after the title screen.
  It covers the program's pause (START) and its front end as well: the title screen's random numbers, the hidden code, the way the sound
  test opens and what it selects, and the choice of the level, from reset to the first iteration of the stage that was chosen.
- **Level 3, for everything else.** The page (the cards that stand for the program's screens, the buttons, the credits, the languages, the
  touch controls, the layout), the pictures, the sounds, what the sound test plays, the saving of the preferences. The pictures and the sounds are new work and are not meant to be
  the original's. The page was driven in a real browser (see `PROVENANCE.md`).

## How the oracle works

`tools/rom-oracle.mjs` writes a scenario (a stage, the generator's byte, the allowance of missed calls, and a player), plays it on the
port and on the ROM, and compares the state after each iteration; if they differ it prints the first line of the state that differs.

- **The ROM's variables.** The source declares its state as `static` variables with no initialiser, and cc65 puts those, one after the
  other in the order they are declared, in the RAM from $0300. `tools/ram-map.mjs` is that table, anchored on the one array that can be
  found in the running program without the source: `map`, 704 bytes at $0347, which the program fills from the nametable. Every
  variable that the oracle compares was seen to behave as the source says.
- **Reaching a stage.** The title screen is left with START. `main` then writes `level = 0` and the allowance of missed calls; the oracle
  writes the level (and the allowance) it wants in the same place, which is a poke into RAM and nothing else. `game_loop` starts by writing
  `calls_level`; at that moment the generator's byte is set to the seed asked for (on a console it comes from how long the player stayed on
  the title screen). The stage's set-up, with all its random numbers, is the program's own code. A campaign that starts at the title
  screen pokes nothing; one that starts in a stage pokes that stage's level and seed, and nothing after.
- **One iteration.** One pass of the program's loop: it waits for the NMI of a frame, reads the controller, runs the logic, and goes round
  to the top of the loop. The oracle runs frames, with the buttons held, until the program has come to the top of the loop again, and reads
  the state it had there (the machine copies the RAM at each execution of the loop's first instruction, `findLoopTop`), which is the state after
  the pass and before the next one has done anything. A paused game goes round the loop without counting frames, so the pass is the unit and
  not the frame counter. The game was written for a 50 Hz television: on the 60 Hz console that the oracle models its library skips one frame
  in six, so about one iteration in five takes two frames; the oracle counts iterations, and the port ticks at 50 a second
  (`FixedStepClock({hz: 50})`), which is what a 50 Hz console gives and what the 60 Hz console gives on average. After the last iteration of
  a stage the loop is left and nothing else is read.
- **The players.** `idle` presses nothing. `wander` holds a random direction, or two, or three, or four (so that opposite directions are
  held together too) for a few iterations. `answer` answers the calls: it plans a path with the port's own movement code, a
  breadth-first search over the player's state on the stage's map, to the cabinet of the topic of the phone that will be missed first
  (round the other cabinets, which would change the topic it carries), and then to the phone; it fetches the coffee when no call waits;
  and it makes a random move now and then. Any of them can also press START now and then (`withPauses`): taps of one to three iterations,
  and holds that go on through the pause and its end, close enough to each other to meet the 25 iterations in which the pause cannot be ended
  and the 24 after it in which it cannot begin. A bot looks at the port's state, never at the ROM's; what it does only has to make the game
  do things, and the same buttons go to both.
- **The front end** (`tools/oracle-front.mjs`). The ROM is started from reset and run one pass of its loops at a time (each ends where the
  program calls `ppu_waitnmi`, found by its bytes), next to `Frontend` (`public/src/frontend.js`). The player presses the hidden code, right or
  wrong in several ways (a wrong button, two at once, a repeat, the code stopped half way, entered twice), START, the four buttons of the sound
  test (held before START, all at once, one missing, or all four only while the title screen waits), and in the screens that follow, the
  directions, A, B and START. After every pass the variables that the screen decides are compared (the title's random byte and the code's
  index, `test_mode`, the sound test's column and numbers, `level`). When the screens have ended and the ROM has begun a stage, its level, the
  allowance of missed calls and the generator's byte are compared with what the front end chose, and then iterations of the stage, played
  by a bot that sometimes presses START, with the pad as the program last read it. The ROM is not given the sound test's own sounds, only what
  it selects.
- **Campaigns.** The first stage starts from the byte the title screen made: the generator advanced by `rand16()` once for each iteration of
  the title loop (`tools/oracle-chain.mjs`, `titleSeed`); every other from the byte the stage before ended with. The stage and the allowance
  come from `Campaign` (`public/src/campaign.js`). Between two stages the ROM is run without a button, through its screens.
- **The recording.** `test/fixtures/rom-oracle.json` holds, for each scenario, each front end and each campaign, the buttons that were pressed and
  the low 16 bits of a CRC-32 of the ROM's state after every iteration (or every pass of the front end). `npm test` replays them against the port
  without the ROM, and breaks the port in 19 ways (nine of the rules of the game, four of the pause, six of the front end) to show that the
  replay sees each (`test/rom-oracle.test.mjs`). `npm run test:live` plays everything against the ROM again.

**What was run, against the ROM, and agreed in every iteration:** 56 scenarios (the 8 stages, each with the three kinds of player, in
three rounds with other seeds and other allowances; the Dream with seeds that the answering player wins as well as ones it loses) of
137,506 iterations in all, 22 of them won, 28 lost and 6 ended by the Ghost; 48 more of the same stages with the bots pressing START now and
then (the pause: 806 pauses begun in 231,622 iterations); 47 front ends, from reset to the first iteration of the stage that was chosen
(14,082 passes of the title screen, the sound test and the screen with the level, and 6,240 iterations of the stages that followed); and 5 campaigns
(two from the title screen with different times on it, through Days 1 to 4, the Dream, Day 5 twice, Days 6 and 7 to the ending; one from
the Dream won, one from the Dream lost, one from Day 7 to the ending) of 27 stages and 109,527 iterations. In all, 484,895 iterations of the game
(9,698 seconds) and 14,082 passes of the front end. On the port alone the same
scenarios answer 534 calls, miss 100, pick up the topics 410 times, the coffee 60 times, are slowed by the Chief 3,059 times, have their
topic changed by Chatter 30 times, knocked by ManBox 41 times, given wisdom by Dibrov 3 times, see the Dream's telephone run away 11 times
and are caught by the Ghost 6 times (`node tools/rom-oracle.mjs coverage --rounds 3`).

## The functions

| Original (`game.c`, `npc.h`, `neslib`) | Port | How it was checked |
|---|---|---|
| `main`, the stage loop | `Campaign` (`src/campaign.js`) and the page's flow (`web/app.js`) | the oracle's campaigns |
| `title_screen` (`rand16()` each pass, the code `testCode`, `test_mode`) | `Frontend` (`src/frontend.js`: `stepCode`) and the title in `web/app.js` | the oracle: every pass of the title screen against the ROM's (the generator's byte, the code's index, `test_mode`), in 47 front ends; the campaigns also compare the byte the title leaves |
| `game_loop`: the stage's set-up, `unrle_vram`, `vram_read`, the scan of the map for phones, player, characters, cabinets, coffee and tables | `StageDefinition` (`src/stage.js`), `initializeStageEntities` (`src/source-init.js`), the data in `public/data/` | the oracle: the state at the start of every stage, with every random number the set-up takes |
| `check_map`, the tile attributes | `StageMap` (`src/map.js`) | the oracle (every sample the movement takes) |
| `player_coord_wrap`, `player_align_to_ladder`, the movement of the loop | `tickPlayerMotion` (`src/player.js`) | the oracle |
| the speed target, the coffee | `updatePlayerSpeed`, `processCoffee` | the oracle |
| the cabinets (`topic_*`), wisdom | `processTopics` (`src/interactions.js`) | the oracle |
| `phone_reset`, the phone loop | `PhoneSystem` (`src/phone.js`) | the oracle |
| `hearts_add`, the hearts' update | `Hearts` (`src/hearts.js`) | the oracle (the slots, and the numbers they take from the generator) |
| `npc_add`, `npc_chief`, `npc_bouncer`, `npc_chatter`, `npc_geek`, `npc_manbox`, `npc_dibrov`, `npc_ghost`, `npc_change_floor_*` | `makeNpc`, `tickNpc` (`src/npc-full.js`, `src/npc.js`) | the oracle |
| the Dream's `move_phone` and the runaway | `Simulation.processDreamRunaway` | the oracle |
| the end of the loop (`calls_count`, `calls_missed`, `player_catch`) | `Simulation.tick` | the oracle |
| `rand8` | `Rng8` (`src/rng.js`) | the oracle (the byte after every iteration) |
| `show_message`, `update_stats`, the update list, `oam_*`, the sprites, the palettes | not ported: the page draws its own picture (`web/renderer.js`) and writes its own text | |
| the sound effects and the music (`sfx_play`, `music_play`, FamiTone) | not ported: `web/audio.js` makes its own sounds | |
| `show_level_number`, `show_game_over`, `show_congratulations` | the page's intro cards, "trial failed" and ending cards | reading (the original's stay on the screen a fixed time; the page's wait for a click) |
| the pause (`pause`, START in `game_loop`) | `Simulation.tick` (`pause`, `PadPoll`); in the page START, P, Esc and the Pause button all press START | the oracle: `pause` and everything else after every pass, in 48 scenarios with bots that press START |
| the sound test (`title_screen`, after the wait) | `stepSoundTest` and `Frontend`; the page's card and its own sounds (`web/sounds.js`) | the oracle: what opens it, the column and the numbers it selects; **not** the sounds, which are the page's |
| `show_level_number` with `test_mode` (the choice of the level) | `stepLevelSelect` and `Frontend`; the page's cards (`chooseLevel`) | the oracle: `level` after every pass, and the stage that begins |

## What the oracle found in the package's port

The package's port was written from a reading of the source and compared, by its authors, with a tracer of their own whose traces are not in
the package. Against this repository's oracle it agreed with the ROM in the first runs of all stages with no button pressed (16 runs of up to
1,500 iterations, a stage lost to missed calls included), which says a good deal for the set-up of the stages, the phones' lifecycle and the random
numbers. The first runs with a player found these, each fixed in `public/` (`docs/development/CHANGES.md`):

1. **Ladders.** In the source's loop a climbing step does not end the iteration: when the 16-pixel segment has just run out the player looks for
   the next one in the same iteration, which the package's `tickPlayerMotion` left for the next, so that it lost an iteration in every segment
   of every ladder. And the source sets `player_ladder` to 0 only when UP or DOWN is pressed and no ladder is there, so a player who stops on a
   ladder keeps the flag and cannot walk sideways until he goes on or falls; and `player_dir` keeps its last value when nothing is pressed,
   which the Geek reads (the package set it to none).
2. **A character at the left edge.** The source copies the character's position into an unsigned byte (`px=npc_x`) before testing contact. ManBox
   and Dibrov leave the screen on the left to x = -8 to -1 and come back from the right; for that test they are at 248 to 255, so they
   touch a player at the right edge and not one at the left. The package compared the signed value.
3. **Hearts.** The decorative hearts do nothing to the game but `hearts_add()` takes two numbers from the shared generator only when one of its eight
   slots is free (`heart_y` of 240 or more), a heart lives 24 to 31 updates, and only half of the slots are updated in each iteration. With
   wisdom from Dibrov (two hearts at once, then one every eight iterations) all eight are in use at times, and then no numbers are taken. The
   package took two every time. `Hearts` models the slots, not the positions.
4. **The Chief.** The source tests how near the Chief is with `(px-32)>=(player_px+16)`, and cc65 compiles that as a comparison of unsigned
   16-bit numbers (the code branches on the carry). Left of x = 32 the difference wraps to a large number, the test is true, and he does not
   slow the player however close he is. The package took it as signed. Found by looking at the player of Day 2 beside the Chief at x = 29,
   and by disassembling the ROM's `npc_chief` to see which operation was which.
5. **The seeds (the page).** The original never reseeds its random generator: each stage starts from the byte the stage before it ended
   with, and so does the stage played again after a game over. The page started every stage but the first from 1, so that a lost stage was
   played again with exactly the same calls and the campaign had no randomness after Day 1. The oracle's campaigns, which let the ROM go
   through its own screens, show the byte at every stage start.

Two faults of the oracle itself were found and fixed on the way. After the last iteration of a stage the ROM leaves the loop and does not
increment `ring_cnt` for the next one, which the oracle's way of stepping had not allowed for. And the program keeps one set of variables for whatever
character a stage has and does not clear what its character does not use (the Geek of Day 5 starts with the Ghost's `npc_wait` of 255 after the
Dream was lost), so each character is compared on the fields that the game reads for it.

## Known differences that are kept, on purpose

- **The Dream's phone topic.** The source takes `rand8() % topics_active` with `topics_active` of 0 in the Dream, which the cc65 division turns into
  a value that the game never uses (wisdom is forced there). The port keeps the random number and stores no topic (`null`), and the
  oracle compares that one field as unset.
- **Answering by wisdom before any cabinet.** With wisdom (Dibrov's) a call can be answered while `player_topic` is still 255; the source then
  indexes `topic_msg[255]` and `topicMessages[255]`, past their tables. The port takes the random number and does nothing else (the event
  `SAFE_DIVERGENCE_WISDOM_TOPIC_NONE`). The scenarios never answer a call in that state, so it is not compared.
- **Pictures, sounds, music, texts.** All new: drawn and made by the page. The original's fact messages are not in the page.
- **The decorative state.** Heart positions, the steps' sounds (`player_step_cnt`, `player_step_type`), the flashing topic icon, the message
  being written, the update list and the sprites are not modelled or compared.
- **The pause, the sound test and the choice of the level, as the page has them.** The rules are the program's and are compared; the screens
  are not. The program's pause is START; in the page START (Enter, Space), P, Esc and the Pause button all press it, so ending a pause takes
  half a second at least. Pauses that the page makes for itself (the window loses focus, the credits open) stop the clock instead, and are not
  the program's. The program's screen with the level number is a card, which waits for a click and does not count 150 passes or fade; the
  final screen (level 8) leads to Day 1 and not to the title. The sound test plays the page's own 16 sounds and has no music (the
  original has 21 effects and 7 tunes), The code, the sound test and the choice of the level are reached from the keyboard or from the touch pad's SELECT, B and A buttons (START is a tap on the title screen, the Pause button, or a card's button).
- **Time.** 50 iterations a second always; the original's frame skipping on 60 Hz consoles gives the same average.

## What the comparison does not cover

- The page: its layout, texts, controls and flow (read, and driven in a real browser with a bot that plays the whole campaign, and with keys
  for the hidden code, the choice of the level, the sound test and the pause).
- The program's other screens: the game over screen (which ends after 10 seconds or at START after one), the final screen, the messages. The
  oracle runs the ROM through them without a button.
- The picture, the sound, the music, and the timing of the console's hardware.
- Situations that the three kinds of player do not reach: the coverage report says what they do reach. Not reached: a call answered by wisdom
  with no topic (above), a Dream phone that has run away 25 times (its cooldown is capped at 250), the pause in the middle of a stage.
- Other browsers than Chromium-based ones.

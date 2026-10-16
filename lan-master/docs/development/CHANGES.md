# What was changed in the package's files, and why

The files of `public/` started as the files of the restoration package `lan-master-1.0.1-m16-source.zip` (its `index.html` and `src/`). They were put
next to the author's ROM and corrected where the comparison showed that they differ from it. Everything else in `public/` is the package's, unchanged.
`docs/development/package/` keeps the package's own documents, tests and data exactly as they came (its checksum list, `SHA256SUMS.txt`, names every file),
and `test/package.test.mjs` runs its tests against the files as they are now: five still pass, and the six that do not are listed there with the reason.

The comparison is described in [`../../specs/port-map.md`](../../specs/port-map.md). It runs the ROM and the page side by side with the same pad and compares
the picture, the variables and the calls to the sound player after every frame; each change below is one that it made necessary, and the scenario that shows it
agrees afterwards. The page is the one the package called production ready, and it was right about a great deal: the levels, the passcodes, the pictures, the
palettes, the music and the effects are the ROM's bytes, and its own rules for moving, turning, tracing and revealing a level agreed with the ROM's routines on every case
the oracle tried (`test/rom-routines.test.mjs`). What differed was in how the screens are put together, in the order in which the ROM does things within a frame, and
in four places where the page had something wrong.

## Where the files stand

| File | The package's SHA-256 | Now |
|---|---|---|
| `public/index.html` | `b9e0d7ff113a2b4ec3441f3db8e8ebc00ccf41c35aaeba0889d09d2bf0285ef0` | `c3a56c0c625c34746cd55b0f870adfdfb2f2703a545b530e091c6682c444864b` |
| `public/src/app.js` | `edb42e45d467018f10169d44736b49000677df65719377808fcfc3462efc8287` | `01e6da072c76d19a23c39995a99381974f8c8a4b16a71c40a15b970e0a1c5166` |
| `public/src/audio-data.js` | `f31812de74d3ba1dd6051868abb41814b48737d883a771452c4b2190fda3d31a` | unchanged |
| `public/src/core.js` | `692ff052b915e02d8fddafdf73cfdc3ac0e6db7b5dc9bc67645292540d14f9f4` | `ca0d46d80a3e855dff2c6956677f1c8ef51cf5a69f8a78f9bd17ea50b86e499f` |
| `public/src/famitone.js` | `cb5b35f88dac6bbfea3c8420229a370f322edf06e83a29a5c9717988f796146d` | `1a5d439afca442d7495878473996026447da3b2132e8061a408cef667d1303a7` |
| `public/src/levels.js` | `2f3bd6fb07bac57e0fcdb5d3cf065993338a37d90eb0463971097a9f060d2732` | unchanged |
| `public/src/nes-assets.js` | `ad5bde253b7189197569a5b5e3879926b5f4bf07313da76b1ed74d6b209628d7` | `1da1a68cecac26d387e1c00ced673a81e6575d404633815d74ce0b4e4f081b75` |
| `public/src/nes-audio.js` | `c13ad3826796909d6b87ad256044acf58310daf9133d7b794916a8c6cfec1c1c` | unchanged |
| `public/src/nes-gfx.js` | `ae2033830af5fd8e9ca2fefc947d8970eca5d6edbd3decb2526c98898ce81b3b` | `9173489bbdbe324dbe219e2235bcc2991e01114826ea24e19c482ff94cc7f72a` |
| `public/src/style.css` | `2e292f2a84fc17627612f63f3873cf9eb17b11b798a124c645bfb3feea2570cf` | `b3e04471cf45c887db5359ca705cb564978e5b9c29ccbdfbf28099def63d9e13` |
| `public/src/transitions.js` | `29de45bb2c7037ac9a31d58607704802c18054152823f0c0f64285c01b84cba5` | `6abefd8cb3af4139a364d9a2321595edb4c67f9e7e9e6e94275aa394e568875e` |

## What a player could see (and did not match the original)

- **The cursor made a black hole in the board** (`nes-gfx.js`). A sprite was written with `putImageData`, which replaces pixels, transparent ones too, so the
  cursor's four tiles were drawn as brackets on a black square. In Chrome the cursor is now the white brackets over the board, as in the ROM.
- **The percentage of the network rose at the start of every level** (`core.js`). A computer that reaches no cable was counted as connected, so on a two-computer level the
  DONE figure climbed to 50 with nothing joined. The ROM counts a computer only when a neighbouring tile finds it. The tiles the trace visits, from which the computers are drawn as
  lit, were also wrong for such a computer.
- **The figure could take the wrong value** (`app.js`). The ROM keeps the largest result of the traces of one round (a round is one trace from each computer) and compares it
  with the new one by the high byte and then by the low byte, and gives up if either is smaller; so a larger figure whose low byte is smaller is not taken. The page took the
  largest of the high bytes. It differed on level 26 (the share of a computer there is not a round number).
- **The panel of the time out was drawn wrong** (`nes-assets.js`). Its table had a tile too many in the row before the last, so the right edge of that row went missing and the bottom
  row, with its two corners, began one tile too far to the right.
- **The menu's cursor did not blink and the logo's animation was a frame late** (`app.js`). In the ROM the cursor of the menu and the cursor of the code entry blink with a
  counter that a press sets to 0 (16 frames on, 16 off), the logo's animation follows the music's noise channel or, when the music has none, the frame counter, and what
  is on the screen in a frame is what the previous frame left. The code you typed and the position in it are kept while the game is on (the page began from 0000 every time).
  Z and X also send the code in, and Shift goes down in the menu and leaves the code, as the pad's A, B and SELECT do.
- **The cursor moved a tile at once** (`app.js`). On the pad the ROM moves it two pixels a frame for eight frames, goes on while an arrow is held, and ignores START while
  it moves. The pad is polled once a frame by the game loop, and what a press does is decided there: a turn that is asked for while the cursor moves is for the tile it moves to, and
  a turn asked for later takes the place of an earlier one. A key that is held when a level begins counts only if it was not held at the ROM's last look at the pad.
  The page does this with the keys, the touch buttons and the pointer; a tap or a click on a tile still puts the cursor there at once, which the ROM does not have. This was asked
  of the integrator and chosen: the cursor does what the original's does.
- **The end of the ending was wrong** (`transitions.js`). The ROM stops counting when the last line is on the screen and leaves it there for good. The page went on and, 300 frames later, faded the
  last line away and typed what lay beyond the text.
- **The title and the ending were drawn at the size of the NES picture** (`style.css`), small in a large frame, while the game's board was already doubled. They have the same room now.
- **The title screen asked the browser for an icon** (`index.html`): there is an empty one.

## What a player would hardly notice, or not at all (and the oracle sees)

These are the order of events within a frame and the number of frames in each wait. They are a frame or three in a few seconds; the page matches the ROM's to the frame in each of them.

- **The menu** (`app.js`): the start flash is 21 frames, the first two with the colour of the chosen item, not the "off" colour; the title is black for three frames after its fade out and the
  game's board for two before it fades in; the game's music starts when the fade begins; the fade out of a game is a frame longer; the title waits two frames before it fades in again and the ending four;
  the ROM spends frames of its own on a sound or music toggle (one), on sending a code (one, and two for a wrong one, the sound of which comes in the second) and on leaving the code (one).
- **The start of a level** (`app.js`): the reveal begins two frames after the fade (three on levels 39, 43, 46, 47, 49 and 50, where the unpacking of the level, 28 to 36 thousand
  cycles, runs over one more frame), traces the network twice at its end, and the game's first frame follows. The background's pattern table is the one the menu left in the
  PPU until the game loop runs, and the cursor's colour is the palette's until it writes its own.
- **A frame of the game** (`app.js`): the clock and the trace counter first; then the numbers on the board, drawn as they were before this frame's step of the percentage; then a turn that was asked for; one computer of the board redrawn
  (the ROM redraws one a frame, and at once the tile that is turned); the random rotation; the step of the percentage (one a frame, to 100); the cursor's move and its colour; the pad. The trace is done by the main loop
  after the frame, and the next is 25 frames after. The cursor on the screen is the one the frame before left.
- **The end of a level** (`app.js`): two frames (the sound comes in the second), 50 of the animation (four computers a frame, the percentage up by two, the background's table taken from a different bit of the frame
  counter), the table row by row, the wait for A, B or START, the table taken away, the level hidden, and the next unpacked, as the ROM does.
- **The time out** (`app.js`): the clock goes on for a frame, then the cursor goes, the timer shows 000, the music stops, the sound is played and the network is traced once more (it can still be won there), 50 frames, one, the table in eight frames, and the music of the table.
- **The pause** (`app.js`): START is read in the game loop and ignored while the cursor moves; the sound at the next frame, the menu three frames after; its cursor blinks with its own counter, which a move sets to 0; after a choice the cursor flashes (16 frames);
  Continue traces the network twice again, Restart redraws the board in three passes of an unpacking frame and 24 rows, and Menu fades the game out with the menu still on it.
- **The ending** (`app.js`, `nes-gfx.js`): the ROM's frame counter is one behind the page's in that screen and the scrolling band and the text above it use different pattern tables in the same frame; the screen waits one frame before it starts.
- **The sound** (`famitone.js`): starting or stopping a song does not touch the registers that the player hands to the sound chip until the next update, as in the ROM, where the buffer keeps what the last update wrote.

## What is not changed, and differs

- On the largest levels (about 43 to 50), when most of the network is joined the ROM's trace takes more than a frame (up to 40 thousand cycles, a frame is 33 thousand), and the percentage and the detection of the end of the level come a frame or two later in the original than in the page.
- The unpacking of a level takes two or three frames in the ROM depending on where the music is, and the page uses the number that the ROM has when the level starts from the menu (a table of six levels). After a level has been cleared the same level can take one frame more or less (level 31 did, in a run of the whole campaign).
- The page's time is 50 ticks a second, which is the PAL console; the NTSC console runs the game's logic at 48. The music runs at the NTSC console's 60 updates a second.
- Where the page has more than the ROM (the Main Menu button of the ending, the language, the touch buttons, a click on a tile, the pointer on the menu) nothing was compared, because the ROM has nothing to compare it with.

## What was added around the page

`tools/` (the machine, the oracle, the bot), `test/`, `specs/`, `reference/`, and the documents of the folder. The package's own `docs/development/package/tests/witnesses/` (a solved board for each level, named in its checksum list) were not
among the files the first copy kept; they are there now, because the oracle's bot and `test/rom-routines.test.mjs` use them (the ROM's own trace says that each connects every computer).

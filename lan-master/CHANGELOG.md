# Changelog

## 1.0.0

First release in Libre Arcade, promoted from the restoration package `lan-master-1.0.1-m16-source.zip` after a comparison with the original ROM, run next to the page on a small NES of our own, and a check in a real browser.

- A cable puzzle for one player: the 50 levels, the 49 passcodes, the hidden `6502` ending and the `68xx` sound test, the pause menu, the clear and the time out tables, the random rotation of the network from level 11, and the four tunes and twelve effects of Lan Master v1.09 (NES, 2011) by Shiru
- Recorded where the original comes from (`reference/`): the author's ROM and his development notes, and the source files that the build uses, from the author's two zips as the Internet Archive kept them, with the SHA-256 of every file and of the files that are not kept. The original is Public Domain by the author's words, so the ROM and the source are in the repository
- Added the means to rebuild the ROM: `tools/assemble.mjs`, a small assembler for the NESASM syntax of the author's source, assembles it into exactly the bytes of his ROM (the gate that the package had left open)
- Added an executable oracle (`tools/`): the ROM run on a small NES written for the purpose (a 6502 core and an NROM board, copied from Lawn Mower's and extended), with the same buttons given to the page, and the picture, about forty of the ROM's variables and the calls to the sound player compared after every frame, on the PAL console. The ROM's variables are found by the source's own labels
- Added the ROM's routines called on their own and compared with the page's functions: the random generator (all 256 seeds), the unpacking of a level, the random rotation, the trace of the network (more than 2,000 traces) and the order in which a level is drawn; and the data compared byte for byte
- Fixed what the comparison showed to differ from the original, in the package's page:
  - the cursor drew a black hole in the board in a real browser (a sprite written over the pixels);
  - a computer that reaches no cable was counted as joined, so the share rose to 50 at the start of every level;
  - the percentage kept the largest of the high bytes where the ROM compares the 16-bit figure by its high byte and then its low byte;
  - the panel of the time out had a tile too many in a row;
  - the cursor moved a tile at once where the original glides for eight frames, goes on while an arrow is held and ignores START while it moves (a choice made for this integration);
  - the order of the things within a frame, and the number of frames in every wait: the menu, the start of a level, a frame of play, the clear, the time out, the pause, the ending;
  - the menu's cursors, which blink; the logo's phase; the typed code, which stays while the game is on; Z and X, which send the code in, and Shift, which goes down in the menu;
  - the end of the ending, which the ROM leaves on the last line for good;
  - the sound player's output when a song starts or stops, which the ROM's buffer keeps until the next update
- Changed the page where the way it is put together here called for it: an empty icon link, the collection's visit counter before `</body>`, the title and the ending drawn at the board's size, and the help that says an arrow can be held
- Added tests: the ROM and the source (`test/reference.test.mjs`), the data (`rom-data.test.mjs`), the routines (`rom-routines.test.mjs`), the page next to the ROM (`oracle.test.mjs`), the sound player (`audio.test.mjs`), the machine (`machine.test.mjs`), and the package's own 11 test runners, run unmodified against `public/` in a temporary copy of its layout, five of which pass and six of which are expected to fail, with the reasons (`package.test.mjs`)
- Checked in a real browser (Chromium-based): the keys held and tapped in real time, a touch button held in an emulated phone, the pause and its choices, the audio start, and the layout measured at six sizes in English and Italian
- Joined the Libre Arcade collection: the page at the root of `public/`, `npm test` runs `node --test`, and the collection scaffolding was added (`scripts/serve.mjs`, `scripts/build.mjs`, an ESLint config, `.gitignore`, `.gitattributes`, the GoatCounter snippet, the "Play here" link, the provenance, the port map, the notices, the story, five screenshots)
- Kept the package's own documents, unmodified, in `docs/development/package/`, with a note on what they are and a list of what was changed in its JavaScript (`docs/development/CHANGES.md`)

`npm test` passes 47 tests; `LAN_MASTER_FULL=1 npm test` also plays all 50 levels from their passcodes. All of the scenarios, the 50 levels and a bot playing 20,000 ticks from the first level (29 levels cleared, the thirtieth in play) agree with the ROM in the picture, the variables and the calls to the sound player, in every frame.

**Known limits.** On the largest levels (about 43 to 50) the ROM's trace takes more than a frame when most of the network is joined, and the percentage and the end of the level come a frame or two later in the original than in the page. The unpacking of a level takes two to four frames in the ROM depending on where the music is, and the page has a table for the six levels that take longer from the menu. The page ticks at the PAL console's 50 a second (the NTSC console runs the logic at 48) and plays the music at 60 updates. The language, the help, the credits, the touch buttons and the click on a tile are not compared with the original. See [`specs/port-map.md`](specs/port-map.md) and [`PROVENANCE.md`](PROVENANCE.md).

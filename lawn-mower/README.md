# Lawn Mower

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/lawn-mower/public/index.html)**

HTML5 port of **Lawn Mower**, the arcade game for the Nintendo Entertainment System that Shiru wrote in 2011 for the NintendoAge NES Coding Competition, a remake of a lawn mower game of the 1980s. You drive a mower round ten lawns. Cut all the grass before the fuel runs out; cans of fuel appear on grass you have cut; flowers and stones cost fuel. The port runs the original's rules, its random numbers, its frame timing, its pictures and its music, and the original game itself, run on a small NES of our own, was used to check them.

## Play

- **Goal.** Each lawn is cut when the counter at the top right reads 100%. The tank (the bar at the top) empties by one unit every other frame; a can refills it, a flower costs a sixth of a tank and a stone a third. When the fuel runs out the lawn is tried again from the start; when a lawn is cut, the next one begins. Ten lawns, then the final screen.
- **Keyboard.** The arrow keys turn the mower (it changes direction at the next tile), **Z** or **X** boost (the NES A and B buttons), **Enter** starts, pauses, resumes and confirms.
- **Touch.** The pad turns, **A** and **B** boost, **START** starts, pauses, resumes and confirms.
- **Options** at the top: sound on and off, EN and IT, and the information panel (how to play, controls, credits, restart).
- **A hidden feature of the original.** On the title screen, press RIGHT, UP, LEFT, LEFT (a sound confirms it). From then on **SELECT** (the Backspace and Shift keys here) fills the tank and skips the wait at the start of a lawn, cuts the lawn that is being mowed, and cuts short the wait after a lawn is cut. The original has no on-screen button for it, and neither does this page.

## What is preserved

The logic is a transcription of the original's 6502 assembly, not a redesign:

- **The pacing.** The game was written for a 50 Hz television and runs on a 60 Hz one by skipping the logic of every fifth frame, and one of its routines lets some of those frames through anyway.
- **The numbers.** The mower's position in 12:4 fixed point, its speed and the boost, the fuel, the tile variants and the cans picked by an 8-bit random generator that the title screen draws from while it waits, so that how long you wait decides the lawns.
- **The look.** The status bar that stays still while the lawn scrolls (a split of the screen at line 33), the message that flashes, the fade through the original's brightness table, the sprites with their priority and their eight to a line, and the title's five bands.
- **The sound.** The original's music and effects, played by a port of the FamiTone player whose output is compared with the ROM's, and then synthesised in the browser.
- **The quirks the ROM has.** The things that look like bugs and are the original's are kept (see `AGENTS.md`).

What was checked, and how far, is in [`specs/port-map.md`](specs/port-map.md); where the files come from, their licence and the evidence are in [`PROVENANCE.md`](PROVENANCE.md). The page, the information panel, the Italian text, the touch controls and the way START is held are new. The sound is synthesised in the browser from the sound player's output; it approximates the console's sound chip and does not emulate it. The colours are a table chosen for this port.

## Run

```sh
npm run dev      # serve public/ at http://localhost:8080
```

There is no framework and no build step to play: `public/` is plain HTML, CSS and JavaScript (ES modules). Any static web server works (`python3 -m http.server 8080` from `public/`, nginx, GitHub Pages). `npm run build` packages `public/` into a gitignored `game/` folder for standalone deployment; `npm start` builds and then serves `game/`.

## Test

```sh
npm test         # node --test: every test, with the ROM run again on short scenarios (two to four minutes)
npm run lint
npm run check    # lint + test
npm run test:live   # the long runs against the three programs, everything compared at every frame (about an hour and a half; start each with --flavour in its own terminal)
```

`npm test` includes a replay against the **competition ROM**, against the **author's own v1.12 ROM** and against the **v1.12 source** assembled here: each is run from reset on a minimal NES written for this purpose (`tools/`), scripted players take it through the title and play, and at every NMI the port's variables, the picture unit's memories, the sound player's output and the picture are compared with the ROM's. The last long run (12 October 2026, two seeds, five scenarios, each program) compared 455,295 frames against the competition ROM, 455,176 against the author's v1.12 ROM and 455,049 against the v1.12 source, the picture included, and found no difference, except that loading the fifth lawn keeps the screen black one frame longer in the author's v1.12 ROM than the page does (see [`PROVENANCE.md`](PROVENANCE.md)). Other tests compare the port's tables, the ten levels and the two screens with the ROM's bytes, and the music data with the source's export files. A test breaks the port thirteen ways to show that the comparison sees each. See [`specs/port-map.md`](specs/port-map.md) for what that proves and what it does not.

## License

The original game and its source are in the Public Domain, in the author's words (`game.asm`: "The game and its source code are released into Public Domain"; `famitone.asm`: "Feel free to do anything you want with this code, consider it Public Domain"). The code of this port is GPL-3.0-or-later, the collection's. The original files are in `reference/` and keep their notices: the competition ROM and the author's own v1.12 ROM, kept because they are what the oracle runs, and the assembler source. The author's manual and cartridge label are not kept, because their wording on the licence could not be read. See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) and [`PROVENANCE.md`](PROVENANCE.md).

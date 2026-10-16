# AGENTS.md

- **Two kinds of licence, and neither is to be changed.** The original (the ROM, the source, FamiTone and the data of `public/src/` taken from
  them: the levels, the passcodes, the pictures, the palettes, the music) is **Public Domain** by the author's own words (the first lines of
  `reference/source/game.asm` and `famitone.asm`); do not give it another licence. The code of the page (`public/index.html`, the JavaScript of
  `public/src`) is the restoration package's **GPL-3.0-or-later**, and so are `tools/`, `test/` and `scripts/`. `LICENSE` is the full GPL v3 text.
  The root `AGENTS.md` says never to assume "or later" for a copyleft *original*: here the original is not copyleft, and "or later" is only the licence of
  the new code.
- **`reference/` is the author's, untouched.** The ROM (`release/Lan_Master.nes`, v1.09 of 14.06.11, SHA-256 in `tools/ram-map.mjs`), his notes and the
  source files that the build uses. It is in the repository because it is Public Domain, and the oracle runs on it. `reference/SHA256SUMS.txt` names every file and
  `test/reference.test.mjs` checks them; `.gitattributes` keeps them byte for byte whatever `core.autocrlf` says (the same for `docs/development/package/`). Do not
  edit, reformat or re-save any of them. `reference/SOURCE.md` says where they came from (the author's two zips, from the Internet Archive's copy of his site) and
  lists the files of those zips that are not kept.
- **The ROM is the specification, and the oracle is how it is read.** `npm test` runs the ROM on `tools/nes-machine.mjs` next to the page's own scripts, with the same
  pad, and compares the picture, the variables and the calls to the sound player after every frame (`specs/port-map.md` says how). After any change to `public/` run
  `npm test`; if the behaviour could have changed, also run `LAN_MASTER_FULL=1 npm test` (all 50 levels from their passcodes, about six minutes more). `node tools/oracle.mjs`
  plays the scenarios and prints what each found; `node tools/oracle.mjs levels 40 50` plays levels 40 to 50 from their passcodes; `node tools/oracle.mjs campaign 20000`
  lets a bot play from the first level. Do not "improve" a rule, a number, a wait or a quirk: if the oracle says the page is wrong, the page is wrong. Run it
  **alone**: it is one Node process and takes a lot of memory and time for the longer runs; a second heavy job next to it is a reason for a test to time out.
- **The oracle runs the page unchanged.** `tools/port-run.mjs` runs the page's scripts in a `vm` (they are classic scripts, and the folder's `package.json` says
  `"type": "module"`, so `require` would take them for modules: `tools/package-modules.mjs` loads them the same way). The only addition is a read-only hook appended to a copy of
  `app.js` (`globalThis.__lm = {state, fixedTick, AUDIO, control, ...}`, the names are in `tools/port-run.mjs`). If you rename one of them, or move the state out of `state`, the
  oracle stops; change both together. Never add the hook to `public/`.
- **Time.** The page ticks 50 times a second (`fixedTick`, 20 ms), the PAL console's rate, and the comparison is made on the PAL console, where one frame of the ROM is one tick.
  Do not make it 60 or 48. The NTSC console skips the logic in one frame of five, and the page does not model that.
- **Things that look like bugs and are the original's** (the oracle shows each): the percentage is kept by comparing a 16-bit figure by its high byte and then by its low byte,
  giving up if either is smaller, so a larger figure with a smaller low byte is not taken (level 26); a computer counts as joined only if a neighbouring tile finds it,
  so an isolated one is never counted; the ROM redraws one computer a frame, round robin, and the tile that was turned at once; the percentage rises by one a frame to 100;
  the cursor on the screen is the one the frame before left (OAM DMA is a frame late); the trace is run by the main loop after the frame and again 25 frames after; the pad
  is read once a frame, and a press counts only if it came after the last read (a button held through a level's start does not); START is ignored while the cursor glides; a turn
  asked for while it glides is for the tile it is going to; the background's pattern table is the one the menu left until the game loop runs; the ending stops
  counting at its last line; the typed code and the cursor in it stay as they were while the game is on.
- **The page's own timings that are tables, not rules.** `LONG_UNPACK` in `app.js` lists the six levels (38, 42, 45, 46, 48, 49) whose unpacking takes one more frame when the level
  starts from the menu: the unpacking's length in the ROM depends on where the music is, which the page does not model. A level started after a clear can differ by a frame
  (level 31 did). The scenario for the last level plays level 39's layout in its place (`levelAlias`), because the ROM's trace on a nearly joined big network takes more than one frame and the page's does not;
  these are listed in `specs/port-map.md` as differences that are kept. Do not "fix" them without a way to see the ROM's cycles in the page.
- **The cursor.** It does what the original's does: it glides for eight frames, two pixels at a time, goes on while an arrow is held, ignores START while it moves, and a turn that is asked for
  during the glide is for the tile it moves to. This was asked of the integrator and chosen over a cursor that jumps. A click or a tap on a tile still puts the cursor there at once; the ROM has
  nothing to compare it with.
- **The code entry.** The digits are decimal (0 to 9), as in the ROM; `6502` opens the ending, `68xx` plays the effect numbered xx if it is one of the 12. Neither is mentioned by the page
  (the help and the credits do not say so; `README.md` does).
- **The package's own tests** (`docs/development/package/tests`, 11 runners) are run unmodified against `public/` by `test/package.test.mjs`, in a temporary copy of the
  package's layout. Five pass and six are expected to fail (the list, the line each stops at and the reasons are at the top of that file): two test the old timing of the time out and of the clear
  animation, one takes the empty icon for a missing file, and three freeze the SHA-256 of files that have changed. Never edit the package's tests or documents; change the list if a later, deliberate
  change needs it, and say why.
- **`SHA256SUMS.txt`** lists every file of the folder (not `node_modules/`, `game/` or `.claude/`). After any change, `node scripts/checksums.mjs` rewrites it, and `node scripts/checksums.mjs --check` says what differs from it without changing anything.
- **`docs/development/CHANGES.md`** has a table of the SHA-256 of each file of the package's page before and now. If you change `index.html` or a file of `src/`, update the table.
- **Player-visible text has no development vocabulary.** The help, the credits and the panels are in plain English and Italian. The panels of the game itself (the pause, the clear and the time out) are
  tables of tiles, localised by `localizedGameMenu`, `localizedLevelClear` and `localizedTimeOut` in `app.js`; the title and the ending are the original's pictures and stay in English.
- **The page's layout** was measured at phone, tablet and desktop sizes (`.nes-frame` is a container, and the canvas grows up to 512 by 480 to fit it, with `image-rendering: pixelated`); do the
  same after touching `public/index.html` or `public/src/style.css`: no scroll, every control inside the window, the touch buttons reachable. The five screenshots in `screenshots/` come from real headless Chrome
  on a temporary copy with the oracle's hook, so that a level could be started and a board set; the page in the repository was not touched.
- `docs/development/` holds the restoration package's own notes (milestone labels, old paths) and `CHANGES.md`. Leave the notes as history; the facts of this integration are in `PROVENANCE.md`,
  `specs/port-map.md` and `CHANGELOG.md`.

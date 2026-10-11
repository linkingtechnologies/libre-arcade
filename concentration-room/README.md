# Concentration Room

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/concentration-room/public/index.html)**

HTML5 port of **Concentration Room 0.02**, the card-matching game for the Nintendo Entertainment System written by Damian Yerrick (Pin Eight) in 2009 and 2010, with graphics by Yerrick and Sara Crickard. An accident at the biochemical lab has released a neurotoxin, and you have been quarantined after exposure: keep your sanity by playing a card game. The table holds 10, 20, 36, 52 or 72 face-down cards; flip two, and if they show the same emblem you keep them, and if not they turn back. The port runs the original's rules, its random deal, its frame timing and its CPU player, and the original game itself, run on a small NES of our own, was used to check them.

## Play

- **Modes.** *1 Player Story* alternates solo rounds with one-on-one matches against five contaminated technicians and children, with the original's opening text and dialogue. *1 Player Solitaire* asks you to clear the table before you run out of misses: 20 on the smallest table, up to 100 on the largest. *2 Players* take turns: a match keeps the turn, a miss passes it, and the first to take half the pairs wins. *Vs. CPU* is the same against the console, which remembers some cards and forgets others.
- **Difficulty** is the size of the table: Preschool (10 cards), Elementary (20), Junior High (36), High School (52), Lab Technician (72).
- **Keyboard.** Player 1: arrow keys to move, **Z** to flip (the NES A button), **X** for a random card (B). Player 2: **WASD**, **N** to flip, **M** for a random card. After a miss in a game for two, the player who takes the turn presses A and B together (or, on one shared device, the **Continue** button). Held directions repeat as they did on the console.
- **Mouse or touch.** Tap a card to flip it. On a title menu, tap an entry.
- **Help**, **Credits**, an **Audio** switch (off until you turn it on) and an **EN/IT** language switch are at the top. Language and the last difficulty are remembered on the device; Help has a button that forgets them.

## What is preserved

The logic is a transcription of the original's 6502 assembly, not a redesign:

- **The deal.** A CRC-style 32-bit generator, seeded from the title menu choice and the frame counter, and a deal that is not a Fisher-Yates shuffle; the five layouts of the table and the card sets of each level.
- **The frames.** One pass of the original's main loop is one frame: five frames to turn a card, a 90-frame look at a miss, the collecting animation, the 180-frame hold on a cleared table, controller auto-repeat after 15 frames and every third frame after.
- **The CPU player.** The original calls it "artificial idiocy": it keeps a memory of the cards it has seen, forgets some of them each turn according to a noise level (16 against the first opponent, 12 against the second, 8 after that), looks for a known pair, and waits half a second before its second card.
- **The story.** The ten-stage table, the scenes after each win and loss, and the English text of the opening, the instructions and the opponents.
- **The quirks the ROM has.** The release was built with the blocks of some routines run in reverse order, so the ROM does a few things the text of the source does not suggest (for example, the order in which the four directions are handled). The port follows the ROM.

What was checked, and how far, is in [`specs/port-map.md`](specs/port-map.md); where the files come from, their licence and the evidence are in [`PROVENANCE.md`](PROVENANCE.md). The look of the page, the dialogs, the Italian text, the mouse and touch input and the saved preferences are new. The sound is synthesised in the browser from the original's notes and timings; it approximates the console's sound chip and does not emulate it.

## Run

```sh
npm run dev      # serve public/ at http://localhost:8080
```

There is no framework and no build step to play: `public/` is plain HTML, CSS and JavaScript (ES modules). Any static web server works (`python3 -m http.server 8080` from `public/`, nginx, GitHub Pages). `npm run build` packages `public/` into a gitignored `game/` folder for standalone deployment; `npm start` builds and then serves `game/`.

## Test

```sh
npm test         # node --test: all tests; the ROM is run again on the quick scenarios
npm run lint
npm run check    # lint + test
npm run test:live   # runs every recorded scenario against the original ROM again (several minutes)
```

`npm test` includes a replay against the **original release ROM**: it is run from reset on a minimal NES written for this purpose (`tools/`), a scripted player takes it through the title menu and plays, and at every iteration of the original's main loop the port's state is compared with the ROM's memory. The recording covers 64 scenarios, 128 games and 310,756 iterations, in all four modes (Story as far as its first four stages) and at every level, with no difference; `npm run test:live` plays all of them again. Other tests compare the port's text, story table, sound data, layouts and palettes with the ROM's bytes, and what the page draws (the game screen, the title menus, the story scenes and the opening text) with the picture that the ROM draws, pixel by pixel; `npm run test:render` does that for all 64 scenarios, 119,426 frames. See [`specs/port-map.md`](specs/port-map.md) for what that proves and what it does not.

## License

GPL-3.0-or-later, as the original: the headers of the source files say "version 3 of the License, or (at your option) any later version", and the author's page says "version 3 or later". The preserved original sources and the release ROM are in `reference/ConcentrationRoom-0.02/` and keep their notices. The author's licence has a special exception for exact copies of the program in iNES or UNIF form, which is why the unmodified ROM can be kept next to the sources. One point is open and is recorded in [`PROVENANCE.md`](PROVENANCE.md): the bitmap letters of the menus follow the lettering of two designs (a logo font and Susan Kare's Chicago, per the author's notes) for which the archive gives no separate licence.

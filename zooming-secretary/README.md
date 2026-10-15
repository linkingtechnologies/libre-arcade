# Zooming Secretary

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/zooming-secretary/public/index.html)**

HTML5 port of **Zooming Secretary**, the game for the Nintendo Entertainment System that Shiru and Alexei "PinWizz" Bespalko made in 2011. You are a secretary in a busy office. When a telephone rings it shows the symbol of a topic; you touch the filing cabinet with the same symbol to memorise it, and then you reach the telephone. Ladders join the floors, coffee makes you quick, and on every stage a character gets in your way. Seven days, and a Dream between the fourth and the fifth. The port runs the original's rules and its random numbers, and the original game itself, run on a small NES of our own, was used to check them. The pictures and the sounds are new.

## Play

- **Goal.** Answer the number of calls that the day asks for (10 on Day 1, then 15, 20, 25, 30, 35 and 40) before too many are missed (three; five on Days 5 to 7 if you cleared the Dream). A day that is won opens the next; one that is lost is played again.
- **How to answer.** A telephone rings and shows a topic: Earth, History, Books or Space. Walk to the filing cabinet with the same symbol and touch it, then walk to the telephone and touch that. There is no Answer button.
- **Keyboard.** The arrow keys or **W A S D** move; on a ladder, **Up** and **Down** climb. **Enter** or **Space** starts and continues, and in play it pauses. **P** or **Esc** pause too, **M** turns the sound on and off.
- **Pause.** START, which is Enter or Space here, the Pause button, **P** and **Esc** all do what the original's START does: the game stops and waits. The original does not let START end a pause for about half a second after it began, and does not take START for about half a second after it ended.
- **Touch.** Four arrows below the picture, and SELECT, B and A to the right of them (they are for what is hidden in the original, below). The buttons at the top are pause, sound, language (EN and IT) and credits.
- **Coffee** stands on every stage from Day 2 and gives a short burst of speed.
- **The characters.** The Chief slows you down when he is close (Day 2). The Bouncer is in the way (Day 3). Chatter changes the topic you carry (Day 4). In the Dream the telephone jumps between tables and a Ghost hunts you; no topic is needed there. The Geek blocks the side he faces (Day 5), ManBox knocks you back (Day 6), and Dibrov, who avoids you, gives you the wisdom to answer with any topic (Day 7).
- **The Dream.** Reach the telephone and the allowance of missed calls on Day 5 rises from three to five; if the Ghost catches you, the days go on all the same.

## Hidden in the original

The cartridge has two things that it never mentions, and this port has them too (the page does not mention them either). They work from the keyboard (**Z** is the pad's A, **X** is B, **Shift** or **Backspace** is SELECT, **Enter** or **Space** is START) and from the touch pad (the SELECT, B and A buttons; START is a tap on the title screen, the Pause button, or the button of a card).

- **A code on the title screen.** Press B, A, B, A, left, up, B, A, one at a time (**X Z X Z**, left, up, **X Z**); a sound confirms it. From then on, before every stage, **left** and **right** change the level (from Day 1 to Day 7, and the final screen), and **Enter**, **Z** or **X** go on. It stays until the page is loaded again. A press that is not the next button of the code, or two at once, starts the code again.
- **A sound test.** Hold A, B and SELECT (**Z**, **X** and **Shift**, or the three buttons on the touch pad) and press START (**Enter**, or tap the title screen) on the title screen. After the wait the sound test opens: **up** and **down** choose a sound, **X** plays it, **Enter** leaves. The original's test lists its own 21 effects and 7 tunes; this page lists its own 16 sounds and has no music.

## What is preserved

The rules are a port of the C source's behaviour, and the ROM decides what is right:

- **The numbers.** Positions, speeds, the three heats of a telephone and the delay between calls, the coffee, the time of each character's moves, the counts and the times of the eight stages.
- **The random generator.** The original's 8-bit generator, and which routine takes how many numbers from it and when (the decorative hearts take two only when one of eight slots is free). It is never reseeded: each stage starts from the byte the one before it ended with, and the first from how long the title screen was left on.
- **The pause and the front end.** The pause's counts (50 down to 25, waiting for START, then 24), which reading of the pad each pass of the loop sees, the title screen's random numbers, the code, the sound test's way of opening and the choice of the level.
- **The layouts.** Which cells are floor or ladder, and where the telephones, cabinets, coffee, tables and characters are, on each of the eight stages.
- **The quirks the ROM has.** Things that look like bugs and are the original's are kept (see [`AGENTS.md`](AGENTS.md)): the ladder you cannot step off sideways, the Chief who stops slowing you left of the 32nd column, ManBox touching the right edge when he leaves by the left.

What was checked, and how far, is in [`specs/port-map.md`](specs/port-map.md); where everything comes from, the licences and the open points are in [`PROVENANCE.md`](PROVENANCE.md). The page, the pictures, the sounds, the Italian text and the touch controls are new, and are not compared with the original. The sounds are made in the browser at run time; no recording and no data of the original is used.

## Run

```sh
npm run dev      # serve public/ at http://localhost:8080
```

There is no framework and no build step to play: `public/` is plain HTML, CSS and JavaScript (ES modules). Any static web server works. `npm run build` packages `public/` into a gitignored `game/` folder for standalone deployment; `npm start` builds and then serves `game/`.

## Test

```sh
npm test         # node --test: the recording of the ROM replayed against the port, the package's own 349 cases, the page and the licence checks
npm run lint
npm run check    # lint + test
npm run test:live   # the ROM itself, played again next to the port (one to two hours, one process, little memory)
```

`npm test` does not need the ROM: it replays `test/fixtures/rom-oracle.json`, which holds the buttons of 104 scenarios, 47 front ends and 5 campaigns and the ROM's state after every iteration of its loop as checksums, and the port has to reproduce every one. `npm run test:live` needs the ROM, which is not in this repository: put it where `ZS_ROM` says (its SHA-256 is checked; [`reference/SOURCE.md`](reference/SOURCE.md) has the hash and the place it was downloaded from). The last long run compared 484,895 iterations of the game (9,698 seconds) and 14,082 passes of the title screen and the other screens, and found no difference after the four corrections of the rules described in [`specs/port-map.md`](specs/port-map.md). A test breaks the port 19 ways to show that the comparison sees each.

## License

The original game is released under a Creative Commons Attribution licence by Shiru and PinWizz ("CC BY 2011" on the manual's cover and on the cartridge label; no version is written anywhere in them). The code of this port is GPL-3.0-or-later, the collection's. The eight layouts in `public/data/` follow the original's and are shared under its grant, not relicensed. The original's ROM, source, pictures, music, manual and label are not in this repository. See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) and [`PROVENANCE.md`](PROVENANCE.md).

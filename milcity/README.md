# MilCity

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/milcity/public/index.html)**

Browser port of **MilCity - Blue Edition 1.0.5**, the real-time strategy game for J2ME phones that Jérémy Walther published on SourceForge in 2011. You build a city on a 30 by 30 map of land and water, earn money and produce energy, make weapons, and shoot at your opponent's city as in Battleship, until someone reaches the score limit or the other one cannot go on. The computer plays at four levels. The port runs the original's rules, its economy and its timing, its random map and its computer player, and the original game itself, run next to it in virtual time, was used to check them.

## Play

- **Goal.** Reach the score limit (1,000 by default: 10 points for each cell of a building you hit and 10 for each cell you destroy), or be the last one standing. You lose if your city has no energy for more than two minutes, or if you cannot afford the power plants you need to get energy back.
- **City.** Build a **Power Plant** first (it makes the energy that everything else uses), then **Commercial** buildings (they make money), then **Missile Silos**, **Factories**, **Air Fields**, **Nuke Silos** and **Laboratories** for weapons, **Houses** to make everything faster, and a **Shield Generator** for shields. Choose a building in the panel and click a cell of empty land. Green outline = it can be built there; red = it cannot.
- **Military.** Choose a weapon and click the opponent's map. Blue = known water, black = unknown, grey = a miss (it fades), red = a building hit, green = destroyed, yellow = shown by a spy. A bigger weapon covers more cells and takes longer to reload.
- **Computer levels.** Easy, Medium, Hard, Madness (it builds missile silos, factories, air fields or nuke silos once it has enough shops), and a Training game with no opponent.
- **Options.** Water on the map (5% to 95%), the score limit, the money you start with, and vibration (on a phone that can).
- **Keyboard.** Arrow keys move the cursor, **Q** and **E** change the building or weapon, **Z** and **X** switch between City and Military, **Enter** or **Space** builds or fires, **Esc** leaves the game. Mouse and touch: click or tap a cell.
- **A hidden key combination,** as in the original and not mentioned in the game: hold **Q**, **Z** and **X** together (on the handset, A, C and D) and every building costs nothing, for the computer as well as for you, until the page is closed or reloaded.
- **The game keeps itself.** An unfinished game is saved in the browser and can be resumed from the main menu after a reload. The game stops while a dialog is open, while the page is hidden and when you leave it.

## What is preserved

The logic follows the original's classes (`reference/milcity-blue-1.0.5/`), not a redesign:

- **Time.** Each player settles the accounts once a second from the moment the game starts; a building's construction, a weapon's reload, a shield and the two minutes without energy are differences of the clock at the moment you act, and the page's clock is in milliseconds.
- **The computer.** One algorithm for the four levels, its build order, its choice of target and cell, how it throws away a try after ten, and the numbers it uses up, in the order it uses them. It never uses spies or shields, never builds houses, and, as in the original, never scores: the score goes to the person only.
- **The map.** Ten random walkers draw the land until the water falls to the chosen percentage, a round at a time; the computer gets a copy of your coast.
- **Shields, explosions, radar.** A shielded cell is stored negated until the first pass after its minute; hit cells burn for five tenths of a second before they are craters; missed cells on the radar fade once a second while you look at it.
- **The quirks the original has**, such as a building finished under fire keeping its flame, a hit on an already destroyed cell scoring again, and the training game ending when you lose. They are kept (see `AGENTS.md`).

What was checked, and how far, is in [`specs/port-map.md`](specs/port-map.md); where the files come from, their licence and the evidence are in [`PROVENANCE.md`](PROVENANCE.md). The page, its menus, the Italian text, the saving, and the pictures (drawn by the page; the original's own are not used) are new.

## Run

```sh
npm run dev      # serve public/ at http://localhost:8080
```

There is no framework and no build step to play: `public/` is plain HTML, CSS and JavaScript (ES modules). Any static web server works. `npm run build` packages `public/` into a gitignored `game/` folder for standalone deployment; `npm start` builds and then serves `game/`.

## Test

```sh
npm test         # node --test: 43 tests, with the original's behaviour replayed from its recording (about half a minute)
npm run lint
npm run check    # lint + test
npm run test:live   # play the scenarios on the original and on the port and compare (needs Java 8 or later; about a minute)
```

`npm test` replays `test/fixtures/java-oracle.json`: the checksum of the state of the original's game after every tenth of a second of 13 scenarios of one to fifteen minutes, which the port must reproduce from the same actions. It also checks the numbers of the game against the original's source, and breaks the port nine ways to show that the comparison sees each. `npm run test:live` runs the original again (its core compiled without change, in virtual time) and compares. A wider run (`node tools/java-oracle.mjs check --seeds 5`) played 65 scenarios, 37,800 seconds of game, and agreed throughout. See [`specs/port-map.md`](specs/port-map.md) for what that proves and what it does not.

## License

**GPL-3.0-only**, like the original: its README and its source files grant version 3 of the GNU General Public License and nothing about a later one. The original's pictures are not used and are not here (their licence is not established). See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) and [`PROVENANCE.md`](PROVENANCE.md).

# Grugnetto's Four

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/grugnettos-four/public/index.html)**

Grugnetto's Four is Libre Arcade's playable collection of historical Four-in-a-Row intelligences. Choose a difficulty and meet a different, hidden challenger each game. An optional Advanced area contains the research tools.

## Play

```sh
npm run dev      # serve public/ at http://localhost:8080
```

There is no build step and no runtime dependency: `public/` runs as native ES modules. Any static web server works as well (`python3 -m http.server 8080` from `public/`, nginx, GitHub Pages). Do **not** open `index.html` over `file://`, because browser module security blocks the local imports. The first load fetches about 12 MB of JavaScript (the trained-weight modules dominate), so a compressing web server helps.

`npm run build` packages `public/` into a gitignored `game/` folder for standalone deployment; `npm start` builds and then serves `game/`.

The interface is responsive and available in English and Italian. Its setup hierarchy and masked-opponent experience follow the conventions established by Grugnetto's Briscola.

Grugnetto's Four has its own name, visual identity and original interface. It is an independent Libre Arcade project and is not affiliated with or endorsed by Hasbro. CONNECT 4 is a trademark of Hasbro.

## Modes

- **Play** — six icon-and-star difficulty levels. All 23 calibrated participants are grouped by Arena strength; a new hidden opponent is selected for each game. Winning lines are highlighted and the result overlay offers a rematch or return to setup.
- **Advanced** — optional access to the Laboratory and Arena research tools.
- **How to play / Credits** — rules, project context and attribution.

Opponent selection in Play mode is derived from the game seed and avoids an immediate repeat when a cluster contains another candidate. The historical algorithms are not altered to manufacture difficulty.

## Test

```sh
npm test            # the whole suite; replays recorded native/Python oracle output
npm run lint
npm run check       # lint + test
npm run test:live   # runs every native/Python oracle for real (needs cc, g++, python3 + NumPy)
node tools/calibrate-strength.mjs   # replays the Arena calibration behind the six levels (about 11 minutes)
```

Node.js is used only as a test runner. The suite covers the common player contract, legal moves, deterministic replay, original-versus-port parity, the Arena, strength calibration and public UI gates. The parity tests that compile C or C++, or run Python, replay the output recorded in `test/fixtures/`, so `npm test` needs no compiler; a test whose recording is missing is reported as SKIPPED, never as passed. The Arena test alone takes a couple of minutes. See [`specs/port-map.md`](specs/port-map.md) for what each test proves and what was not re-run.

## Preservation and ConnectLab

ConnectLab is the internal preservation, adapter and benchmarking architecture behind the game. Its name remains in technical documentation and source identifiers, not in the public branding. Historical sources and checksums are stored under `reference/`. Porting evidence is retained under `docs/development/`; it is not part of the player-facing interface.

See `THIRD_PARTY_NOTICES.md` for authors, sources and licenses. ConnectLab redistributes no unverified original media.

## License

Grugnetto's Four is distributed under **GPL-3.0-only**, with one module under **AGPL-3.0-or-later**. The combination cannot be offered as "GPLv3 or later" because it includes code that grants only version 3 (the Stratzilla port: its repository carries the GPLv3 text and no "or later" clause). The Pascal Pons-derived module (`public/src/players/pascal-pons-bitboard.js`) remains AGPL-3.0-or-later: GPLv3 section 13 allows the two to be combined, and its source is offered to everyone who plays the game through the Credits link. Individual preserved sources keep their original licenses and notices under `reference/`. The evidence behind each licence is in [`PROVENANCE.md`](PROVENANCE.md).

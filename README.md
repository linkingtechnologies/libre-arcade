# Libre Arcade

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/)**

A collection of software-archaeology restorations: old, abandoned open-source
games and algorithms recovered, ported to the browser, and benchmarked or
certified against their original behavior. Each entry below is an independent,
self-contained project in its own folder — its own tests, licensing,
provenance records, and a static site servable by any web server. The
philosophy shared by every restoration in this collection — preserve
reasoning, verify by execution, record provenance honestly — is in
[`SOFTWARE_ARCHAEOLOGY.md`](SOFTWARE_ARCHAEOLOGY.md); each game's own recovery
story lives in its own folder. Contributors and coding agents should read
[`AGENTS.md`](AGENTS.md) before adding a game or changing how one is built —
it's the actual rulebook behind "Shared conventions" below.

## Games

Two ways a game ends up here: **ported** — re-implemented in a shared engine
and verified against the original with an executable oracle or a benchmark —
or **restored** — the original code itself, vendored and kept running with
telemetry/ads stripped, vulnerable dependencies upgraded, and CSS scoped for
safe embedding, but otherwise left exactly as its authors built it.

| Folder | Game | What it restores |
|---|---|---|
| [`klondike/`](klondike/) | Grugnetto's Klondike | *Ported.* Engine and sprite from `rjanjic/js-solitaire` (2021, MIT); solver architecture from `ShootMe/MinimalKlondike` (2023, MIT). Every deal is generated and solver-certified at runtime. |
| [`briscola/`](briscola/) | Grugnetto's Briscola (BriscoLab) | *Ported.* Nine historical and modern Briscola-playing AIs (C++/Qt, Ruby, Python, Java, C#, Godot+ONNX, JS) ported to a shared engine and benchmarked against each other in an Arena. |
| [`netris/`](netris/) | Netris | *Ported.* Single-player core of Netris 0.52 (Mark H. Weaver, 1994-1999, GPL-2.0-or-later) — board, pieces, RNG and rules preserved exactly, including no score and no automatic speed-up. Also ports its bundled but never-shipped `sr.c` heuristic as a selectable autopilot. |
| [`hextris/`](hextris/) | Hextris | *Restored.* [Hextris](https://github.com/Hextris/hextris) (Logan Engstrom & Garrett Finucane, GPL-3.0-only), vendored as-is. |
| [`html5-breakout/`](html5-breakout/) | HTML5 Breakout | *Restored.* [html5-breakout](https://github.com/toivjon/html5-breakout) (J. Toiviainen, MIT, archived), vendored with one small additive fix (a GAME OVER screen upstream never had). |
| [`html5-snake/`](html5-snake/) | HTML5 Snake | *Restored.* [html5-snake](https://github.com/JDStraughan/html5-snake) (Jason D. Straughan, MIT), vendored as-is — the unforgiving variant, wall contact ends the run. |
| [`html5-space-invaders/`](html5-space-invaders/) | HTML5 Space Invaders | *Restored.* [html5-space-invaders](https://github.com/toivjon/html5-space-invaders) (J. Toiviainen, MIT, archived), vendored as-is. |
| [`react-simple-snake/`](react-simple-snake/) | react-simple-snake | *Restored.* [react-simple-snake](https://github.com/MaelDrapier/react-simple-snake) (Maël Drapier, MIT), vendored as-is — the relaxed variant, wraps around every edge. |
| [`netrok/`](netrok/) | Netrok 0.95 | *Ported.* [Netrok](http://www.itpsoft.de) (Ioan-Tudor Parvulescu, 2004, GPL-2.0-or-later) — all 20 original levels, level editor, and its bundled SFont library. Source recovered from an OpenPandora `.pnd` package; see `netrok/reference/`. |
| [`njam/`](njam/) | Njam 1.21 | *Ported.* [Njam](http://njam.sourceforge.net) (Milan Babuskov, 2003, GPL-2.0-or-later), primary reference the AmigaOS4 1.21 port (Kjell Breding/Sharakmir, 2005) — full local/offline parity including editor, duel mode, and all bundled level sets. Network host/join deliberately not enabled. |
| [`naval-battle/`](naval-battle/) | 🐽's Naval Battle (BattleLab) | *Ported.* Historical Battleship AIs — Warboats 0.51 (2009, GPL-2.0-or-later) and a binary/debug reconstruction of Bataille Navale OS4 (2009, GPLv3) — behind a simplified five-difficulty player UI. Gnome Batalla Naval was evaluated and rejected as GPLv3-incompatible (GPL-2.0-only evidence); see `specs/candidates.md`. |
| [`for-science/`](for-science/) | For Science! | *Ported.* [For Science!](https://www.usebox.net/jjm/for-science/) (Juan J. Martínez, PyWeek 16, 2013, GPL-3.0-or-later) — a turn-based match-3 duel, ported from Python/Cocos2d/Pyglet with a Python 2.7 deterministic oracle and a 1000-seed AI stress run verifying the original AI's move/attack heuristics. |
| [`54321/`](54321/) | 54321 | *Ported.* [54321](http://www.nklein.com/products/54321) (Patrick Stein / nklein software, 2001 1 MB SDL Game Programming Contest) — five n-dimensional puzzle games (Flip-Flop, Bomb Squad, Maze Runner, Peg Jumper, Tile Slider) sharing one 2D/3D/4D topology engine, in HTML5 Canvas 2D. Original material carries nklein's own historical `LicenseRef-NKlein-Universal-NonExclusive` grant, not GPL; see `54321/PROVENANCE.md`. |
| [`grugnetto-go/`](grugnetto-go/) | Grugnetto Go! | *Built here.* An original platformer for this collection (melonJS + lit-html), not a restoration. |

Each project's own `README.md` covers how to run it, test it, and where its
sources came from; `CREDITS.md` inside each restored game's own folder has
the full authorship and third-party library/font breakdown.

## Every original project restored or ported here

| Project | Author | License | Used in |
|---|---|---|---|
| [rjanjic/js-solitaire](https://github.com/rjanjic/js-solitaire) | Radovan Janjic | MIT | `klondike/` — engine, card sprite |
| [ShootMe/MinimalKlondike](https://github.com/ShootMe/MinimalKlondike) | DevilSquirrel | MIT | `klondike/` — solver architecture |
| [letele/playing-cards](https://github.com/letele/playing-cards) | letele contributors | CC0-1.0 | `klondike/` — Classic HD deck |
| [SONDLecT/woodcut-cards](https://github.com/SONDLecT/woodcut-cards) | SONDLecT contributors | CC0-1.0 | `klondike/` — historical woodcut deck |
| QBriscola (SourceForge) | Betti Sorbelli Francesco, Ciotti Roberto | GPL-2.0-or-later | `briscola/` |
| [aaaasmile/CuperativaSoloRuby](https://github.com/aaaasmile/CuperativaSoloRuby) | Invido.it | MIT | `briscola/` |
| smBrisCola (SourceForge) | Massimo Masson, Licia Salce | GPL-2.0-or-later | `briscola/` |
| [GiulianoSpaghetti/JBriscola](https://github.com/GiulianoSpaghetti/JBriscola) | — | GPL-3.0 | `briscola/` |
| Pryscola (nongnu.org) | Emanuele Rocca, Davide Pellerano, Alessandro Arcidiacono | GPL-3.0-or-later | `briscola/` |
| [LetteraUnica/BriscolaBot](https://github.com/LetteraUnica/BriscolaBot) | Lorenzo Cavuoti | MIT | `briscola/` |
| [pgiacome/BriscolaPaperSourceCode](https://github.com/pgiacome/BriscolaPaperSourceCode) | Piero Giacomelli | MIT | `briscola/` |
| [GiulianoSpaghetti/CardFramework.maui](https://github.com/GiulianoSpaghetti/CardFramework.maui) | Giulio Sorrentino | GPL-3.0 | `briscola/` |
| [ivanrava/poiana](https://github.com/ivanrava/poiana) + [briscola-rl](https://github.com/ivanrava/briscola-rl) | Ivan Ravasi, Davide Zambelli | GPL-3.0 code / CC BY 4.0 assets | `briscola/` |
| Briscola.js (historical browser demo) | Calogero Miraglia | unverified, not redistributed | `briscola/` — behaviorally reconstructed only |
| [Netris](https://web.archive.org/web/20110831162119/http://netris.org/) 0.52 | Mark H. Weaver | GPL-2.0-or-later | `netris/` |
| [Hextris](https://github.com/Hextris/hextris) | Logan Engstrom, Garrett Finucane | GPL-3.0-only | `hextris/` |
| [html5-breakout](https://github.com/toivjon/html5-breakout) | J. Toiviainen | MIT | `html5-breakout/` |
| [html5-snake](https://github.com/JDStraughan/html5-snake) | Jason D. Straughan | MIT | `html5-snake/` |
| [html5-space-invaders](https://github.com/toivjon/html5-space-invaders) | Jon Toivonen | MIT | `html5-space-invaders/` |
| [react-simple-snake](https://github.com/MaelDrapier/react-simple-snake) | Maël Drapier | MIT | `react-simple-snake/` |
| Netrok | Ioan-Tudor Parvulescu | GPL-2.0-or-later | `netrok/` |
| SFont | Karl Bartel | GPL-2.0-or-later | `netrok/` |
| [Njam](http://njam.sourceforge.net) | Milan Babuskov | GPL-2.0-or-later | `njam/` |
| Njam AmigaOS4 1.21 port | Kjell Breding "Sharakmir" | GPL-2.0-or-later | `njam/` — primary behavioral reference |
| Warboats 0.51 (2009) | Trevor Chart | GPL-2.0-or-later | `naval-battle/` |
| Bataille Navale OS4 (2009) | billux13 (concept/code), Hugues Nouvel "HunoPPC" (AmigaOS4 port) | GPLv3 | `naval-battle/` — binary/debug reconstruction, no original C source recovered |
| [For Science!](https://www.usebox.net/jjm/for-science/) (PyWeek 16, 2013) | Juan J. Martínez | GPL-3.0-or-later | `for-science/` |
| [54321](http://www.nklein.com/products/54321) (2001) | Patrick Stein / nklein software | `LicenseRef-NKlein-Universal-NonExclusive` | `54321/` — original material only; the JS port itself is GPL-3.0-or-later |

`grugnetto-go/` is built for this collection, not a restoration; the
third-party libraries and CC0/CC-licensed art it uses are itemized in its own
in-game Credits screen and `public/LICENSE.txt`, not above.

## Shared conventions

- No framework or hosting-platform lock-in: every game is plain HTML/CSS/JS,
  servable by any static web server (`python3 -m http.server`, `npx serve`,
  nginx, GitHub Pages, ...).
- Ported games keep a `reference/` folder with untouched upstream snapshots,
  separate from the ported `src`/`public`; `specs/` documents how the port
  was verified. Restored games have no `reference/` — the whole `public/` is
  already the original code, cleaned for safe embedding — and instead record
  every change in `specs/design.md`, with authorship and license in
  `public/CREDITS.md`.
- Provenance and third-party licenses are recorded per file either way.
- `npm test` / `npm run lint` / `npm run check` work the same way in every
  game folder.

## License

This collection's own code and documentation — everything at this root level
(this `README.md`, `AGENTS.md`, `SOFTWARE_ARCHAEOLOGY.md`, `index.html`,
`package.json`, `scripts/`) plus every game's own new/ported code — is
licensed **GNU GPL v3** (see [`LICENSE`](LICENSE); a few individual game
folders declare `GPL-3.0-or-later` or `GPL-3.0-only` specifically — check
that folder's own `LICENSE`/`package.json`).

Vendored third-party files keep their original license: MIT for Hextris,
HTML5 Breakout, HTML5 Snake, HTML5 Space Invaders, and react-simple-snake;
CC0-1.0 for the Klondike card decks; a mix of GPL-2.0/MIT/CC BY 4.0 for
Briscola's nine historical AI sources; and, for four assets bundled with
For Science! (a background image, two fonts, one sound effect), a mix of
CC BY 2.0, CC BY 3.0, SIL OFL 1.1, and Apache-2.0 — see
`for-science/THIRD_PARTY_NOTICES.md`; and, for 54321's original 2001
material, the custom `LicenseRef-NKlein-Universal-NonExclusive` grant
(Patrick Stein / nklein software) — not GPL-compatible-by-assumption, but
independently verified via dated Wayback Machine captures of its own
copyright page bracketing the game's release, see
`54321/docs/LICENSE-RESEARCH.md`. This is a legal requirement of those
licenses, not a choice — permissively-licensed work can be included in and
distributed alongside a GPL project, but including it doesn't relicense it.
Every such file is declared per-folder (`THIRD_PARTY_NOTICES.md`,
`REUSE.toml` where present, or the table above) rather than assumed.

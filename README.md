# Libre Arcade

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/)** · **[💬 Feedback](https://github.com/linkingtechnologies/libre-arcade/issues)**

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
| [`klondike/`](klondike/) | [Grugnetto's Klondike](https://linkingtechnologies.github.io/libre-arcade/klondike/public/index.html) | *Ported.* Engine and sprite from `rjanjic/js-solitaire` (2021, MIT); solver architecture from `ShootMe/MinimalKlondike` (2023, MIT). Every deal is generated and solver-certified at runtime. |
| [`briscola/`](briscola/) | [Grugnetto's Briscola (BriscoLab)](https://linkingtechnologies.github.io/libre-arcade/briscola/index.html) | *Ported.* Nine historical and modern Briscola-playing AIs (C++/Qt, Ruby, Python, Java, C#, Godot+ONNX, JS) ported to a shared engine and benchmarked against each other in an Arena. |
| [`netris/`](netris/) | [Netris](https://linkingtechnologies.github.io/libre-arcade/netris/public/index.html) | *Ported.* Single-player core of Netris 0.52 (Mark H. Weaver, 1994-1999, GPL-2.0-or-later) — board, pieces, RNG and rules preserved exactly, including no score and no automatic speed-up. Also ports its bundled but never-shipped `sr.c` heuristic as a selectable autopilot. |
| [`hextris/`](hextris/) | [Hextris](https://linkingtechnologies.github.io/libre-arcade/hextris/public/index.html) | *Restored.* [Hextris](https://github.com/Hextris/hextris) (Logan Engstrom & Garrett Finucane, GPL-3.0-only), vendored as-is. |
| [`html5-breakout/`](html5-breakout/) | [HTML5 Breakout](https://linkingtechnologies.github.io/libre-arcade/html5-breakout/public/index.html) | *Restored.* [html5-breakout](https://github.com/toivjon/html5-breakout) (J. Toiviainen, MIT, archived), vendored with one small additive fix (a GAME OVER screen upstream never had). |
| [`html5-snake/`](html5-snake/) | [HTML5 Snake](https://linkingtechnologies.github.io/libre-arcade/html5-snake/public/index.html) | *Restored.* [html5-snake](https://github.com/JDStraughan/html5-snake) (Jason D. Straughan, MIT), vendored as-is — the unforgiving variant, wall contact ends the run. |
| [`html5-space-invaders/`](html5-space-invaders/) | [HTML5 Space Invaders](https://linkingtechnologies.github.io/libre-arcade/html5-space-invaders/public/index.html) | *Restored.* [html5-space-invaders](https://github.com/toivjon/html5-space-invaders) (J. Toiviainen, MIT, archived), vendored as-is. |
| [`react-simple-snake/`](react-simple-snake/) | [react-simple-snake](https://linkingtechnologies.github.io/libre-arcade/react-simple-snake/public/index.html) | *Restored.* [react-simple-snake](https://github.com/MaelDrapier/react-simple-snake) (Maël Drapier, MIT), vendored as-is — the relaxed variant, wraps around every edge. |
| [`netrok/`](netrok/) | [Netrok 0.95](https://linkingtechnologies.github.io/libre-arcade/netrok/index.html) | *Ported.* [Netrok](http://www.itpsoft.de) (Ioan-Tudor Parvulescu, 2004, GPL-2.0-or-later) — all 20 original levels, level editor, and its bundled SFont library. Source recovered from an OpenPandora `.pnd` package; see `netrok/reference/`. |
| [`njam/`](njam/) | [Njam 1.21](https://linkingtechnologies.github.io/libre-arcade/njam/index.html) | *Ported.* [Njam](http://njam.sourceforge.net) (Milan Babuskov, 2003, GPL-2.0-or-later), primary reference the AmigaOS4 1.21 port (Kjell Breding/Sharakmir, 2005) — full local/offline parity including editor, duel mode, and all bundled level sets. Network host/join deliberately not enabled. |
| [`naval-battle/`](naval-battle/) | [Grugnetto's Naval Battle (BattleLab)](https://linkingtechnologies.github.io/libre-arcade/naval-battle/index.html) | *Ported.* Historical Battleship AIs — Warboats 0.51 (2009, GPL-2.0-or-later) and a binary/debug reconstruction of Bataille Navale OS4 (2009, GPLv3) — behind a simplified five-difficulty player UI. Gnome Batalla Naval was evaluated and rejected as GPLv3-incompatible (GPL-2.0-only evidence); see `specs/candidates.md`. |
| [`for-science/`](for-science/) | [For Science!](https://linkingtechnologies.github.io/libre-arcade/for-science/public/index.html) | *Ported.* [For Science!](https://www.usebox.net/jjm/for-science/) (Juan J. Martínez, PyWeek 16, 2013, GPL-3.0-or-later) — a turn-based match-3 duel, ported from Python/Cocos2d/Pyglet with a Python 2.7 deterministic oracle and a 1000-seed AI stress run verifying the original AI's move/attack heuristics. |
| [`54321/`](54321/) | [54321](https://linkingtechnologies.github.io/libre-arcade/54321/public/index.html) | *Ported.* [54321](http://www.nklein.com/products/54321) (Patrick Stein / nklein software, 2001 1 MB SDL Game Programming Contest) — five n-dimensional puzzle games (Flip-Flop, Bomb Squad, Maze Runner, Peg Jumper, Tile Slider) sharing one 2D/3D/4D topology engine, in HTML5 Canvas 2D. Original material carries nklein's own historical `LicenseRef-NKlein-Universal-NonExclusive` grant, not GPL; see `54321/PROVENANCE.md`. |
| [`donkey-bolonkey/`](donkey-bolonkey/) | [Donkey Bolonkey](https://linkingtechnologies.github.io/libre-arcade/donkey-bolonkey/public/index.html) | *Ported.* [Donkey Bolonkey](http://www.davidcapello.com.ar/) (David A. Capello, SpeedHack 2001, GPL-2.0-or-later) — a color-matching puzzle with six historical levels, ported from C/Allegro. Original audio/graphics datafile has unclear media provenance and is intentionally excluded; the browser runtime uses procedural graphics and synthesized Web Audio instead. |
| [`psypong3d/`](psypong3d/) | [PSY PONG 3D](https://linkingtechnologies.github.io/libre-arcade/psypong3d/public/index.html) | *Ported.* [PSY PONG 3D](psypong3d/reference/original-source/psypong3d-0.9/) 0.9 (Quetzy Garcia, 2009, GPL-3.0-or-later) — a WebGL 3D Pong with always-diagonal ball motion, paddle warp/side-swap and a level-scaled CPU. Original BMP textures have unclear media provenance and are excluded; the browser runtime uses newly created replacement artwork instead. |
| [`wok/`](wok/) | [Wok](https://linkingtechnologies.github.io/libre-arcade/wok/public/index.html) | *Ported.* [Wok](wok/reference/wok-1.0/) 1.0 (Kenta Cho, 2001 SDL Game Development Contest, BSD-2-Clause-style) — catch falling balls with a tilting wok and throw them for combo score. Cleanly permissive license covers code and assets alike, so the original PNG/audio ship unchanged; the two historical beta-Vorbis music tracks are decoded once to WAV for current browsers. |
| [`yanoid/`](yanoid/) | [Yanoid](https://linkingtechnologies.github.io/libre-arcade/yanoid/public/index.html) | *Ported.* [Yanoid](yanoid/reference/yanoid-0.3.0/) 0.3.0 (Drewsen/Sørensen/Dydensborg, 2001 SDL Game Development Contest, GPL-2.0-or-later) — an Arkanoid-style breakout with all nine original maps and eleven-stage contest sequence, including a provably-unreachable power-up and a paddle that launches on its own at map start. Two code areas and ten binary files with unresolved third-party provenance are documented and excluded/unused, not the whole source. |
| [`terramancers/`](terramancers/) | [Terramancers](https://linkingtechnologies.github.io/libre-arcade/terramancers/public/index.html) | *Ported.* [Terramancers](terramancers/reference/extracted/) (Shai Shapira, Liberated Pixel Cup 2012, GPL-3.0-or-later code / CC-BY-SA-3.0+GPL-3.0-or-later dual-licensed artwork) — real-time Reversi-style tile capture with LPC character/terrain art. Ships alongside unused arena-combat code from an earlier, differently-scoped project sharing the same source tree; the completed game never calls it. |
| [`don-ceferino/`](don-ceferino/) | [Don Ceferino Hazaña](https://linkingtechnologies.github.io/libre-arcade/don-ceferino/public/index.html) | *Ported.* [Don Ceferino Hazaña](don-ceferino/reference/ceferino-0.97.8/) 0.97.8 (Hugo Ruscitti, 2004-2005, GPL-2.0-or-later) — a Super-Pang-inspired ball-popping action game with 30 original levels. Provenance-incomplete bitmap fonts and an XM module are kept visible in a dedicated `quarantine/` folder rather than silently removed. |
| [`glparchis/`](glparchis/) | [glParchis](https://linkingtechnologies.github.io/libre-arcade/glparchis/public/index.html) | *Ported.* [glParchis](glparchis/reference/glparchis-20181125/) 20181125 (Mariano Muñoz / Turulomio, GPL-3.0-only) — a Parchís board game with native 3/4/6/8-player boards, mixed human/CPU seats and the original probabilistic AI, including its historical threat-detection bug, preserved bug-for-bug. Original icons, avatars and WAV effects have unclear or explicitly non-free provenance and are excluded; the browser runtime uses procedural Canvas graphics and clean-room Web Audio instead. |
| [`game-of-the-goose/`](game-of-the-goose/) | [Game of the Goose](https://linkingtechnologies.github.io/libre-arcade/game-of-the-goose/public/index.html) | *Ported.* [Game of the Goose](game-of-the-goose/reference/game-of-the-goose-e8b804f/) (Robert Riesebos, `ISC`) — the classic race-and-obstacles board game for 1–6 local players, Modern and Classic rule sets, ported from a `boardgame.io` web app to a local-only static page. Two unattributed vendored pieces (player/goose SVGs, dice-roll code) are excluded; the browser runtime uses new inline SVG art and CSS-pip dice instead. |
| [`bubble-train/`](bubble-train/) | [Bubble Train](https://linkingtechnologies.github.io/libre-arcade/bubble-train/public/index.html) | *Ported.* [Bubble Train](bubble-train/reference/os4depot/) (Adam Child / Dwarf City, Craig Marshall, 2004, GPL-2.0-or-later) — a bubble-shooter/puzzle game ported from its AmigaOS4 C++ port, with all 61 original levels and 5 game manifests preserved byte-for-byte under a project-level GPL scope. Direct disassembly of the historical OS4 and GP2X executables cross-checks core mechanics; original graphics/fonts/audio are unresolved-license and excluded, replaced by new CC0-1.0 SVG art and procedural Web Audio. |
| [`grugnettos-goose/`](grugnettos-goose/) | [Grugnetto's Goose](https://linkingtechnologies.github.io/libre-arcade/grugnettos-goose/public/index.html) | *Ported.* Not a port of one historical program but of the traditional Game of the Goose itself — classic 63-space rules reconstructed from documented tradition, using two verified public-domain board artworks (Pmathijssen's 2008 Ganzenbord SVG; Daan Hoeksema's ca. 1910–1920 lithograph) and six other open-source Goose/race-game implementations studied for architecture and UX but not bundled, each carrying an unresolved license or asset gap. |
| [`grugnetto-go/`](grugnetto-go/) | [Grugnetto Go!](https://linkingtechnologies.github.io/libre-arcade/grugnetto-go/public/index.html) | *Built here.* An original platformer for this collection (melonJS + lit-html), not a restoration. |
| [`nova-pinball/`](nova-pinball/) | [Nova Pinball](https://linkingtechnologies.github.io/libre-arcade/nova-pinball/public/index.html) | *Ported.* [Nova Pinball](https://github.com/wesleywerner/nova-pinball) v0.2.3 (Wesley "keyboard monkey" Werner, 2015–2017, GPL-3.0-or-later) — the full 58-component historical table, 6-ball game and mission chain through Red Giant, Fusion, Black Hole, Wormhole and Supergravity, ported from Lua/LÖVE to framework-free Canvas/Web Audio. Original tracker music, a restrictive-license font, and the historical raster/WAV media have unclear or non-free redistribution terms and are excluded; the browser runtime uses a procedural dot-matrix HUD, new Canvas rendering and synthesized Web Audio instead. |
| [`mechanical-night-pinball/`](mechanical-night-pinball/) | [Mechanical Night Pinball](https://linkingtechnologies.github.io/libre-arcade/mechanical-night-pinball/public/index.html) | *Ported.* [DocDonkeys/Pinup-Pinball](https://github.com/DocDonkeys/Pinup-Pinball) 1.0 (2018, MIT) — table geometry, rules and scoring behind a clean-room deterministic solver calibrated against the archived Box2D 2.3.2 reference, commit-pinned and independently re-verified. The default flipper profile additionally restores a one-shot press-snap traced back further, to the older Flash ancestor the 2018 C++ remake itself had dropped (`?flipper=docdonkeys` for the strict 2018 behavior). Historical Flash/DocDonkeys binaries and expressive assets are not redistributed; the browser runtime uses new clean-room SVG artwork and a CC0 audio loop instead. |
| [`disk-field/`](disk-field/) | [Disk Field](https://linkingtechnologies.github.io/libre-arcade/disk-field/public/index.html) | *Ported.* Disk Field 1.01 (Jeremy Appleyard "Tigga", PyWeek 5, 2007, custom permissive grant) — a physics puzzle where you rotate a vector field to steer a disk into its target, with all 17 original levels, ported from Python/Pygame/OpenGL to Canvas 2D. The simulation is checked against the original Python modules with a headless oracle (2,238 ticks, 85 field samples) and every level is replayed to completion; the historical font, music and samples are not redistributed (unverified or restricted terms), the browser runtime uses procedural Canvas lettering and synthesized Web Audio instead. |

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
| Donkey Bolonkey (SpeedHack 2001) | David A. Capello | GPL-2.0-or-later | `donkey-bolonkey/` — the JS port exercises the "or later" grant and is GPL-3.0-or-later; original media datafile not redistributed |
| PSY PONG 3D 0.9 (2009) | Quetzy Garcia | GPL-3.0-or-later | `psypong3d/` — code license confirmed directly from the archive; original BMP textures not redistributed |
| Wok 1.0 (2001) | Kenta Cho | BSD-2-Clause-style | `wok/` — original PNG/audio assets redistributed as-is under the same permissive notice; the JS port itself is GPL-3.0-or-later |
| [Yanoid](https://sourceforge.net/projects/yanoid/) 0.3.0 (2001) | Jonas Christian Drewsen, Bjarke Sørensen, Mads Bondo Dydensborg | GPL-2.0-or-later | `yanoid/` — original source preserved except ten files with unresolved/third-party provenance; the JS port itself is GPL-3.0-or-later |
| Terramancers (LPC 2012) | Shai Shapira | GPL-3.0-or-later (code); CC-BY-SA-3.0 + GPL-3.0-or-later (art, dual-licensed) | `terramancers/` — see `terramancers/reference/audit/` for the individual LPC artist credits |
| Don Ceferino Hazaña 0.97.8 (2004-2005) | Hugo Ruscitti (graphics/story: Walter Velazquez; music: Javier Da Silva) | GPL-2.0-or-later | `don-ceferino/` — the JS port itself is GPL-3.0-only; see `don-ceferino/quarantine/` for provenance-incomplete media kept visible rather than removed |
| glParchis 20181125 (2018) | Mariano Muñoz "Turulomio" | GPL-3.0-only | `glparchis/` — original icons, avatars and WAV effects not redistributed; the JS port itself is GPL-3.0-or-later |
| [Game of the Goose](https://github.com/rriesebos/game-of-the-goose) | Robert Riesebos | `ISC` | `game-of-the-goose/` — no standalone LICENSE file exists upstream; two unattributed vendored assets (SVG art, dice-roll code) not redistributed; the JS port itself is GPL-3.0-or-later |
| Bubble Train (2004) | Adam Child (Dwarf City), Craig Marshall | GPL-2.0-or-later | `bubble-train/` — original graphics, bitmap fonts and audio not redistributed (unresolved third-party provenance); the 61 levels + 5 game manifests are preserved under the upstream project-level GPL grant; the JS port itself is GPL-3.0-or-later |
| Ganzenbord (2008) | Pmathijssen | Public domain (self-dedication) | `grugnettos-goose/` — board SVG redistributed byte-identical, independently re-verified against Wikimedia Commons |
| Ganzenbordspel (ca. 1910–1920) | Daan Hoeksema | Public domain (PD-old) | `grugnettos-goose/` — historical lithograph redistributed as a downscaled representation, not claimed byte-identical to the full-resolution Commons original; the JS engine itself is GPL-3.0-only |
| [Nova Pinball](https://github.com/wesleywerner/nova-pinball) v0.2.3 (2017) | Wesley "keyboard monkey" Werner (2019 LÖVE 11.2 maintenance: Eric Ahnell) | GPL-3.0-or-later | `nova-pinball/` — tracker music, a restrictive freeware font and the original raster/WAV media not redistributed (unclear or non-free provenance); table geometry preserved as data; the JS port itself is GPL-3.0-or-later |
| [DocDonkeys/Pinup-Pinball](https://github.com/DocDonkeys/Pinup-Pinball) 1.0 (2018) | Carles Homs "ch0m5" and the DocDonkeys team | MIT | `mechanical-night-pinball/` — principal table/rules parity target, commit-pinned and independently re-verified (tree SHA, blob hash); several of its own graphics/audio assets show evidence of deriving from the older Flash ancestor and are not treated as freely relicensable on that basis; the JS port itself is GPL-3.0-or-later |
| Pinup Pinball (Flash, undated) | rights/author not established as free/open | unresolved | `mechanical-night-pinball/` — behavioural/provenance reference only (recovered bytecode), not redistributed |
| Disk Field 1.0 / 1.01 (PyWeek 5, 2007) | Jeremy Appleyard "Tigga" | Custom informal permissive grant (upstream README: "Do whatever you like. Would like it if you gave me some sort of credit."), not an SPDX license | `disk-field/` — selected original Python modules and the 1.0→1.01 source diff kept under that grant, not relicensed; the font MAKISUPA.TTF, music, WAV/OGG samples and icons are not redistributed (restricted or unverified terms); the JS port itself is GPL-3.0-or-later |

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
- Every game's own page carries the same lightweight, cookie-free GoatCounter
  analytics snippet, inlined per-game rather than loaded from one shared
  file, so each game keeps working when copied out and served on its own.

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
`54321/docs/LICENSE-RESEARCH.md`; and BSD-2-Clause-style for all of Wok's
original PNG/WAV/OGG assets (Kenta Cho), stated in full in the archive's own
README — see `wok/specs/LICENSE_AUDIT.md`. This is a legal requirement of those
licenses, not a choice — permissively-licensed work can be included in and
distributed alongside a GPL project, but including it doesn't relicense it.
Every such file is declared per-folder (`THIRD_PARTY_NOTICES.md`,
`REUSE.toml` where present, or the table above) rather than assumed.

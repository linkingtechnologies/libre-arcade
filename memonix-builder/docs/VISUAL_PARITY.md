# Visual/UI parity

The restoration keeps the Builder gameplay model unchanged and replaces the principal preview/play presentation with recovered Memonix 1.6 interface artwork.

## Direct historical UI use

- `start.jpg`: original preview screen sheet; The restoration renders its historical 800×600 viewport.
- `start3.jpg`: original "Seconds Remaining" panel.
- `start2.jpg`: original countdown digit sheet.
- `game.jpg`: original gameplay background; The restoration renders its 800×600 viewport and also reads the timer digits stored in the strip at y=601..628.
- `game2.bmp`: original gameplay control sprite sheet. It is converted losslessly to PNG and its Builder selector panel is drawn at the source/destination coordinates used by `game.cpp`.
- `game3.bmp`: selected-category/disabled overlay converted to transparent PNG using the original black alpha key declared in `loading.cpp`.
- `error.bmp`, `error2.bmp`, `error3.bmp`: historical error/inactive overlays converted with the same alpha-key colours declared in `loading.cpp`.
- `box.jpg`: original winner dialog frame.

The full source/distributed SHA-256 mapping is in `historical-ui-manifest.csv`.

## Coordinates restored from the source

- board: `(44,44)` with 8×8 cells of 64×64 px;
- Builder selector panel: source `(163,2)-(365,204)` from `game2`, destination `(578,144)`;
- selected piece: `(602,212)`, 64×64;
- category hit areas: x `716..776`, y `144`, `196`, `248`, `300`;
- selector arrows: upper `(580,144)-(686,186)`, lower `(580,301)-(686,343)`;
- preview controls: Start y=344, Reset y=401, Options y=458, Menu y=515;
- gameplay controls: Mist y=401, Reset y=458, Menu y=515;
- game timer digits: destination x=688/709/730, y=50, using the original strip in `game.jpg`;
- winner dialog: `(200,200)`, 400×200 historical frame.

## Bilingual compromise

Memonix's recovered buttons contain English text in the historical bitmap. In EN mode The restoration leaves those original button faces visible and only adds a hover outline. In IT mode the same historical coordinates are covered by localized gold controls. This preserves both historical visual fidelity and the Libre Arcade EN/IT requirement.

## Standalone adaptations

- standalone title/menu;
- Options, Instructions, Credits and Top Scores screens;
- Web Audio replacement tones;
- touch/pointer support;
- Libre Arcade link in Credits.

The standalone title/menu is reconstructed from `mainmenu.jpg` and `pr_b.bmp` while preserving the historical Builder slot.

## Interaction QA

The test suite includes a complete 2×2 playthrough driven through the registered pointer handlers (New Game → Start → category selection → selector cycling → palette drag → board drop → win). This test exposed and fixed a a pre-existing hit-test signature mismatch affecting menu/utility clicks.

# Memonix: Mosaic

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/memonix-mosaic/public/index.html)**

A standalone HTML5 + JavaScript restoration of **Mosaic**, one of the four game modes in **Memonix 1.6** by Michael Kurinnoy / Viewizard Games.

The project preserves the original Mosaic rules and 800×600 coordinate model while running entirely client-side in a modern browser. No framework, build step, server-side component, or external runtime dependency is required.

## Included behavior

- 2×2, 4×4, 6×6 and 8×8 boards;
- five historical difficulty levels;
- timed or unlimited memorization preview, with 1–99 second countdown;
- single-family generation at the two easiest levels;
- historical symmetry rule at the easiest level;
- the four historical masks used on 6×6 and 8×8 boards;
- the **50 original Mosaic tile artworks**, preserved as lossless PNG conversions of the recovered 64×64 BMPs;
- exact historical tile family order, colours, suffix order and suffix-to-shape mapping;
- drag/drop and pointer/touch placement, tile replacement and movement;
- mistake helper on the lower difficulties;
- very-hard penalty that marks a wrong placement for about 500 ms and then clears the reconstruction;
- timer and best times stored separately for each difficulty/board-size combination;
- EN/IT interface;
- sound toggle;
- complete local-data reset;
- responsive 4:3 canvas with no page scrolling.

## Historical artwork source

The 50 Mosaic tiles were recovered from `gamedata.vfs` contained in the historical package `memonix_1.6_src.tar.bz2`. The package includes `MemonixSourceCode/License.txt`, whose GPLv3 notice explicitly refers to the accompanying **artwork pack**. The original package is preserved under `reference/` together with its SHA-256 and the recovered license notice.

The BMP pixels were converted to PNG without changing their 64×64 RGB pixel data. `assets/mosaic/original-asset-manifest.json` records the original archive path and SHA-256 for both the recovered BMP and distributed PNG version of every tile.

The title screen now also uses the recovered original `DATA/mainmenu.jpg` artwork from the same package. The historical 800×600 viewport, central illustration, rainbow, Memonix logo and four mode-window coordinates are preserved. Because Mosaic did not historically ship alone, those four windows are adapted for the standalone release: Mosaic remains the play entry, while the other three become Instructions, Options and Credits. Their replacement preview mosaics use only recovered original Mosaic tiles. Bottom navigation labels are bilingual reconstructed overlays placed on the original button rows. The historical background is rendered without masking or repainting, including its embedded Viewizard copyright line. Modern restoration attribution remains in Credits, where Libre Arcade is a clickable link.

Sound effects remain procedural replacements.

## Run

```sh
npm run dev      # serve public/ at http://localhost:8080
```

No build step is required to play: `public/` runs as-is with native ES modules. Any static web server works as well (`python3 -m http.server 8080` from `public/`, nginx, GitHub Pages). Do **not** open `index.html` over `file://`: browser module security blocks the local imports.

For the developer reference atlas, open `http://localhost:8080/tools/tile-atlas.html`.

`npm run build` packages `public/` into a gitignored `game/` folder for standalone deployment; `npm start` builds and then serves `game/`.

## Tests

```sh
npm test     # node --test
npm run lint
npm run check   # lint + test
```

The test suite has no external npm dependencies.

## Fidelity boundary

Gameplay rules, board geometry, difficulty behavior, family order, tile archive identifiers, historical masks and the 50 tile images are derived directly from the recovered Memonix 1.6 source/runtime material.

The title screen is now a **historical-layout adaptation** rather than a free reconstruction. Its underlying `mainmenu.jpg`, central Memonix artwork, 800×600 viewport and mode-window coordinates are original. The adaptation consists of reassigning the four suite mode slots to Mosaic/Instructions/Options/Credits and overlaying bilingual utility labels, because no historical standalone Mosaic menu exists.

Options, record, instruction and credit panels remain standalone restoration screens rather than literal Memonix suite screens.

See `docs/PARITY.md`, `docs/TILE_MAPPING.md`, `docs/VISUAL_PARITY.md`, `docs/ORIGINAL_ASSET_AUDIT.md`, `reference/SOURCES.md` and `THIRD_PARTY_NOTICES.md` for the archaeology trail.

## License

The HTML5 restoration code is distributed under **GPL-3.0-only**. The recovered Memonix 1.6 source and artwork-pack license notice (`reference/MemonixSourceCode-License.txt`) names GNU GPL version 3 with no "or later" clause, so this port cannot claim the "or later" permission; see `PROVENANCE.md`. Original Memonix authorship and recovered artwork provenance are documented in `THIRD_PARTY_NOTICES.md`.

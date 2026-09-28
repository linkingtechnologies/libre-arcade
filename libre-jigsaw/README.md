# Libre Jigsaw — HTML5 restoration

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/libre-jigsaw/public/index.html)**

Faithful browser restoration of Jonathan Hulka's **Libre Jigsaw**, evolved from the jigsaw game in **Virtual Toybox Puzzle Collection**.

HTML5 restoration and preservation by **Libre Arcade**: https://linkingtechnologies.github.io/libre-arcade/

## Run

```sh
npm run dev      # serve public/ at http://localhost:8080
npm run build    # package public/ into game/
npm start        # build, then serve game/
```

Any static web server works as well, and so does opening `public/index.html` directly: the page loads a classic script (`app.bundle.js`), not an ES module, specifically so `file://` works with no server at all. The playable build is client-side only and requires no framework or backend.

## Edit and test

- `src/*.js`: the editable, human-readable ES modules. `public/app.bundle.js` is generated from them by `npm run bundle` (`scripts/build-bundle.py`); edit `src/`, never the bundle directly.
- `npm run check`: ESLint plus `test/run-all.mjs`, which runs all 13 smoke checks (Node 18+, no dependencies) — geometry (both cutter generations), the historical 2010 layout parity, both snap policies, layers and multi-selection, save/load, completion placement, the resolution-independent viewport, menu accessibility, the bundle's DOM wiring, `file://` compatibility, the shipped player UI, and the preserved reference archives' checksums.
- `test/Print2010Layout.java`: an executable oracle. Compiled with `javac --release 8` against `reference/puzzlegames.jar` and run on a Java 8 runtime, it drives the actual original tile-manager classes and its output is checked against `test/oracle-layout-2010.csv` by `test/geometry2010-smoke.mjs`.
- [`specs/port-map.md`](specs/port-map.md): what maps to what, and how strong the evidence is. [`specs/ARCHAEOLOGY.md`](specs/ARCHAEOLOGY.md), [`specs/LINEAGE.md`](specs/LINEAGE.md), [`specs/ORACLE.md`](specs/ORACLE.md): the delivered audit. [`PROVENANCE.md`](PROVENANCE.md), [`SOFTWARE_ARCHAEOLOGY.md`](SOFTWARE_ARCHAEOLOGY.md), [`STORY.md`](STORY.md): origin, recovery and the short version for a reader.

## Player features

- original ten-photo gallery plus local JPG/PNG/GIF/WebP images;
- classic square and hexagonal cuts based on the later Libre Jigsaw behaviour;
- piece/group rotation and neighbour-to-neighbour snapping;
- three work areas and rectangle multi-selection;
- browser-native save/load, including embedded personal images;
- completed puzzles are turned upright and centered, matching the later Libre Jigsaw presentation;
- English and Italian UI;
- responsive canvas that preserves the current game across resize;
- no vertical page scrolling.

The historical 2010 and 2012 implementations, parity notes, oracles and regression tests remain in `/reference`, `/specs`, `/src` and `/test`; they are intentionally kept out of the player-facing interface.

`Sliding Tile Puzzle` and `Spinning Tile Puzzle` are intentionally outside this repository and will be restored as separate games while retaining the same Virtual Toybox genealogy. See `specs/LINEAGE.md`.

## Save files

The HTML5 restoration writes `.ljf` files using a self-contained JSON format identified as `libre-jigsaw-html5`. Gallery images are referenced by their bundled filename; personal images are embedded in the save so the game can be reopened even if the original local image is moved.

This browser-native format preserves the behaviour of save/load but is **not yet file-format compatible** with the Java-era `.ljf` serialization. Old Java `.ljf` files are detected and reported clearly rather than being misread.

## Preservation

Original upstream archives are retained unchanged under `/reference` with SHA-256 checksums (`reference/SHA256SUMS.txt`). `SHA256SUMS.txt` at the repository root covers every file in this package. See `THIRD_PARTY_NOTICES.md` and `/LICENSES` for software and photograph licensing.

## Resolution-independent playfield

Once a puzzle is created, its logical playfield, grid, cut geometry, groups and piece coordinates are frozen. Resizing or rotating the browser changes only a uniform viewport transform; it never regenerates the puzzle. Save format v2 records the logical playfield so the same game can move between desktop, tablet and phone without changing its topology. Beta 2 format-v1 saves remain readable.


## Interface

The player interface keeps file operations, image choice, puzzle settings and help in compact menus. The same controls remain available on small screens without horizontal toolbar scrolling. English and Italian labels and accessibility names are provided.

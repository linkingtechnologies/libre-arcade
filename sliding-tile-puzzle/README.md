# Sliding Tile Puzzle

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/sliding-tile-puzzle/public/index.html)**

HTML5 restoration of **Sliding Tile Puzzle**, originally included in Jonathan Hulka's **Virtual Toybox Puzzle Collection (2010.08.11)**.

This is a standalone Libre Arcade restoration. The related **Libre Jigsaw** and **Spinning Tile Puzzle** are preserved as separate games even though all three share the same historical source collection.

## Status

**Production ready.** The recovered 2010 rules, deterministic shuffle behavior, bundled-image background colors and historical assets are covered by regression/parity tests. The playable build has also been checked at desktop and mobile viewport sizes with no page scrolling.

## Play

```sh
npm run dev      # serve public/ at http://localhost:8080
npm run build    # package public/ into game/
npm start        # build, then serve game/
```

Any static web server works as well, and so does opening `public/index.html` directly: the page loads a classic script (`app.bundle.js`), not an ES module, so `file://` works with no server at all. No framework or backend is required.

The game includes the ten historical photographs, a local-image picker, 3×3 / 4×4 / 5×5 boards, preview, adjustable background color, IT/EN interface, instructions and credits. Pointer/touch input follows the original click-to-slide rules; arrow keys provide an accessibility input path without changing the rules.

## Edit and test

- `src/*.js`: the editable source. `public/app.bundle.js` is generated from it by `npm run bundle` (`scripts/build-bundle.py`); edit `src/`, never the bundle directly.
- `npm run check`: ESLint plus `test/run-all.cjs`, 8 checks (Node 18+, no dependencies, no JDK needed): the recovered rules and shuffle, a 750-move state regression, English/Italian strings, the shuffle algorithm and the background-color formula against stored oracle fixtures, the preserved archives' checksums, the bundled photographs' integrity, and the shipped player UI.
- `test/PrintSliderMix.java`, `test/PrintBackgroundColors.java`: the executable oracles behind those two fixtures. `test/production-smoke.sh` (needs bash and a JDK) re-runs them live against `reference/puzzlegames.jar` and confirms the stored fixtures have not drifted from the real jar; see `AGENTS.md` for how to regenerate the fixtures if the game's shuffle or color math ever changes.
- [`specs/port-map.md`](specs/port-map.md): what maps to what, and how strong the evidence is. [`specs/ARCHAEOLOGY.md`](specs/ARCHAEOLOGY.md), [`specs/ORACLE.md`](specs/ORACLE.md): the delivered audit. [`PROVENANCE.md`](PROVENANCE.md), [`SOFTWARE_ARCHAEOLOGY.md`](SOFTWARE_ARCHAEOLOGY.md), [`STORY.md`](STORY.md): origin, recovery and the short version for a reader.

## Preservation

Original artifacts are kept unchanged in `reference/` (the same three historical archives preserved in the sibling `libre-jigsaw/` project, since both games shipped in the collection's one 2010 jar); see `reference/SHA256SUMS.txt`. `SHA256SUMS.txt` at the repository root covers every file in this package.

The restoration preserves the original legal-move shuffle algorithm, including its historical directional bias (a `random.nextInt(1)` in the 2010 source that can only ever evaluate one way), verified against the real Java class from the preserved jar via reflection. It also preserves the original per-photo mean colors used by `PuzzleCanvas.setMeanColor()`, the square image geometry, and the light/shadow tile bevel.

The restoration source is GPL-3.0-or-later. Historical photographs remain separately licensed; see `THIRD_PARTY_NOTICES.md` and `LICENSES/`.

The page carries the collection's GoatCounter snippet (visit counts only, no cookies and no personal data). It is the only remote request the page makes.

HTML5 restoration and preservation by [Libre Arcade](https://linkingtechnologies.github.io/libre-arcade/).

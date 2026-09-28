# Spinning Tile Puzzle

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/spinning-tile-puzzle/public/index.html)**

HTML5 restoration of **Spinning Tile Puzzle**, originally one of the three games in Jonathan Hulka's **Virtual Toybox Puzzle Collection 2010.08.11**.

This is a standalone Libre Arcade restoration, the third and last of the collection: the related **Libre Jigsaw** and **Sliding Tile Puzzle** are already restored as separate games.

## Status

**Production ready.** The recovered geometry, shuffle, spin mechanics and background colors are covered by regression/parity tests. The playable build has also been checked at desktop and mobile viewport sizes with no page scrolling.

## Play

```sh
npm run dev      # serve public/ at http://localhost:8080
npm run build    # package public/ into game/
npm start        # build, then serve game/
```

Any static web server works as well, and so does opening `public/index.html` directly: the page loads a classic script (`app.bundle.js`), not an ES module, so `file://` works with no server at all. No framework or backend is required.

## Preserved gameplay

- exactly seven hexagonal tiles;
- six spin vertices;
- every move orbits three tiles and changes their orientation by 120°;
- click = clockwise, Shift+click = counter-clockwise on desktop;
- five-pass legal mix algorithm from `SpinnerHandler.mix()`, its historical seven-into-six no-op quirk included;
- completion requires both original position and zero rotation;
- click/tap after completion mixes a new puzzle;
- ten historical photographs, preview, custom image, and historical background colors;
- the original clockwise/counter-clockwise cursor artwork.

For touch/accessibility, `Puzzle → Direction` exposes the same clockwise/counter-clockwise operation without requiring a Shift key. Keys `1`–`6` are an alternate input path for the six vertices.

## Edit and test

- `src/*.js`: the editable source. `public/app.bundle.js` is generated from it by `npm run bundle` (`scripts/build-bundle.py`); edit `src/`, never the bundle directly.
- `npm run check`: ESLint plus `test/run-all.cjs`, 7 checks (Node 18+, no dependencies, no JDK needed): the recovered rules, a 144,000-spin stress test, English/Italian strings, the geometry/shuffle/spin mechanics against stored oracle fixtures, the preserved archives' checksums, the bundled photo and cursor files' integrity, and the shipped player UI.
- `test/PrintSpinnerOracle.java`: the executable oracle behind the geometry, mix and spin fixtures. `test/production-smoke.sh` (needs bash and a JDK) re-runs it live against `reference/puzzlegames.jar` and confirms the stored fixtures have not drifted from the real jar; see `AGENTS.md` for how to regenerate them if the game's geometry, shuffle or spin math ever changes.
- [`specs/port-map.md`](specs/port-map.md): what maps to what, and how strong the evidence is. [`specs/ARCHAEOLOGY.md`](specs/ARCHAEOLOGY.md), [`specs/ORACLE.md`](specs/ORACLE.md): the delivered audit. [`PROVENANCE.md`](PROVENANCE.md), [`SOFTWARE_ARCHAEOLOGY.md`](SOFTWARE_ARCHAEOLOGY.md), [`STORY.md`](STORY.md): origin, recovery and the short version for a reader.

## Validation

- deterministic parity against the 2010 Java implementation for geometry, single spins and seeded mixing, checked against stored oracle fixtures (an optional live re-run against a real JDK is available, see above);
- stress-tested with 144,000 reversible spins and 250 additional mixes;
- original photographs, thumbnails and rotation cursors checked byte-for-byte against `puzzlegames.jar`;
- responsive shell and bilingual UI share the same menu structure used by the other restored Virtual Toybox games.

## Preservation

Original artifacts are kept unchanged in `reference/` (the same three historical archives preserved in the sibling `libre-jigsaw/` and `sliding-tile-puzzle/` projects, since all three games shipped in the collection's one 2010 jar); see `reference/SHA256SUMS.txt`. `SHA256SUMS.txt` at the repository root covers every file in this package.

The restoration preserves the original legal-move geometry, the five-pass shuffle including its historical seven-into-six no-op (a shuffled index list of seven values feeding a spin operation that only accepts six), and the per-photo mean background colors used by `PuzzleCanvas.setMeanColor()`, verified against the real Java classes via reflection and direct calls. See `THIRD_PARTY_NOTICES.md` and `LICENSES/`.

The page carries the collection's GoatCounter snippet (visit counts only, no cookies and no personal data). It is the only remote request the page makes.

HTML5 restoration and preservation by [Libre Arcade](https://linkingtechnologies.github.io/libre-arcade/).

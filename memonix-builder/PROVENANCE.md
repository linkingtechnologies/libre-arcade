# Provenance

| Layer | Source | Exact revision | License | Treatment |
|---|---|---|---|---|
| Game rules, 11 structural house templates, difficulty-dependent piece probabilities, Ltr/Rtr drainpipe dependencies, board geometry, menu-window coordinates | **Memonix 1.6** by Michael Kurinnoy, Viewizard Games | recovered `memonix_1.6_src.tar.bz2` (SHA-256 `c5bd236c5cff2ffc07d98aff698368f32149c2428229fcde913e93bced250eab`), `game_start.cpp`'s `housedata`/structural-code switch read line-by-line | GPL-3.0-only | Frozen upstream tree preserved in `reference/`; re-implemented in `public/src/model.js`, `public/src/templates.js`, `public/src/menu_layout.js` and `public/src/app.js` |
| 88 original Builder component bitmaps (windows, walls, doors, roof, blank) | same package, `gamedata.vfs` (SHA-256 `883cc09707ff645f264199eadbe5f22a0309699b8ac3716fd2ada69abae299f3`), `DATA/BUILDER/**/*.bmp` | same revision | GPL-3.0-only | Extracted, converted losslessly to PNG, distributed in `public/assets/builder/`; per-file hashes in `public/assets/builder` (see `docs/builder-png-manifest.csv`, kept at the game root for audit) |
| Historical title/menu/play UI artwork (`mainmenu.jpg`, `pr_b.bmp`, `main_game.bmp`, `start.jpg`, `start2.jpg`, `start3.jpg`, `game.jpg`, `game2.bmp`, `game3.bmp`, `error.bmp`, `error2.bmp`, `error3.bmp`, `box.jpg`) | same package, `gamedata.vfs` | same revision | GPL-3.0-only | Recovered, distributed byte-identical or as documented lossless/colour-key conversions in `public/assets/ui/original/`; per-file hashes in `public/assets/ui/original/menu-asset-manifest.json` and `docs/historical-ui-manifest.csv` |
| HTML5 restoration code (canvas rendering, input handling, settings/score storage, standalone menu adaptation) | this repository | — | GPL-3.0-only | New code, but a derivative work: it re-implements Memonix's own template data, structural-code generation algorithm and menu coordinates, so it cannot claim a broader license than its source |

## The license is GPL-3.0-only, not GPL-3.0-or-later

Same finding as this collection's other Memonix restoration ([`memonix-mosaic/`](../memonix-mosaic/)): the recovered `reference/Memonix-License.txt` names "the GNU General Public License version 3" with no "or later" language, and the same wording repeats in the per-file C++ headers across the recovered source tree. A fresh search of this delivered package found no "or later" phrasing anywhere outside the generic FSF boilerplate. Per this collection's own rule (see the root [`AGENTS.md`](../AGENTS.md)), the port stays **GPL-3.0-only**.

Because the HTML5 code derives Memonix's own structural templates, generation probabilities and menu coordinates (see `THIRD_PARTY_NOTICES.md`), it is a derivative work and inherits the same terms.

## Independent verification

Every recovered asset was independently re-derived from the original binary formats, reusing the same from-scratch VFS/RLE/BMP/PNG pipeline built for `memonix-mosaic/`, reading only the preserved C++ source and the public BMP/PNG/zlib specifications — not the delivered package's own extraction claims:

- **VFS container and RLE compression**: the same independent Python extractor (written from `Core/VirtualFileSystem/VFS.cpp`/`VFS.h`/`RLE.cpp`) was re-run against this package's own copy of `gamedata.vfs`. It located the same 265 entries as the Mosaic extraction (confirming byte-identical archives, hash `883cc097...`), including all 88 entries under `DATA/BUILDER/`, decompressing every one to exactly its declared length with zero mismatches.
- **BMP and PNG decoding**: the same from-scratch BMP reader and PNG reader (chunk parsing, zlib inflate, all five filter types) were used to decode every recovered Builder bitmap and every distributed PNG pixel-by-pixel.

Cross-checking found:
- all 88 Builder component PNGs pixel-identical to their recovered BMP source (360,448 total pixels checked, zero mismatches);
- `pr_b.bmp` → `builder-preview.png` and `game2.bmp` → `game2.png` pixel-identical (lossless container change only);
- `main_game.bmp` → `mode-hover-frame.png`, `game3.bmp` → `game3.png`, `error.bmp` → `error-x.png`, `error2.bmp` → `error-shade.png`, and `error3.bmp` → `inactive-overlay.png` pixel-identical once accounting for each file's documented colour-key-to-alpha conversion (black key for `main_game`/`game3`, white key for `error`/`error3`), checked across every pixel with zero unexplained mismatches;
- `mainmenu.jpg`, `start.jpg`, `start2.jpg`, `start3.jpg`, `game.jpg` and `box.jpg` all byte-identical between the recovered archive and the distributed copies.

This is level-1 (executable-oracle-equivalent) verification for every redistributed asset.

The generation algorithm itself went further than the equivalent Mosaic check. `game_start.cpp`'s entire structural-code `switch` statement (19 cases: the blank code and 18 piece-selection codes, covering roughly 500 source lines) was read and compared line-by-line against `public/src/model.js`'s `resolveCode`, including every difficulty branch, every cached-facade slot (`El103`/`El203`/`El403`), and both drainpipe-dependency branches (`Ltr`, `Rtr`). All 11 structural templates (704 cells total) were additionally diffed programmatically, cell-by-cell, between the recovered `housedata[11][8][8]` array and `public/src/templates.js`: **zero mismatches**. This review also confirmed one easy-to-miss, correctly-preserved source quirk: case `403`'s difficulty-1 cached-facade range is `6`, narrower than its difficulty-0/2+ range of `10` — unlike the otherwise-identical cases `103` and `203`, whose D0 and D1 ranges match. The port passes `d1Range=6` specifically for `El403` rather than reusing the full alternative count, matching the source exactly rather than the more "obvious" uniform pattern the other two cases follow.

This is strong level-3 (documented, line-by-line source-level equivalence review) verification, not level-1 — no C++ toolchain was available in this environment to build and run the original executable as a live oracle — but it is more exhaustive than a spot check: every case and every template cell was checked, not a sample.

See `docs/BEHAVIOR_ORACLE.md`, `docs/GAMEPLAY_PARITY.md`, `docs/ASSET_AUDIT.md`, `docs/MENU_FIDELITY.md` and `docs/VISUAL_PARITY.md` for the detailed per-behavior and per-asset trail, and `reference/SOURCE_SHA256.txt` for exact source identities and hashes.

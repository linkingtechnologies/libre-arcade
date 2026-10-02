# Port map

This map links the preserved Memonix 1.6 C++ source (`reference/memonix_1.6_src.tar.bz2`, tree rooted at `MemonixSourceCode/src/`) to its JavaScript equivalent in `public/src/`. See `PROVENANCE.md` for licensing and `docs/GAMEPLAY_PARITY.md`/`docs/BEHAVIOR_ORACLE.md` for the behavior-level checklist this map supports.

| Original function/data | Extracted equivalent | Status |
| --- | --- | --- |
| `game_start.cpp`'s `int housedata[11][8][8]` (11 structural house templates) | `public/src/templates.js` `HOUSE_TEMPLATES` | Preserved exactly: all 704 cells across all 11 templates diffed programmatically against the source array, zero mismatches |
| `game_start.cpp`'s template selection (`GameMask = (int)fmodf(vw_Rand(),11)` inside a `while(GameMask==MaskT)` no-repeat loop) | `public/src/model.js` `chooseTemplate` | Preserved: same reject-and-resample no-immediate-repeat rule |
| `game_start.cpp`'s structural-code `switch` (traversal `for(i=7..0) for(j=7..0) switch(housedata[mask][j][i])`, 19 cases covering blank cells plus 18 window/wall/door/roof codes, ~500 source lines) | `public/src/model.js` `resolveCode` | Preserved line-by-line for every case, confirmed by direct source reading, not transcribed from a summary |
| Cases `10150`/`10550` (`Ltr`/`Rtr` drainpipe flags, `while(test>2)test-=2` wrap) | `resolveCode` cases `10150`/`10550`, `wrapSubtract(...,2,2)` | Preserved exactly, including the boolean flags read by cases `20150`/`20550`/`30150`/`30550` downstream |
| Case `103`/`203`/`403` (first-slot probability `first<=60-difficulty*10`, then a difficulty-dependent cached-facade pick across up to three slots, then a `test1=1+fmod(rand,2)` fourth-pick that can only land on slot 2 or 3) | `resolveCode` cases `103`/`203`/`403`, `cachedFacadePick` | Preserved exactly, including the quirk that the first cached slot becomes unreachable once all three slots are filled (same mechanism as Netris/Spinning Tile Puzzle-style "keep the bug" preservation elsewhere in this collection) |
| Case `403`'s difficulty-1 cached range (`fmodf(vw_Rand(),6.0f)`, narrower than its own difficulty-0/2+ range of `10.0f`) | `cachedFacadePick(state,'El403',A403,difficulty,random,6)` | Preserved exactly — confirmed as a genuine per-case asymmetry in the source (cases `103`/`203` use the *same* range for D0 and D1; `403` does not), not normalized away |
| Cases `30150`/`30550` (`Ltr`/`Rtr`-gated single choice) | `resolveCode` cases `30150`/`30550` | Preserved |
| Cases `402`/`404` (`fmodf(vw_Rand(),2.0f+difficulty)` wrapped into 4 options via `while(test>3)test-=3`) | `resolveCode` cases `402`/`404`, `wrapSubtract(...,3,3)` | Preserved |
| Center-crop (board sizes below 8×8 keep only the centered `size×size` window of the generated 8×8 target) | `public/src/model.js` `generateBuilder`'s `lo`/`hi` crop after full generation | Preserved: crop happens after the full 8×8 traversal, matching the source's generate-full-then-display-subset order |
| `menu.cpp`'s four suite-mode window coordinates (Builder `(176,66)`, Pair `(496,66)`, Mosaic `(56,255)`, Jigsaw `(616,255)`) | `public/src/menu_layout.js` | Preserved exactly, confirmed by direct reading of the `menu.cpp` call sites (same coordinates independently confirmed for `memonix-mosaic/`); Builder keeps its own historical slot, the other three are repurposed to Instructions/Options/Credits |
| `options.cpp`'s Builder-preview texture composition (if any; not isolated by name this session) and `DATA\pr_b.bmp` | `public/assets/ui/original/builder-preview.png` | Not re-executed as code; the resulting bitmap was instead recovered directly from the archive and independently pixel-verified |
| `game.cpp`'s Builder selector-panel layout (`game2.bmp` source rects, category hit areas, selector arrows) | `public/src/app.js` coordinate constants, documented in `docs/VISUAL_PARITY.md` | Preserved: coordinates transcribed from `docs/VISUAL_PARITY.md`'s own citation of `game.cpp`, not independently re-derived from the source in this session |
| Core/VirtualFileSystem (`VFS.cpp`/`VFS.h`/`RLE.cpp`) | one-off Python extractor (not shipped in `public/`, used only to recover and verify the assets committed under `public/assets/`) | Ported and independently re-verified: same algorithm already verified for `memonix-mosaic/`, re-run here against this package's own `gamedata.vfs` copy with zero file-table or size mismatches across all 265 entries |

## Verification level

Per this collection's verification hierarchy (see the root [`AGENTS.md`](../AGENTS.md)):

- **Level 1 (executable oracle)** for every redistributed asset: the VFS container, its RLE compression, and the BMP/PNG pixel data were all independently re-implemented and cross-checked byte-for-byte and pixel-for-pixel. See `PROVENANCE.md` for exact figures (265/265 files, 88/88 Builder tiles, 0 mismatches).
- **Strong level 3 (documented, exhaustive source-level review)** for the generation algorithm: every one of the 19 structural-code cases in `game_start.cpp` was read and compared line-by-line against `resolveCode`, and all 704 template cells were diffed programmatically rather than sampled. No C++ toolchain was available in this environment to build and run the original executable as a live oracle for board generation, so this does not reach level 1, but it is exhaustive rather than a spot check.
- **Transcription, not independently re-derived**, for the Builder selector-panel pixel coordinates in `public/src/app.js`: these were taken from `docs/VISUAL_PARITY.md`'s own citation of `game.cpp` as delivered, and were not re-read against the preserved source line-by-line in this session.

This map does not claim oracle-level confidence for board generation, only for the recovered assets and the fully-diffed template data.

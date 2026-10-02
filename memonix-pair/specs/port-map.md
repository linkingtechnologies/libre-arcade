# Port map

This map links the preserved Memonix 1.6 C++ source (`reference/memonix_1.6_src.tar.bz2`, tree rooted at `MemonixSourceCode/src/`) to its JavaScript equivalent in `public/src/`. See `PROVENANCE.md` for licensing and `docs/BEHAVIOR_ORACLE.md`/`docs/GAMEPLAY_PARITY.md` for the behavior-level checklist this map supports.

| Original function/data | Extracted equivalent | Status |
| --- | --- | --- |
| `game_start.cpp`'s face-pool selection (`StartNum = textureId("toys-001.bmp")`; `test = StartNum + fmod(rand(),71)`, rejected if already chosen) | `public/src/model.js` `generatePair`'s `chosen` loop over `FACE_IDS` | Preserved: the port replaces texture-ID arithmetic (meaningless in a browser) with an array of the same 71 face identifiers in the same order, selected the same way — reject-on-duplicate, not Fisher-Yates |
| `game_start.cpp`'s D0-on-larger-than-2×2 branch (4 copies per symbol; placement by repeatedly re-rolling `(X,Y)` until `FieldData[X][Y]==0`) | `generatePair`'s `copies=4` branch, `while(left){...}` rejection-sampling loop | Preserved exactly, including that it is rejection sampling, not a shuffle |
| `game_start.cpp`'s normal branch (2 copies per symbol, same placement loop) | `generatePair`'s `copies=2` branch | Preserved |
| `game_start.cpp`'s `memcpy(FieldDataPair, FieldData, sizeof(FieldData))` (post-generation backup for Hard-mode restore) | No separate backup array in the port; `board` is never mutated to a "completed" sentinel, so resetting `status` achieves the same effect | Faithful JS-idiomatic equivalent, not a literal structural copy — see `PROVENANCE.md` for why this is still correct |
| `game.cpp`'s first-card click (`SearchFor = SetFieldData[...] = FieldData[...]`) | `public/src/model.js` `clickCard`'s `if(!state.first)` branch | Preserved |
| `game.cpp`'s second-card match (`RightShow=true` then, after 500 ms, both cells set to `-1`) | `clickCard`'s `kind='match'` path, `resolvePending`'s match branch | Preserved, including the 500 ms delay |
| `game.cpp`'s second-card mismatch (`ErrorShow=true` then, after 500 ms, every flipped cell resets; additionally, only if `Setup.Difficult==2`, `FieldData` is restored from `FieldDataPair`) | `clickCard`'s `kind='mismatch'` path, `resolvePending`'s mismatch branch (`difficulty===2` resets every cell's status to `'hidden'`, otherwise only the two `'up'` cells) | Preserved, including the 500 ms delay and the difficulty-gated full-board reset |
| `menu.cpp`'s four suite-mode window coordinates (Pair at `(496,66)`, Builder `(176,66)`, Mosaic `(56,255)`, Jigsaw `(616,255)`) | `public/src/menu_layout.js` | Preserved exactly, confirmed by direct reading of the `menu.cpp` call sites (same coordinates independently confirmed for `memonix-mosaic/` and `memonix-builder/`); Pair keeps its own historical slot, the other three are repurposed to Instructions/Options/Credits |
| `game.cpp`'s Pair-specific selector-panel layout (shared `game2.bmp` region, no Mist button) | `public/src/app.js` coordinate constants, documented in `docs/VISUAL_PARITY.md` | Transcribed from `docs/VISUAL_PARITY.md`'s own citation of `game.cpp` as delivered, not independently re-read against the source line-by-line in this session |
| Core/VirtualFileSystem (`VFS.cpp`/`VFS.h`/`RLE.cpp`) | one-off Python extractor (not shipped in `public/`), re-run for `memonix-builder/` only — this game's assets were pulled from that same extraction rather than re-extracting | Ported and independently re-verified for the shared archive; see `memonix-builder/PROVENANCE.md` |

## Verification level

Per this collection's verification hierarchy (see the root [`AGENTS.md`](../AGENTS.md)):

- **Level 1 (executable oracle)** for every redistributed asset: the VFS container, its RLE compression, and the BMP/PNG pixel data were all independently re-implemented and cross-checked byte-for-byte and pixel-for-pixel. See `PROVENANCE.md` for exact figures (72/72 card assets, 0 mismatches).
- **Strong level 3 (documented source-level review)** for the deck-generation and matching logic: `game_start.cpp`'s face-selection and placement loops, and `game.cpp`'s entire click/match/mismatch/hard-restore block, were read directly and compared statement-by-statement against the port, not taken from the delivered behavioral-oracle document on trust. No C++ toolchain was available in this environment to build and run the original executable as a live oracle, so this does not reach level 1.
- **Transcription, not independently re-derived**, for the Pair selector-panel pixel coordinates in `public/src/app.js`: these were taken from `docs/VISUAL_PARITY.md`'s own citation of `game.cpp` as delivered.

This map does not claim oracle-level confidence for the deck-generation and matching algorithm, only for the recovered assets and the directly-read source logic.

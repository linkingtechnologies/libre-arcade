# Provenance

| Layer | Source | Exact revision | License | Treatment |
|---|---|---|---|---|
| Game rules, board geometry, difficulty behavior, tile family/suffix order, historical masks, menu-window coordinates | **Memonix 1.6** by Michael Kurinnoy, Viewizard Games | recovered `memonix_1.6_src.tar.bz2` (SHA-256 `c5bd236c5cff2ffc07d98aff698368f32149c2428229fcde913e93bced250eab`), C++ source read function-by-function | GPL-3.0-only | Frozen upstream tree preserved in `reference/`; re-implemented in `public/src/model.js`, `public/src/menu_layout.js` and `public/src/app.js` |
| 50 original Mosaic tile bitmaps | same package, `gamedata.vfs` (SHA-256 `883cc09707ff645f264199eadbe5f22a0309699b8ac3716fd2ada69abae299f3`), `DATA/MOSAIC/*.bmp` | same revision | GPL-3.0-only | Extracted, converted losslessly to PNG, distributed in `public/assets/mosaic/`; per-file hashes in `public/assets/mosaic/original-asset-manifest.json` |
| Original title/menu artwork (`mainmenu.jpg`, `pr_m.bmp`, `main_game.bmp`) | same package, `gamedata.vfs` | same revision | GPL-3.0-only | Recovered, distributed byte-identical or as documented lossless/colour-key conversions in `public/assets/ui/original/`; per-file hashes in `public/assets/ui/original/menu-asset-manifest.json` |
| HTML5 restoration code (canvas rendering, input handling, settings/score storage, standalone menu adaptation) | this repository | — | GPL-3.0-only | New code, but a derivative work: it re-implements Memonix's own board generation, family/suffix ordering and menu coordinates, so it cannot claim a broader license than its source |

## The license is GPL-3.0-only, not GPL-3.0-or-later

This collection defaults ported games to the broadest license the upstream evidence supports, and normally that is GPL-3.0-or-later. Memonix is the first exception.

The recovered `MemonixSourceCode/License.txt` (preserved verbatim as `reference/MemonixSourceCode-License.txt`) states:

> Memonix game source code available under "dual licensing" model [...] You should have received a copy of the GNU General Public License version 3 with this artwork pack.

This names **version 3** with no "or later" language anywhere in the notice, and the same wording is repeated in every per-file C++ header inside the recovered source tree — checked directly, not inferred from a packager's metadata. A global search across the whole recovered tree for "or later" phrasing found none outside the generic FSF boilerplate file that ships with every GPL distribution and does not itself grant the permission. Per this collection's own rule (see the root [`AGENTS.md`](../AGENTS.md)), the absence of an explicit grant means the port stays **GPL-3.0-only**: `LICENSE`, `package.json` and this file all reflect that.

Because the HTML5 code derives Memonix's own board generation, family/suffix ordering and menu coordinates (see `THIRD_PARTY_NOTICES.md`), it is a derivative work and inherits the same GPL-3.0-only terms — there is no "or later" clause available to relicense the whole project the way, for example, Netris's GPL-2.0-or-later original let that port move to GPL-3.0-or-later.

## Independent verification

Rather than trust the delivered package's own extraction and conversion claims, every recovered asset was independently re-derived from the original binary formats, reading only the preserved C++ source and the public BMP/PNG/zlib specifications:

- **VFS container** (`gamedata.vfs`): a from-scratch Python parser was written directly from `VFS.h`/`VFS.cpp` (signature, version, optional archive key, little-endian file table with name/offset/length/real-length entries). It located exactly 50 entries under `DATA/MOSAIC/` plus the three title/menu assets.
- **RLE compression**: `RLE.cpp`'s `vw_RLEtoDATA` was ported to a standalone Python function (a leading non-zero byte `n` means "repeat the next byte `n` times"; a leading zero means "the next byte is a literal-run length, followed by that many raw bytes"). Every decompressed entry's length matched its declared `RealLength` exactly, with zero size mismatches across all 265 files in the archive.
- **BMP decoding**: a from-scratch 24-bit BMP reader (bottom-up row order, BGR→RGB) was used to read every recovered tile bitmap directly, independent of any image library.
- **PNG decoding**: a from-scratch PNG reader (chunk parsing, zlib/DEFLATE inflate, and all five filter types — None, Sub, Up, Average, Paeth) was used to decode the distributed PNGs pixel-by-pixel.

Cross-checking BMP-decoded originals against PNG-decoded distributed assets found:

- all 50 Mosaic tile PNGs pixel-identical to their recovered BMP source (64×64 RGB, zero mismatches);
- `pr_m.bmp` → `mosaic-preview.png` pixel-identical (lossless container change only);
- `main_game.bmp` → `mode-hover-frame.png` pixel-identical once accounting for the documented black-colour-key-to-alpha conversion (checked across all 19,600 pixels, zero unexplained mismatches);
- `mainmenu.jpg` distributed byte-identical to the archive's own copy (hash match, no re-encoding).

This is level-1 (executable-oracle-equivalent) verification for every redistributed asset: nothing about the delivered PNGs was taken on faith. The gameplay rules and menu coordinates in `public/src/model.js`, `public/src/menu_layout.js` and `public/src/app.js` were instead checked by level-3 source-level review (see `specs/port-map.md`), because no C++ toolchain was available in this environment to build and run the original executable directly.

See `docs/PARITY.md`, `docs/TILE_MAPPING.md`, `docs/VISUAL_PARITY.md` and `docs/ORIGINAL_ASSET_AUDIT.md` for the detailed per-behavior and per-asset trail, and `reference/SOURCES.md` for exact source identities and hashes.

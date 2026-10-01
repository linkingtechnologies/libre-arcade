# Original Mosaic asset audit

## Recovered package

`reference/memonix_1.6_src.tar.bz2`

SHA-256:

`c5bd236c5cff2ffc07d98aff698368f32149c2428229fcde913e93bced250eab`

The package contains:

- the Memonix 1.6 source tree;
- `gamedata.vfs`;
- `MemonixSourceCode/License.txt`;
- the GPLv3 license text.

Recovered `gamedata.vfs` SHA-256:

`883cc09707ff645f264199eadbe5f22a0309699b8ac3716fd2ada69abae299f3`

## License evidence

`MemonixSourceCode/License.txt` identifies Memonix 1.6, Michael Kurinnoy / Viewizard Games, the dual-licensing model and the GNU GPL version 3 open-source option. The notice specifically says the GPL copy should have been received “with this artwork pack”. A byte-for-byte copy of that notice is preserved as `reference/MemonixSourceCode-License.txt`.

## Extraction

The Viewizard VFS implementation in the recovered source tree was used as the format oracle for decoding `gamedata.vfs`. The archive contains all 50 expected files under `DATA/MOSAIC/`.

Each original BMP is 64×64. For browser use it was converted to RGB PNG. A pixel-for-pixel verification was performed after conversion: every RGB pixel in each PNG matched the corresponding recovered BMP.

## Manifest

`assets/mosaic/original-asset-manifest.json` records for all 50 assets:

- family and family name;
- exact RGB family colour;
- logical slot and archive suffix;
- certified shape name;
- original VFS path;
- distributed PNG path;
- dimensions;
- SHA-256 of the recovered BMP;
- SHA-256 of the distributed PNG.

No original music or SFX are included in this standalone restoration.


## Recovered title/menu assets

The same `gamedata.vfs` archive also contains the original Memonix main-menu resources used by this standalone adaptation.

`assets/ui/original/menu-asset-manifest.json` records the recovery and transformation of:

- `DATA/mainmenu.jpg` — distributed byte-for-byte unchanged; the app draws its historical upper 800×600 viewport;
- `DATA/pr_m.bmp` — the original 128×128 Mosaic mode preview, converted losslessly to PNG;
- `DATA/main_game.bmp` — the original mode-window hover frame; its black colour-key is represented as alpha transparency in the distributed PNG.

The original source application places the four game previews at `(176,66)`, `(496,66)`, `(56,255)` and `(616,255)`. The standalone restoration preserves those exact coordinates but reassigns three unavailable suite modes to navigation functions. This adaptation is documented in `docs/VISUAL_PARITY.md`; it is not represented as a historical standalone screen.

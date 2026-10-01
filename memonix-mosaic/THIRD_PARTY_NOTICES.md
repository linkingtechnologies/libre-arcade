# Third-party notices

## Memonix historical source code

**Memonix 1.6** source code is copyright (c) 2003–2006 Michael Kurinnoy, Viewizard Games. The recovered historical source tree states that the source code is available under a dual-licensing model including an Open Source Licensing option under GNU GPL version 3.

This HTML5 restoration derives game behavior, source-coordinate layout, historical masks and tile identifiers from that source.

## Original Mosaic tile artwork

This package redistributes the 50 original 64×64 Mosaic tile images as lossless PNG conversions. They were extracted from `gamedata.vfs` contained in the recovered historical package `memonix_1.6_src.tar.bz2`.

The same package contains `MemonixSourceCode/License.txt`. Its open-source notice says that a copy of GNU GPL version 3 should have been received **“with this artwork pack.”** The recovered notice is preserved verbatim as `reference/MemonixSourceCode-License.txt`, and the complete original package is preserved in `reference/memonix_1.6_src.tar.bz2`.

The conversion from BMP to PNG changes only the file container/compression. Pixel dimensions and RGB pixel values are preserved. Per-file provenance and hashes are recorded in `assets/mosaic/original-asset-manifest.json`.

## Original Memonix title/menu artwork

This package also redistributes the recovered original `DATA/mainmenu.jpg` title/menu artwork. The distributed JPEG is byte-identical to the file decoded from `gamedata.vfs`. `DATA/pr_m.bmp` is distributed as a lossless PNG conversion for the historical Mosaic preview, and `DATA/main_game.bmp` is converted to RGBA PNG with the original black colour-key represented as transparency.

Per-file hashes and transformations are documented in `assets/ui/original/menu-asset-manifest.json`.

Mosaic did not historically ship as a separate standalone program. The title screen therefore retains the original Memonix artwork and coordinates while adapting the four historical game-selection windows to Mosaic, Instructions, Options and Credits. The replacement contents of the three non-Mosaic windows are composed only from recovered original Mosaic tiles. Bilingual labels and utility buttons are restoration overlays, not original Viewizard pixels.

## Reconstructed standalone artwork and audio

Options, record, instruction and credit panels remain code-drawn standalone restoration screens. Sound effects are procedural replacements. No original Memonix music or sound-effect files are redistributed.

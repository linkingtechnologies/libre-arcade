# Visual parity notes

## Historical coordinate model

The Memonix source renders to an 800×600 composition. The Mosaic board occupies a 512×512 area beginning at source coordinate `(44,44)`, with 64×64 cells. The restoration retains those source coordinates and scales the complete canvas responsively as one 4:3 surface.

## Original Mosaic tiles

The 50 original Mosaic tile bitmaps have been recovered from `gamedata.vfs` in `memonix_1.6_src.tar.bz2` and are included as lossless PNG conversions. This certifies the exact five colours, ten shapes, `_1 … _9, _0` suffix mapping, antialiasing, white outline and 64×64 proportions.

## Title/menu screen

The standalone title screen now uses the recovered original `DATA/mainmenu.jpg` asset.

The browser draws exactly the upper 800×600 viewport used by Memonix 1.6. This preserves the original:

- night-to-day background;
- moon, stars, sun, clouds and rainbow;
- central fantasy tower/character illustration;
- Memonix medallion/logo;
- four 128×128 game-window coordinates;
- lower two-row navigation geometry.

The historical suite placed Builder at `(176,66)`, Pair at `(496,66)`, Mosaic at `(56,255)` and Jigsaw at `(616,255)`. The standalone port keeps those coordinates but reassigns the four windows to:

- Instructions;
- Options;
- Mosaic / play;
- Credits.

The Mosaic window uses the recovered original `DATA/pr_m.bmp` preview (losslessly converted to PNG). The three reassigned windows are 2×2 compositions made solely from recovered original Mosaic tiles. Hover framing derives from recovered `DATA/main_game.bmp`, with its black colour-key translated to PNG transparency.

This is therefore a **faithful historical-layout adaptation**, not a claim that a standalone Mosaic menu existed in 2006.

## Remaining reconstructed shell

Bilingual labels, utility buttons, options/records/instructions/credits panels and procedural sounds are restoration-layer elements. They are intentionally distinguished from recovered Viewizard pixels in the source and documentation.

Accordingly this release claims:

- gameplay parity;
- original Mosaic tile-asset parity;
- original Memonix title-background parity;
- historical menu geometry parity;
- documented standalone adaptation where the original four-game selector had to be repurposed.

## Standalone home-screen adaptation

The original `mainmenu.jpg` remains byte-identical in the package and its historical 800×600 viewport is rendered without masking or repainting, including the embedded Viewizard copyright line. Modern restoration attribution is retained in Credits. The Credits screen exposes a clickable Libre Arcade link to `https://linkingtechnologies.github.io/libre-arcade/`.

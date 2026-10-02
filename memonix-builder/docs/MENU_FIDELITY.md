# Memonix title/menu fidelity

## Primary evidence

The original `src/menu.cpp` draws:

- `DATA/mainmenu.jpg` at `(0,0)` as an 800×600 viewport;
- Mosaic preview `pr_m.bmp` at `(56,255)`;
- **Builder preview `pr_b.bmp` at `(176,66)`**;
- Pair preview `pr_p.bmp` at `(496,66)`;
- Jigsaw preview `pr_j.bmp` at `(616,255)`;
- the four lower buttons at `(10,474)`, `(591,474)`, `(10,524)` and `(591,524)`.

The standalone restoration preserves those coordinates exactly.

## Assets

`assets/ui/original/mainmenu.jpg`
: Byte-identical copy of `DATA/mainmenu.jpg`. The 800×600 historical viewport is drawn untouched, including the embedded Viewizard copyright line.

`assets/ui/original/builder-preview.png`
: Lossless RGB conversion of `DATA/pr_b.bmp`. Pixel comparison against the recovered BMP is exact.

`assets/ui/original/mode-hover-frame.png`
: Conversion of `DATA/main_game.bmp`; the original black colour-key is represented as PNG transparency so the web renderer reproduces the intended overlay semantics.

Hashes and transformations are frozen in `assets/ui/original/menu-asset-manifest.json`.

## Standalone adaptations

The original title screen selected four suite modes. The Builder restoration is standalone, therefore:

- Builder remains in **its own historical window** at `(176,66)` and starts a Builder game;
- the Pair window `(496,66)` becomes Instructions;
- the Mosaic window `(56,255)` becomes Options;
- the Jigsaw window `(616,255)` becomes Credits;
- those three adapted windows are filled only with recovered Builder artwork, not invented game imagery;
- lower controls keep the historical button-row geometry but expose EN/IT, audio, Top Scores and New Game.

These mappings are deliberately documented as adaptations and are not claimed to be part of the 2006 UI.

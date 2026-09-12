# Asset provenance — working audit

## Preserved original material

The complete historical tree supplied by the user is preserved under `reference/54321-1.0.2001.11.16/`. The exact uploaded tar archive is additionally preserved under `reference/original-archive/` with a SHA-256 manifest.

## Runtime artwork currently reused

The browser restoration copies selected original PNGs into `public/src/assets/original/` for visual parity, including:

- Flip-Flop tiles;
- Bomb Squad tiles/bomb/flag;
- Maze Runner `unmarked`, `marked`, `goal`, `me`, and `wall0` through `wall7` layers;
- Peg Jumper `peg`, `hole`, `empty`, and `selected` layers;
- Tile Slider `centers.png` and `borders.png` sprite sheets;
- sidebar controls and victory/defeat overlays.

Peg Jumper starting-board payloads are also transcribed from the historical `.peg` files into `public/src/games/pegboards.js` for a no-build browser runtime; tests compare every embedded payload against `/reference`.

These files and payloads remain original third-party/historical material. Their presence in the browser build does **not** mean they have been relicensed as GPLv3.

Many game/UI images in the historical archive have corresponding GIMP `.xcf.gz` working files. Tile Slider is a particularly clear example: `images/tiles.xcf.gz` accompanies the derived `images/centers.png` and `images/borders.png`. This is useful project-local provenance evidence, but it does not by itself replace the unresolved global licensing analysis.

## Blue Vinyl font

The original credits thank Jess / Blue Vinyl Fonts. The historical archive contains `images/font.png`, but does not identify the precise source typeface or include that font's original license/readme.

The browser restoration therefore does **not** use `font.png` for newly rendered counters/help text. Browser/system fonts are used there instead. The historical bitmap remains preserved in `/reference` only.

## Third-party credit/logo images

Images such as `_bvfonts.png`, `_sdl.png`, `_png.png`, `_umlaut.png` and similar credit marks remain in `/reference` and are not copied into the browser runtime in this milestone.


## Reconstructed sound

No historical audio file is copied because the original contains no sound sample for movement. `code/soundDev.cpp` synthesizes the short ding procedurally. The browser reconstructs that behavior with a short Web Audio sine pulse and documents it as a faithful-source reconstruction rather than an original asset.

## Runtime integrity test

`test/runtime-assets.test.mjs` hashes every original PNG required by the browser UI and verifies it is byte-identical to the corresponding file under `/reference`. This prevents accidental retouching or replacement from being mislabeled as preserved artwork.

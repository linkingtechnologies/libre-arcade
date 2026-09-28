# Archaeology — Sliding Tile Puzzle

## Identity

Sliding Tile Puzzle is one of the three games distributed in **Virtual Toybox Puzzle Collection 2010.08.11** by Jonathan Hulka. It is implemented primarily by `SliderHandler.java` and `hulka.tilemanager.SquareTileManager.java`.

The original source headers state GNU GPL **version 3 or, at your option, any later version**.

## Original rules recovered from source

- A square grid contains one empty position.
- Only a tile orthogonally adjacent to the empty position may move.
- The clicked tile swaps with the empty position.
- Completion is detected when every tile is back at its original index.
- Once solved, the missing tile is drawn to reveal the complete picture.
- Clicking the solved puzzle shuffles it again.
- No timer or move counter is part of the 2010 game.

## Sizes

The 2010 new-puzzle dialog exposes values `8`, `15`, and `25` as "pieces". The code then computes:

`tilesAcross = (int)Math.sqrt(preferredSize + 1)`

therefore the actual grids are **3×3, 4×4 and 5×5**. The first two correspond to 8 and 15 visible tiles plus the blank; the 5×5 option has 24 visible tiles plus the blank despite the historical label `25 pieces`.

The restoration presents the unambiguous grid labels **3×3 / 4×4 / 5×5** while preserving the original layouts and mechanics.

## Shuffle algorithm

`SliderHandler.mix()` never generates an arbitrary permutation. It repeatedly:

1. moves the blank toward randomly ordered target cells using only legal slides;
2. makes one perpendicular legal slide to reduce immediate backtracking.

Thus shuffled boards are reachable from the solved state by construction.

The original contains `random.nextInt(1)*2 - 1`, which always evaluates to `-1` when the blank is not at an edge. This directional bias is intentionally preserved in the HTML5 port.

## Image geometry

`SquareTileManager` uses square tiles. For a rectangular photograph, the square puzzle region is centered in the image, leaving the non-square strips of the original photograph visible outside the puzzle region. This behavior is preserved.

## Preservation sources

Unmodified originals are under `/reference` with SHA-256 manifests. The ten photographs and thumbnails in the playable build are byte-identical to those in `puzzlegames.jar` and retain their separate JS Nature Photos / CC BY-SA attribution.

## Background color and tile relief

The original `pics.xml` stores a mean RGB value for every bundled photograph. `PuzzleCanvas.setMeanColor()` converts it to HSB, rotates the hue by 180°, uses full saturation and derives the board brightness from the source mean. The restoration ports this calculation and checks all ten bundled values against Java `Color.RGBtoHSB()` / `Color.getHSBColor()`.

For a user-selected image the 2010 new-puzzle dialog used neutral mean RGB `(128,128,128)`; the restoration preserves that default. The original **Puzzle → Color** command is represented by the web background color picker.

`PuzzleCanvas.buildTileImage()` also adds a one-pixel translucent highlight and shadow using translated masks. The HTML5 rendering reproduces that light top/left and dark bottom/right relief without changing the tile geometry.

## Accessibility-only input

The 2010 gameplay is mouse-click based. The HTML5 restoration additionally maps arrow keys to legal movements of the blank and guards touch input against accidental swipe activation. These are alternate input paths only: the board topology, legal move rule, shuffle and completion condition are unchanged.

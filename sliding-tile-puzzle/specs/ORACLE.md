# Behavioral oracle

Use the original `reference/puzzlegames.jar` as the primary oracle.

## Required parity checks

1. Start a Sliding Tile Puzzle with a bundled photograph.
2. Verify grids corresponding to the historical size choices: 3×3, 4×4, 5×5.
3. Click a tile not adjacent to the blank: nothing happens.
4. Click a tile adjacent to the blank: exactly that tile slides into the blank.
5. Continue until solved: the hidden final tile is displayed and the full image is visible.
6. Click the solved puzzle: it is shuffled again.
7. For a rectangular photograph, verify that the square tile region is centered while the remaining image strips stay visible.
8. Verify that a user-selected local image works without a server or upload.
9. Verify that the ten bundled photographs begin with the same background colors derived from the original `pics.xml` mean RGB values and `PuzzleCanvas.setMeanColor()`.
10. Verify the subtle light edge / dark edge bevel on each tile, matching the intent of `PuzzleCanvas.buildTileImage()`.
11. Verify that changing the background color changes the board/blank color but not puzzle state.
12. On touch, a small tap moves a legal tile; a swipe/drag does not accidentally trigger a move.
13. On keyboard, arrow keys move the blank through legal slides; Enter/Space reshuffle only after completion.
14. Verify IT/EN, gallery, preview, instructions and credits at desktop and mobile viewport sizes without page scrolling.

The HTML5 restoration deliberately omits timers, scoring, hints and move counters because they are not part of the recovered 2010 behavior.

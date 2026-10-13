# MilCity M6 — visual parity reconstruction

M6 keeps the M4/M5 simulation and J2ME flow, and reconstructs the in-game visual language from the 1.0.5 source and `res/images.png` without loading that original PNG in the browser runtime.

## Source-exact visual facts

- Runtime canvas is 240×320 portrait.
- Grid is 240×240, 30×30 cells, 8 px per cell.
- HUD is the lower 80 px and is filled `0xCCCCCC`.
- City view uses the image atlas for positive cell types and a magenta `0xBF00FE` one-pixel shield outline.
- Military view is deliberately flat-color: water blue, unknown ground black, hit red, destroyed green, Spy-discovered yellow, and fading greys for ordinary hit/miss information.
- Cursor is a one-pixel rectangle: green when the selected action is currently valid, red otherwise.
- The original atlas is 111×91. Glyphs are addressed on a 16-column 7×9 pitch; cell sprites begin at y=65 and are addressed on a 12-column 9×9 pitch.
- Cell IDs 30–34 are five sequential explosion frames; `GridView` advances them one frame per render and then changes the cell to destroyed.

## Browser policy

The historical ZIP remains under `reference/` for archaeology. The browser renderer does **not** import `images.png`, the Shiro logo, or the Koojoo splash. Their provenance is still YELLOW. Instead M6 draws small procedural pixel-art equivalents that preserve palette/function and multi-cell building composition without copying the original PNG bytes.

This is therefore **behavior/visual-language parity**, not a claim of pixel-identical artwork.

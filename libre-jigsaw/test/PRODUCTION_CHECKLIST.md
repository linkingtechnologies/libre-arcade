# Production checklist

## Ready in this candidate

- Public title is **Libre Jigsaw**; Sliding Tile Puzzle and Spinning Tile Puzzle are explicitly separate future restorations.
- Player-facing UI contains no archaeology/milestone controls.
- Original ten-photo gallery restored with original thumbnails.
- Full photographs and thumbnails are byte-identical to the 2010 JAR copies.
- JS Nature Photos attribution and CC BY-SA 3.0 US license are shipped.
- Local JPG/PNG/GIF/WebP import works through FileReader.
- Classic browser bundle works without ES-module imports and can run from `file://`.
- Square and hexagonal cuts, rotation, snapping, groups, three areas and rectangle multi-selection are implemented.
- Browser-native `.ljf` save/load preserves puzzle state and embeds personal images.
- Java-era `.ljf` files are detected and rejected clearly rather than misparsed.
- Solved puzzles are normalized upright and centered; interaction stops after completion.
- Resize and orientation changes preserve the exact logical puzzle; only a uniform viewport scale/letterbox transform changes.
- Save format v2 records the logical playfield; format-v1 Beta 2 saves remain readable.
- English/Italian UI and help/credits are present.
- Toolbar uses compact Game / Image / Puzzle / Menu groups; mobile opens full-width panels instead of horizontal overflow.
- Keyboard focus, translated ARIA labels, Escape-to-close menus and reduced-motion preference are covered.
- Desktop and 390 px mobile layouts keep the main page free of vertical scrolling.
- Geometry, historical parity, snapping, layer/selection, save/load, file-mode and production smoke tests pass.
- Original reference archives still match recorded SHA-256 hashes.

## Remaining before final production-ready sign-off

1. Run a longer human play-through on desktop and touch devices, including repeated group merges, all three areas, save/reopen mid-game, and completion.
2. Decide whether importing the historical Java `.ljf` format is a release requirement or a post-release preservation enhancement.
3. Human screen-reader spot check on at least one desktop and one mobile browser.

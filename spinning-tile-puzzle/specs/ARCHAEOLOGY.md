# Archaeology — Spinning Tile Puzzle

Source baseline: `reference/puzzlegames.jar`, Virtual Toybox Puzzle Collection **2010.08.11**.

Primary classes:
- `SpinnerHandler.java`
- `hulka/tilemanager/HexSpinnerManager.java`
- `hulka/tilemanager/HexTileManager.java`
- `PuzzleCanvas.java`

Verified rules:
- `HexSpinnerManager` is hard-coded to **7 tiles** and **6 vertices**.
- A spin affects exactly three tiles surrounding a vertex.
- A spin both moves the three tile identities and changes each moved tile orientation by two 60-degree rotation steps (120°).
- `SpinnerHandler.checkSolved()` requires `rotationCount == 0` and `originalTileIndex == location` for all seven locations.
- `SpinnerHandler.MIX_COUNT == 5`.
- Mix shuffles an array of seven indices and attempts all seven; index `6` is not a valid vertex and is intentionally a no-op. This historical quirk is preserved.
- Original help: click = clockwise; Shift+click = counter-clockwise.
- After a completed puzzle, clicking the board calls `mix()` and starts another puzzle.

The HTML5 port keeps game state independent of viewport size after creation: resize changes display scale only.

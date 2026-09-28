# M5 — layers and multi-selection parity

Primary oracle: `reference/puzzlegames.jar`, especially the embedded 2010 `JigsawHandler.java`, `gui.xml`, and `help/jigsaw.html`.

## Three layers

Virtual Toybox 2010 initializes every tile on layer 0 and exposes exactly three layers. `gui.xml` binds the `1`, `2`, and `3` accelerators to `setLayer(0..2)`.

`JigsawHandler.setLayer()` makes only the current layer interactive/visible. If a connected group is currently picked up, or if a multi-selection exists, all physical ConnectedSet groups represented by that selection are reassigned to the destination layer before redraw. Unselected groups stay on their existing layers.

M5 mirrors those invariants and also exposes a compact Layer selector for touch devices; keys 1/2/3 remain supported.

## Multi-selection

The 2010 help explicitly states that the user starts on empty space, drags a selection box over pieces, releases, and can then move the selected pieces together. It also explicitly states that selected pieces cannot be rotated.

The Java implementation keeps two separate structures:

- `connectedTiles`: physical puzzle connections created by snapping;
- `selectedTiles`: temporary groups chosen by the selection rectangle.

M5 preserves that distinction. Rectangle selection adds whole connected groups when any piece in them intersects the selection region. Moving a multi-selection translates all selected ConnectedSet groups without merging them, rotating them, or applying snap on release.

## M5 interaction oracle

1. New puzzle: all pieces are on Layer 1 (internal layer 0).
2. Switch to Layer 2 or 3 with no active selection: Layer 1 pieces disappear and the target layer is initially empty.
3. Drag-select across pieces on Layer 1: every touched connected group becomes highlighted and remains a separate physical group.
4. Drag any highlighted piece: all selected groups translate by the same delta.
5. Release a multi-selection: no snapping occurs and no groups merge.
6. Arrow keys and right-click do not rotate a highlighted selected group.
7. With a selection active, press `2`: all selected connected groups move to Layer 2 and remain selected there; unselected pieces remain on Layer 1.
8. While dragging one ordinary connected group, press `3`: that group moves to Layer 3 and the drag continues there.
9. Click a non-selected piece: the previous multi-selection clears and normal single-group dragging resumes.
10. Selection state never changes the underlying `group` identifiers unless an ordinary snap occurs later.

# Memonix: Pair — Behavioral Oracle

This oracle freezes the behavior of the original Memonix 1.6 Pair mode before the HTML5 port.

## Setup
- Type = 2 (`Pair`).
- Grid sizes: 2x2, 4x4, 6x6, 8x8.
- Exactly 3 difficulties (0, 1, 2).
- Preview/countdown is shared with the other Memonix modes. Countdown defaults to 30 s and may be disabled.
- Gameplay timer begins only when preview ends or the player presses Start.

## Deck generation
- 71 distinct face textures are available: `toys-001.bmp` ... `toys-072.bmp`, with `toys-015.bmp` absent.
- Faces are selected without duplication for a board.
- Difficulty 0 on grids larger than 2x2 uses FOUR copies of each chosen symbol.
- Difficulty 0 on 2x2, and all sizes on difficulties 1/2, use normal PAIRS.
- Placement uses repeated random coordinate selection until an empty cell is found; it is not Fisher-Yates.

## Interaction
1. First click reveals one hidden card and stores its face as `SearchFor`.
2. Second different card: both remain visible for ~500 ms, then close.
3. Second matching card: both remain visible for ~500 ms, then the selected two cells are removed (`-1`).
4. In difficulty 0 with four identical copies, a match removes only the two selected cards, not all four copies.
5. Input is locked during the 500 ms match/mismatch delay.

## Hard difficulty
- Difficulty 2 has the defining historical penalty: after ANY mismatch, `FieldData` is restored from the original backup and all `SetFieldData` cells are cleared.
- Therefore every pair previously completed comes back into play.

## Victory and score
- Victory occurs when `SetFieldData` and `FieldData` are identical over the entire 8x8 backing matrix.
- Completed/removed cells are `-1` in both arrays. Inactive cells are `0` in both arrays.
- Score is elapsed gameplay time in whole seconds; lower is better.
- Pair score slots are 10, 11, 12 for difficulties 0, 1, 2.
- Records are stored globally and separately for 2x2/4x4/6x6/8x8.
- Winner dialog: `New` generates another board using the same settings; `Menu` returns to the suite menu.

## Minimum parity test set
- D0 4x4: exactly 4 symbols x4 cards. Match two identical cards and verify two identical copies remain.
- D1 4x4: 8 symbols x2 cards. Mismatch closes only the current two; earlier matches remain removed.
- D2 4x4: complete one pair, then deliberately mismatch; verify the completed pair returns.
- 2x2 D0: verify it uses 2 symbols x2 cards, not one symbol x4.
- Preview: verify all active faces are visible before gameplay and timer starts only after Start/countdown.
- Win: verify lowest time record updates for the selected size/difficulty only.

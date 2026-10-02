# Builder behavioral oracle

- Target generation: choose GameMask 0..10 different from previous; generate full 8×8; crop after generation.
- Preview: show complete FieldData during countdown; Start begins GameTime.
- Play: SetFieldData begins empty; inactive/zero cells are not targets.
- Palette categories: windows, walls, doors, roof.
- Inventory: CheckList(type) = target multiplicity - placed multiplicity - currently dragged copy.
- Placement: drag palette→grid; drag grid→grid; right-click clears; drop outside removes dragged piece.
- Mist: D0–D2 only; hovering reveals all wrong non-empty cells.
- D4: wrong non-empty cell → error marker ~500 ms → clear all SetFieldData.
- Win: every SetFieldData cell equals FieldData; best time is minimum seconds per difficulty+size.
- Reset/New: enters GameStart and regenerates target; immediate structural-template repetition forbidden.
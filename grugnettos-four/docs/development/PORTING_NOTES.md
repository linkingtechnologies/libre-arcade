# Porting notes — Fourrow → ConnectLab

## What is preserved

- 7×6 board.
- Red human / black CPU semantics inside the historical adapter.
- Six Childsplay difficulty numbers, including the duplicate L3/L4 behaviour.
- Random-move rates: L1 all random; L2 1/4 forced random; L3/L4 1/7 forced random.
- L5 look-ahead 1, no forced-random branch.
- L6 look-ahead 2, no forced-random branch.
- Random tie-breaking among equally scored moves.
- Special first CPU move on L3–L6: choose zero-based column 3 or 4 if legal.
- Python 2 integer-division behaviour in recursive scoring.
- First immediate winning candidate short-circuits later candidate evaluation.

## What is deliberately not ported in M0

- Childsplay profile/database integration.
- Pygame sprites and animations.
- Original media files.
- Childsplay score display / dead tie-score branch.
- Main menu / six-level selector UI.

## ConnectLab integration

The previously defined ConnectLab player contract is compatible conceptually with this package:

`{ id, name, source, license, create(options), chooseMove(position, context) }`

The drop-in module exposes `childsplayFourrowPlayer.create({ level, rng })` and returns an object with `chooseMove(position, context)` plus `reset()`.

One small glue mapper may still be required because the current ConnectLab repository artifact was not available in the Library during M0. This package intentionally does not guess ConnectLab's current board representation.

## RNG note

The original game did not expose deterministic seeds. ConnectLab should inject its seeded RNG through `create({rng})` or `context.rng`. This preserves the historical probability rules while making Arena runs reproducible. It does **not** claim seed-for-seed equality with Python 2's Mersenne Twister stream.

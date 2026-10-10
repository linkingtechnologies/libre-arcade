# PetterS MCTS source record

- Repository: `https://github.com/PetterS/monte-carlo-tree-search.git`
- Preserved commit: `52a6208afc4e697bb4e44c12b98cf022a5500516`
- Commit date: 2020-11-15
- License: MIT
- Primary author: Petter Strandmark

The upstream project describes itself as merged into Monolith and no longer maintained. The complete Git snapshot at the commit above is preserved in `original/`; no network access is required to inspect or test the reference implementation.

The ConnectLab port uses `mcts.h` for the generic search and `games/connect_four.{h,cpp}` for the game-state semantics. See `PORTING_NOTES_PETTERS_MCTS.md` at the project root for the exact compatibility boundary.

# Pascal Pons solver porting notes

## Preserved

- 7×6 board encoded in 49 bits, with one sentinel bit per column;
- `mask` plus current-player position representation and additive key;
- bitwise winning-position calculation in four directions;
- immediate winning move detection;
- forced-block and non-losing-move filtering;
- center-first column order with winning-spot move scoring;
- negamax alpha-beta search and transposition reuse;
- strong score semantics: sign gives outcome and magnitude rewards earlier wins;
- weak solve semantics: exact win/draw/loss classification.

JavaScript `BigInt` is used because ordinary JavaScript bitwise operators truncate to 32 bits. `test/pons-parity.mjs` compiles the preserved C++ implementation and compares position keys, legal/winning moves and exact per-column scores on five late-game positions.

## Browser boundary

The upstream executable can use a large fixed transposition table and an optional opening book. ConnectLab ships no external opening-book binary. Its UI adapter limits explored nodes and always handles immediate wins and forced blocks before searching. This prevents an early-game exact solve from blocking the single browser thread.

The underlying `PonsSolver` remains capable of exact solving when allowed to finish, and exact late-game results are oracle-tested. A budget-limited decision is deliberately marked with `exact: false`; the UI player must not be described as perfect or unbeatable from every opening position.

## License boundary

The original and derived player module are AGPL-3.0-or-later. They are compatible with GPLv3 under GPLv3 section 13, but they are not relicensed as plain GPLv3. Source, attribution and the AGPL license must remain available when the module is conveyed or offered over a network.

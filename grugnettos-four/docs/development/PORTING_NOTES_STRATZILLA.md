# Stratzilla porting notes

Preserved without algorithmic improvement:

- bottom-up 6×7 C++ board representation;
- computer player `2` as maximizing side;
- alpha-beta bounds and left-to-right column order;
- strict score comparisons, therefore first-best tie-breaking;
- heuristic weights `+500001`, `+5000`, `+500`, `−501`, `−5001`, `−500000`;
- the historical depth/remaining-turn terminal expression;
- all original win checks and scoring windows.

Adapter-only changes:

- conversion from the neutral ConnectLab board;
- acting side always mapped to historical computer `2`;
- optional node counter;
- synchronous browser execution;
- no terminal input/output.

## Historical no-column guard

The original can return column `-1` when the requested depth is greater than or equal to the remaining number of cells, or when every candidate retains the initial `INT_MIN` value under its strict comparison. This can feed an invalid column to the original `makeMove()`. ConnectLab leaves `stratzillaMiniMax()` unchanged and parity-tested. The outer adapter alone detects `-1`, repeats the same historical search with a depth below the remaining-cell boundary, then uses the first legal column in the historical left-to-right order if no column is assigned. Such decisions report `adapterFallback: true` in Arena traces.

The parity test compiles the unmodified original `source.cpp` inside a C++ harness and compares board score, win detection, minimax value and selected column across four fixtures and depths 1–5.

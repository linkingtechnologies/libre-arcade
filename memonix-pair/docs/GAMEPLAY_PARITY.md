# Gameplay parity status

Implemented from the original C++ behavior:

- centered active boards: 2×2, 4×4, 6×6, 8×8;
- 71 unique face assets (`001..072`, with historical `015` gap) plus original back;
- D0: 2 copies on 2×2, 4 copies per symbol on 4×4/6×6/8×8;
- D1: standard pairs;
- D2: standard pairs, but a mismatch restores all cards, including already completed pairs;
- correct and incorrect second selections remain visible for about 500 ms;
- preview precedes play and the game timer starts only when play starts;
- low completion time is the record, separately by size and difficulty.

The standalone service screens and bilingual controls are documented preservation-layer adaptations; the gameplay rules above are source-faithful.

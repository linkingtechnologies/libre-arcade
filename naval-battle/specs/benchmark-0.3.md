# BattleLab 0.3 deterministic benchmark

Configuration:

- board: 10x10;
- fleet: `5,4,3,3,2`;
- 1,000 games per pair;
- starting seat alternated;
- deterministic BattleLab seeds;
- Warboats preserves its original `RNG()` range mapping but not a specific libc `rand()` sequence;
- a detected historical Warboats infinite-selection loop is recorded as an **AI stall**, not silently repaired.

Selected results from `arena/warboats-round-robin-1000.json`:

| A | B | A wins | B wins | stalls | Result |
| --- | --- | ---: | ---: | ---: | --- |
| Random | OS4 2009 | 107 | 893 | 0 | OS4 89.3% |
| Random | Warboats L1 | 505 | 495 | 0 | effectively random |
| Random | Warboats L2 | 13 | 983 | 4 (L2) | L2 98.7% of completed games |
| Random | Warboats L3 | 15 | 985 | 0 | L3 98.5% |
| Random | Warboats L4 | 0 | 1000 | 0 | L4 100% |
| OS4 2009 | Warboats L2 | 184 | 813 | 3 (L2) | L2 81.5% of completed games |
| OS4 2009 | Warboats L3 | 184 | 816 | 0 | L3 81.6% |
| OS4 2009 | Warboats L4 | 54 | 946 | 0 | L4 94.6% |
| Warboats L2 | Warboats L3 | 457 | 538 | 5 (L2) | L3 54.1% of completed games |
| Warboats L2 | Warboats L4 | 266 | 732 | 2 (L2) | L4 73.3% of completed games |
| Warboats L3 | Warboats L4 | 349 | 650 | 1 (L3) | L4 65.1% of completed games |

These numbers measure the preserved decision logic under BattleLab's deterministic environment. They are not claimed to reproduce the exact win rates of the original 2009 executable on a particular C library RNG.

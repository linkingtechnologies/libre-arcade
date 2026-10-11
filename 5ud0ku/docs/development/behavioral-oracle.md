# 5ud0ku 1.8 — M2 Behavioral Oracle

## Scope

This milestone exercises the original 5ud0ku 1.8 algorithmic core recovered from `5ud0ku.src.zip`. No HTML5 port code is involved. The QA harness compiles the original `Grid`, `GridCreator`, `GridSolver`, `BruteForceSolver`, `Solver`, `GridSlot`, `Position`, and `AbortableTask` classes unchanged. A tiny test-only `Dict.getString()` stub replaces the J2ME localization/RMS dependency; it does not participate in puzzle generation or solving.

## Determinism model

- Original 5ud0ku does **not** expose a seed. Its two `java.util.Random` instances are normally time-seeded.
- `GridCreator` owns the RNG used for diagonal-box initialization, symmetry choice, and removal positions.
- `Grid` owns a separate RNG used by `randomizeDigits()` after puzzle selection.
- The oracle therefore injects two seeds by reflection: `creatorSeed` and `digitSeed`. This changes only RNG initialization, not algorithmic code.
- Hard mode normally selects the best of up to 3 successfully generated candidates, with a 15-second wall-clock timeout. To make QA deterministic, the oracle preserves the default 3-candidate comparison but disables the timeout.

## Generated puzzle oracles

| Level | creatorSeed | digitSeed | attempts | successful candidates | givens | initial singles | backtracking depth | solutions |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| easy | 1801 | 91801 | 1 | 1 | 40 | 22 | 1 | 1 |
| normal | 1802 | 91802 | 1 | 1 | 32 | 16 | 1 | 1 |
| hard | 1803 | 91803 | 5 | 3 | 25 | 4 | 2 | 1 |

All three generated oracles were rerun and produced byte-identical `GEN` records.

### Easy

Requested level: `easy`  
Creator seed: `1801`  
Digit-randomization seed: `91801`  
Actual givens: `40`  
Solution count: `1`  
Backtracking depth recorded by original solver: `1`

Pre-randomization puzzle:
```text
750208060
394105708
086490000
129856040
008300002
460709500
030001900
900600003
040070010
```

Pre-randomization solution:
```text
751238469
394165728
286497135
129856347
578314692
463729581
632581974
917642853
845973216
```

Final puzzle after original `Grid.randomizeDigits()`:
```text
810603070
294501803
037490000
569317040
003200006
470809100
020005900
900700002
040080050
```

Final solution:
```text
815623479
294571863
637498521
569317248
183254796
472869135
726135984
958746312
341982657
```

Removed positions: `r1c3, r1c5, r1c7, r1c9, r2c5, r2c8, r3c1, r3c6, r3c7, r3c8, r3c9, r4c7, r4c9, r5c1, r5c2, r5c5, r5c6, r5c7, r5c8, r6c3, r6c5, r6c8, r6c9, r7c1, r7c3, r7c4, r7c5, r7c8, r7c9, r8c2, r8c3, r8c5, r8c6, r8c7, r8c8, r9c1, r9c3, r9c4, r9c6, r9c7, r9c9`

### Normal

Requested level: `normal`  
Creator seed: `1802`  
Digit-randomization seed: `91802`  
Actual givens: `32`  
Solution count: `1`  
Backtracking depth recorded by original solver: `1`

Pre-randomization puzzle:
```text
010005009
080190000
502086401
258000600
000000000
006000372
401950803
000063050
700800040
```

Pre-randomization solution:
```text
614235789
387194265
592786431
258379614
173642598
946518372
461957823
829463157
735821946
```

Final puzzle after original `Grid.randomizeDigits()`:
```text
040003006
090460000
301098704
139000800
000000000
008000251
704630902
000082030
500900070
```

Final solution:
```text
847123596
295467183
361598724
139256847
452871369
678349251
784635912
916782435
523914678
```

Removed positions: `r1c1, r1c3, r1c4, r1c5, r1c7, r1c8, r2c1, r2c3, r2c6, r2c7, r2c8, r2c9, r3c2, r3c4, r3c8, r4c4, r4c5, r4c6, r4c8, r4c9, r5c1, r5c2, r5c3, r5c4, r5c5, r5c6, r5c7, r5c8, r5c9, r6c1, r6c2, r6c4, r6c5, r6c6, r7c2, r7c6, r7c8, r8c1, r8c2, r8c3, r8c4, r8c7, r8c9, r9c2, r9c3, r9c5, r9c6, r9c7, r9c9`

### Hard

Requested level: `hard`  
Creator seed: `1803`  
Digit-randomization seed: `91803`  
Actual givens: `25`  
Solution count: `1`  
Backtracking depth recorded by original solver: `2`

Pre-randomization puzzle:
```text
000302000
020000100
009070503
200030050
005840900
300006000
034060070
000900400
002000001
```

Pre-randomization solution:
```text
586312749
723495186
419678523
248139657
165847932
397256814
934561278
871923465
652784391
```

Final puzzle after original `Grid.randomizeDigits()`:
```text
000704000
040000100
006030807
400070080
008920600
700005000
072050030
000600200
004000001
```

Final solution:
```text
895714326
347268195
216539847
429176583
158923674
763485912
672851439
931647258
584392761
```

Removed positions: `r1c1, r1c2, r1c3, r1c5, r1c7, r1c8, r1c9, r2c1, r2c3, r2c4, r2c5, r2c6, r2c8, r2c9, r3c1, r3c2, r3c4, r3c6, r3c8, r4c2, r4c3, r4c4, r4c6, r4c7, r4c9, r5c1, r5c2, r5c6, r5c8, r5c9, r6c2, r6c3, r6c4, r6c5, r6c7, r6c8, r6c9, r7c1, r7c4, r7c6, r7c7, r7c9, r8c1, r8c2, r8c3, r8c5, r8c6, r8c8, r8c9, r9c1, r9c2, r9c4, r9c5, r9c6, r9c7, r9c8`

## Solver behavioral fixtures

The following fixtures are QA inputs, not historical puzzles shipped with 5ud0ku. They are used to exercise the original custom-puzzle path (`checkForRules()` + `BruteForceSolver`, capped at two solutions).

| Case | givens | simple rules | solutions returned | expected behavior |
|---|---:|---|---:|---|
| very_easy | 80 | true | 1 | unique; solve immediately |
| easy | 30 | true | 1 | unique |
| medium | 36 | true | 1 | unique |
| hard | 17 | true | 1 | unique; expensive for row-order brute force |
| almost_complete | 80 | true | 1 | unique |
| unique | 28 | true | 1 | unique |
| multiple | 77 | true | 2 | stop at two solutions |
| impossible | 30 | true | 0 | passes local rules but has no solution |
| contradictory | 2 | false | 0 | rejected by simple-rule precheck |
| empty | 0 | true | 2 | valid input; solver stops after finding two solutions |

### very_easy
Puzzle:
```text
534678912
672195348
198342567
859761423
426853791
713924856
961537284
287419635
345286170
```

Solution 1:
```text
534678912
672195348
198342567
859761423
426853791
713924856
961537284
287419635
345286179
```


### easy
Puzzle:
```text
200080300
060070084
030500209
000105408
000000000
402706000
301007040
720040060
004010003
```

Solution 1:
```text
245981376
169273584
837564219
976125438
513498627
482736951
391657842
728349165
654812793
```


### medium
Puzzle:
```text
000260701
680070090
190004500
820100040
004602900
050003028
009300074
040050036
703018000
```

Solution 1:
```text
435269781
682571493
197834562
826195347
374682915
951743628
519326874
248957136
763418259
```


### hard
Puzzle:
```text
000000010
400000000
020000000
000050407
008000300
001090000
300400200
050100000
000806000
```

Solution 1:
```text
693784512
487512936
125963874
932651487
568247391
741398625
319475268
856129743
274836159
```


### almost_complete
Puzzle:
```text
534678912
672195348
198342567
859761423
426853791
713924856
961537284
287419635
345286170
```

Solution 1:
```text
534678912
672195348
198342567
859761423
426853791
713924856
961537284
287419635
345286179
```


### unique
Puzzle:
```text
000000907
000420180
000705026
100904000
050000040
000507009
920108000
034059000
507000000
```

Solution 1:
```text
462831957
795426183
381795426
173984265
659312748
248567319
926178534
834259671
517643892
```


### multiple
Puzzle:
```text
534008912
672195348
198342567
859001423
426853791
713924856
961537284
287419635
345286179
```

Solution 1:
```text
534678912
672195348
198342567
859761423
426853791
713924856
961537284
287419635
345286179
```

Solution 2:
```text
534768912
672195348
198342567
859671423
426853791
713924856
961537284
287419635
345286179
```


### impossible
Puzzle:
```text
130070000
600195000
098000060
800060003
400803001
700020006
060000280
000419005
000080079
```


### contradictory
Puzzle:
```text
550000000
000000000
000000000
000000000
000000000
000000000
000000000
000000000
000000000
```


### empty
Puzzle:
```text
000000000
000000000
000000000
000000000
000000000
000000000
000000000
000000000
000000000
```

Solution 1:
```text
123456789
456789123
789123456
214365897
365897214
897214365
531642978
642978531
978531642
```

Solution 2:
```text
123456789
456789123
789123456
214365897
365897214
897214365
531642978
648971532
972538641
```

## Important parity findings

1. **Difficulty is assigned from the requested target, not recomputed from final givens.** The deterministic Hard oracle requests target 23 but finishes with 25 givens and remains a Hard game.
2. **Hard selection is partly time-dependent in the original UI.** Default settings are 3 successful candidates and a 15-second timeout. Slow J2ME devices could stop before three candidates, so strict final-board reproducibility across hardware was never guaranteed.
3. **The mixed solver metric is not a step counter.** `backTrackingDepth` is recorded; the original source does not expose total recursion nodes/steps for the brute-force custom-puzzle solver. The oracle therefore does not invent a “steps” metric.
4. **Multiple-solution handling is intentionally capped at two.** This is sufficient to distinguish unique from non-unique puzzles and is a deliberate low-resource optimization.
5. **An impossible puzzle can pass the simple-rule precheck.** The `impossible` fixture has no immediate candidate contradiction, passes `checkForRules()`, and only the brute-force search proves that it has zero solutions.
6. **An empty board is accepted by the algorithmic custom-puzzle path.** It passes simple rules and the solver quickly returns two solutions, which the UI can classify as non-unique.

## M2 result

**PASS.** The original generator and solver now have deterministic, machine-readable behavioral oracles. This is sufficient to compare a future JavaScript core against original 1.8 behavior without relying on visual similarity.

## Recommended next gate (M3)

Run the original MIDlet under MicroEmulator/FreeJ2ME and capture end-to-end behavior for New Game, custom puzzle, pencil marks, undo/redo, hint, check, save/load, autosave, and pointer input. This will bridge the verified algorithmic core to actual UI/state behavior before any HTML5 implementation begins.

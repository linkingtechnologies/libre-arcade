# 5ud0ku 1.8 — M5 Performance and J2ME Constraints Audit

## Scope

This audit measures or derives the resource profile of the recovered 5ud0ku 1.8 sources and released 63,862-byte JAR. It does **not** modernize generator or solver behavior. Timing figures are from OpenJDK 21 on the current analysis host and are comparative only; they are not claims about 2006 handset timings.

## Distribution footprint

Released standard JAR: **63,862 bytes**.

| Payload | Entries | Uncompressed bytes | ZIP-compressed bytes |
|---|---:|---:|---:|
| classes | 45 | 107,559 | 49,159 |
| PNG images | 9 | 4,885 | 4,885 |
| localization (`dict_en`, `dict_de`, `lang`) | 3 | 8,256 | 3,927 |
| manifest | 1 | 447 | 261 |

The recovered source tree contains 32 Java files (10,521 physical lines); the historical Ant log says the release build compiled 28 source files and ProGuard reduced 44 program classes to 43 after shrinking. The standard binary remains just below 64 KiB.

## Historical build constraints

The recovered `building.txt` records:

- Eclipse 3.1 + EclipseME;
- Antenna 0.9.13;
- Sun Wireless Toolkit 2.2;
- CLDC 1.0 for the external build;
- MIDP 2.0 API used during build, while JAD/manifest deliberately advertise MIDP 1.0;
- ProGuard 3.4 shrinking/optimization/obfuscation;
- Nokia API on the build classpath.

The authors explicitly relied on runtime capability detection. This explains why a MIDP-1.0 advertised application can contain optional pointer/full-screen behavior.

## Persistent data representation

### Cell state

Each `GridSlot` contains only:

- `byte shown`;
- `byte answer`;
- `boolean originalDigit`;
- `int pencilMarks`.

The 9 pencil marks are a bit mask in one 32-bit integer rather than nine objects/booleans/arrays.

Raw field payload lower bound (ignoring VM object headers/alignment): **7 bytes per cell**, or **567 bytes for 81 cells**.

### Save format

A saved grid uses:

- 81 bytes: one compact byte per cell;
- 8 bytes: elapsed time;
- modified-UTF game type;
- sparse pencil-mark stream;
- one `110` terminator byte.

With no pencil marks, an `easy`/`hard` save is **96 bytes** (`normal` is 98 bytes). The theoretical worst case with all 729 pencil marks present is about **834–836 bytes**, still below 1 KiB. M3 observed a representative in-progress save of 288 bytes.

### Undo/redo

`MoveStack` uses a fixed 100-entry ring. Each logical move stores four bytes plus one boolean payload (`row`, `col`, `oldValue`, `newValue`, `pencilMode`). Because `startPos == endPos` is also the sentinel, effective undo capacity is 99 moves.

## Allocation behavior

The long-lived board is compact; temporary solving is allocation-heavy.

A source-level instrumentation build was created separately from the originals and verified against the same deterministic M2 seeds. Counters do not alter decision logic.

### Deterministic generator profiles

| Case | Wall time* | Grid constructors | Grid clones | GridSlot constructions | Position constructions | uniqueness checks | mixed guess calls | max mixed depth | brute-force recursion calls |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Easy seed 1801 | 8.60 ms | 15 | 14 | 2,349 | 522 | 4 | 4 | 1 | 145 |
| Normal seed 1802 | 5.97 ms | 33 | 31 | 5,184 | 1,022 | 8 | 10 | 2 | 1,278 |
| Hard selection seed 1803 | 25.86 ms | 797 | 792 | **128,709** | 7,459 | 77 | 483 | 10 | 1,622 |

\* Modern OpenJDK 21 host; comparative only.

The very high `GridSlot` count is explained by `Grid.clone()`: `new Grid(type)` first creates 81 slots, then the clone loop replaces all 81 with newly allocated slots. Therefore every clone allocates **162 GridSlot objects**, half of which become immediately unreachable. This is an authentic source-level inefficiency and a major source of temporary garbage.

## Timing distribution on a modern JVM

Original unmodified algorithmic classes, after warm-up:

| Mode | N | mean | median | p95 | attempts mean | observed givens | max selected backtracking depth |
|---|---:|---:|---:|---:|---:|---|---:|
| Easy | 50 | 0.907 ms | 0.523 ms | 2.851 ms | 1.94 | 37–40 | 1 |
| Normal | 50 | 1.018 ms | 0.812 ms | 2.567 ms | 2.30 | 30–34 | 2 |
| Hard (best of 3 successes) | 30 | 9.434 ms | 9.449 ms | 12.812 ms | 6.60 | 24–33 | 8 |

These values quantify relative cost only. They must **not** be projected onto Nokia-era CPUs.

## Small-heap stress observation

The original algorithmic core completed the full 50/50/30 benchmark under an OpenJDK `-Xmx4m` heap. It failed to initialize the modern JVM at `-Xmx2m` before application execution. This does not establish a historical Java ME heap requirement because HotSpot/G1 has very different runtime overhead, but it supports the source analysis: the live working set is small while allocation churn is high.

With a 4 MiB HotSpot heap the run caused frequent garbage collection, consistent with the clone profile. This is diagnostic evidence of allocation pressure, not a simulation of a 2006 VM.

## Custom-puzzle BruteForceSolver risk

`BruteForceSolver` is deliberately simple: row-major recursion, candidates 1→9, stop after one or two solutions depending on mode. It does not use the mixed single/hidden-single strategy.

Instrumented oracle fixtures:

| Fixture | Solutions | modern time* | recursive calls |
|---|---:|---:|---:|
| easy | 1 | 3.03 ms | 2,967 |
| unique | 1 | 4.15 ms | 29,572 |
| multiple | 2 | 0.71 ms | 160 |
| empty | 2 | 0.45 ms | 526 |
| hard17 | 1 | **4,652 ms** | **108,422,935** |

\* Modern OpenJDK 21 host.

This is the main performance risk for a faithful browser port. Replacing it with a faster solver would change historical behavior/order. The appropriate preservation strategy is to retain the algorithm but execute custom-puzzle solving in a **Web Worker**, with an abort/cancel path mirroring `AbortableTask`.

## J2ME-oriented design choices worth preserving

1. Primitive `byte` values for digits, positions, and move data.
2. Pencil marks packed into an `int` bit mask.
3. Save records typically measured in hundreds of bytes.
4. Fixed-size undo ring rather than an unbounded history.
5. Early stop after a second solution when testing non-uniqueness.
6. Generated-grid solver starts with the known solution, so uniqueness checking only needs to discover one different solution.
7. Hard creation is bounded by candidate count and a wall-clock timeout in the UI task.
8. ProGuard shrinking/optimization was essential to the distribution target.

## Performance conclusion

5ud0ku's persistent model is exceptionally compact. Its cost is concentrated in **temporary clone/Vector/Position allocation** and, for manually entered pathological puzzles, in the intentionally naive `BruteForceSolver`. This resource profile is itself part of the archaeological value of the project.

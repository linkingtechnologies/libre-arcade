# Visual fidelity notes

## Historical observations

The 1.01 source establishes the rendering palette and geometry directly in `DfConstants.py`, `DfWorld.py`, `DfDisk.py`, `DfObjects.py`, and `DfSplash.py`.

The surviving PyWeek title screenshot shows:

- 800 × 600 presentation;
- `#cccc00`-like yellow field;
- 16 px black outer border;
- large black title near the top;
- vertically stacked menu choices;
- rotating quartered black/white disk to the left of the selected choice.

The level-11 screenshot confirms the in-game visual language:

- no textured background;
- dense 40 px vector grid;
- red controllable vectors and blue fixed vectors;
- black obstacle bars;
- red/black goal disk;
- black/white player disk.

## M2 renderer mapping

| Historical element | M2 implementation |
| --- | --- |
| Ground | Canvas fill `#cccc00` |
| Outer border | four 16 px black rectangles |
| Walls | black Canvas rectangles |
| Killer walls | red Canvas rectangles |
| Disk / menu cursor | four alternating black/white quarter wedges |
| Goal | four alternating black/red quarter wedges |
| Black hole | black circle, radius 16 |
| White-hole exit | white circle, radius 16 |
| Vector arrows | historical four-point line-strip geometry |
| Fixed/rotatable mixture | historical red→blue color equation |
| Pause | 30% white overlay + black centered label |
| Level preview | 360 × 270, moving environment only, arrow width halved |

## Non-goals for M2

M2 does not imitate `MAKISUPA.TTF` by embedding or tracing it. It also does not recreate the historical music or samples. Both choices are intentional consequences of the asset audit.

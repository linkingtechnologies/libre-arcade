## Scenario runs

| Scenario | Frames | Player x range | Player y range | Original vs restored | Checks |
|---|---|---|---|---|---|
| `level1` | 614 | 150 to 1991 | 450 to 793 | identical | 3/3 pass |
| `level2` | 1681 | 150 to 1991 | 300 to 1773 | identical | 6/6 pass |
| `level3` | 2026 | 150 to 3815 | 420 to 2963 | identical | 7/7 pass |
| `level4` | 3132 | 65 to 2515 | 450 to 2903 | identical | 9/9 pass |
| `fuzz-level1` | 1502 | 15 to 745 | 391 to 583 | identical | n/a |
| `fuzz-level2` | 1502 | 15 to 297 | 688 to 793 | identical | n/a |
| `fuzz-level3` | 1502 | 15 to 803 | 1668 to 1983 | identical | n/a |
| `fuzz-level4` | 1502 | 15 to 827 | 2788 to 2963 | identical | n/a |

## Checks

| Level | Check | Frame | Original | Restored |
|---|---|---|---|---|
| `level1` | water powergem acquired with Z | 143 | pass | pass |
| `level1` | water blocks removed by water element | 504 | pass | pass |
| `level1` | exit star leads to level2 | 709 | pass | pass |
| `level2` | water powergem acquired with Z | 143 | pass | pass |
| `level2` | wrong element does not remove earth blocks | 504 | pass | pass |
| `level2` | water blocks removed by water element | 865 | pass | pass |
| `level2` | earth powergem acquired with Z | 1210 | pass | pass |
| `level2` | earth blocks removed by earth element | 1571 | pass | pass |
| `level2` | exit star leads to level3 | 1776 | pass | pass |
| `level3` | water powergem acquired with Z | 143 | pass | pass |
| `level3` | water blocks removed by water element | 504 | pass | pass |
| `level3` | earth powergem acquired with Z | 849 | pass | pass |
| `level3` | earth blocks removed by earth element | 1210 | pass | pass |
| `level3` | fire powergem acquired with Z | 1555 | pass | pass |
| `level3` | fire blocks removed by fire element | 1916 | pass | pass |
| `level3` | exit star leads to level4 | 2121 | pass | pass |
| `level4` | water powergem acquired with Z | 143 | pass | pass |
| `level4` | water blocks removed by water element | 504 | pass | pass |
| `level4` | earth powergem acquired with Z | 849 | pass | pass |
| `level4` | earth blocks removed by earth element | 1210 | pass | pass |
| `level4` | fire powergem acquired with Z | 1555 | pass | pass |
| `level4` | fire blocks removed by fire element | 1916 | pass | pass |
| `level4` | air powergem acquired with Z | 2261 | pass | pass |
| `level4` | air blocks removed by air element | 2622 | pass | pass |
| `level4` | exit star shows the YOU WIN! end screen | 3127 | pass | pass |

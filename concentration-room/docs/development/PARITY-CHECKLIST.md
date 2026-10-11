# Concentration Room 0.02 → HTML5 parity checklist

| Area | Status | Oracle / note |
|---|---|---|
| Official 0.02 archive preserved | PASS | immutable ZIP + SHA-256 in `/reference` |
| GPL-3.0-or-later code baseline | PASS | archive source headers / GPL text |
| 10/20/36/52/72-card masks | PASS | `shuffle.s` |
| CRC PRNG seed/bit routine | PASS | `shuffle.s` |
| Historical non-Fisher-Yates deal | PASS | deterministic frozen vectors |
| Shared PRNG across deal/AI/B-random | PASS | `shuffle.s`, `aidiocy.s`, `memorygame.s` |
| Solitaire miss budgets | PASS | 20/40/60/80/100 |
| 2P score and early majority win | PASS | `memorygame.s` |
| Match retains turn | PASS | `memorygame.s` |
| Mismatch passes turn | PASS | `memorygame.s` |
| Two physical/logical pads | PASS | browser keyboard mappings + `activePad` |
| A+B controller claim | PASS | pad 2→pad 1 scan order preserved |
| Direction DAS/autorepeat | PASS | delay 15, speed 3 |
| B/random cursor | PASS | exact present-card mapping + shared PRNG |
| Flip timing | PASS | 5-frame animation |
| Mismatch hold/unflip | PASS | 90 hold + 6-frame second tail |
| Pair collection | PASS | integer 6502 coordinate animation |
| CLEARED hold | PASS | 180 state-dispatch frames |
| GAME_OVER CPU path | PASS | starts at 90 |
| GAME_OVER Solitaire-zero path | PASS | enters with timer 88 |
| GAME_OVER wipe | PASS | persistent rows 3..27, edge→center |
| WIN score box | PASS | source-derived score tiles |
| PASS_CONTROLLER sprite message | PASS | all 7 sprites / original coordinates |
| Arrow smoothing/nudge | PASS | source-derived quarter approach |
| Vs CPU imperfect-memory AI | PASS | source-transcribed state machine |
| AI 30-frame second-card pause | PASS | `aidiocy.s` |
| Story 10-stage table | PASS | exact `storyStages` bytes |
| Story tie counts as loss | PASS | compare logic in `litemain.s` |
| Original opponent portraits | PASS | source-derived tile/sprite assets |
| Original English story/dialogue | PASS | includes documented 0.02 fall-through quirks |
| Title screen/menu/difficulty | PASS | source-derived title renderer / menu rules |
| Original 11 SFX | PASS | synthesized from source data |
| Intro + cleared music | PASS | source-derived sequence model |
| Responsive/no page scroll | PASS | largest-fit 256×240 browser scaling |
| Touch/mouse support | ADAPTATION | additional input; historical controls retained |
| Italian translation | ADAPTATION | English remains oracle |
| Web Audio timbre | APPROXIMATION | sequence/timing source-derived; not cycle-perfect NES APU |
| Select slowdown | PRESERVED, NOT EXPOSED | source kept in `/reference`; omitted from player UI |
| Help/Credits browser shell | ADAPTATION | historical material remains preserved |
| Local language/difficulty preferences | ADAPTATION | no gameplay state persisted; reset available |
| Player-facing archaeology/debug jargon | PASS | absent from normal HTML shell |

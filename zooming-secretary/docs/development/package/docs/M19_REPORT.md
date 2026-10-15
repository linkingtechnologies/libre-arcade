# Zooming Secretary — M19 Dream playable

## Result

**M19: GREEN.**

The browser campaign now reaches the Dream after Day 4.

## Dream functional reconstruction

- target calls: 1
- topics active: 0
- permanent wisdom during gameplay
- 6 telephone tables
- telephone starts on table #5
- initial runaway cooldown: 5
- cooldown increases by 10 after each teleport, first reload 15
- Ghost starts at `(16,240)` with 150-tick wait
- player starts at `(120,120)`
- initial telephone counter: 29
- seed-1 RNG after source-order initialization: 8
- no normal missed-call lifecycle in the bonus stage

Collision SHA-256:

`cebe42ab657f4ff557a3f2a27cc6d8988f138c42fcee3253100e1c5155a3a5f0`

## Two outcomes

### Phone answered

The ringing telephone can be answered regardless of remembered topic because Dream continuously forces wisdom. One answer immediately clears the Dream. Campaign semantics raise the future miss allowance from 3 to 5.

### Ghost catch

Ghost collision produces `DREAM_CAUGHT`, not a normal stage loss. Campaign semantics advance beyond Dream with the miss allowance still at 3.

Day 5 is intentionally not included in M19; the browser reports the resulting allowance and offers Dream replay.

## Real movement coverage

An automated path uses the actual movement core to:

1. move from the middle spawn to the outer ladder;
2. descend to the lower floor;
3. approach the original table-5 phone position;
4. trigger the runaway telephone;
5. verify destination table #4, RNG `8→16`, and cooldown `5→15`.

## Core correction found by M19

Teleport state was already correct, but `PHONE_TELEPORT` was lost by event-buffer replacement inside `Simulation.tick()`. M19 routes it into the returned per-tick event array. See `M19_CORE_CORRECTION.md`.

## Regression

- previous suite: 134 tests
- M19: 19 tests
- total: **153/153 passed**

M19 covers semantic topology, source-order initialization, safe modulo-zero representation, first ring, no-miss bonus lifecycle, forced wisdom, Ghost wait/pursuit/catch, natural 200-tick state, runaway cooldown, teleport event plumbing, real movement, phone success, campaign bonus semantics, bilingual browser wiring and placeholder-only rendering.

## Media/legal boundary

No original ROM, CHR, nametable source, graphics, music, manual, labels or historical C/ASM source are redistributed. Dream geometry is expressed as new semantic code. Tables and Ghost are new placeholder drawings.

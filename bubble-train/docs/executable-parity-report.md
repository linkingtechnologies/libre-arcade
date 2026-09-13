# Direct executable parity audit — Bubble Train

## Result

**Direct static executable parity: PASS for the audited core gameplay invariants.**

No core gameplay mismatch was found between the browser restoration and the behavior encoded in the historical executables that can be inspected in this environment.

This is **not yet a live-runtime parity certification**: the current environment cannot boot AmigaOS4 or execute the GP2X ARM binary with its SDL/runtime dependencies. The result below is based on direct inspection of the actual historical executable bytes/disassembly, not solely on C++ source review.

## Historical binaries inspected

### AmigaOS4 1.0final baseline

`BubbleTrain_OS4/src/bubbletrain`

- ELF32, big-endian PowerPC
- statically linked
- SHA-256: `132fb1b82208554d289c2ec07b36c1c9da9d5d6c21b691c618d2216cefd97890`
- package baseline: 800×600 data / original gameplay scale
- symbol information is largely unavailable, so executable-level corroboration uses identification, strings and literal scanning.

### GP2X / GBAX 2006 compiled port

`BubTrain/bin/BubTrain`

- ELF32, little-endian ARM
- statically linked GNU/Linux binary
- debug information and C++ symbols retained
- SHA-256: `7806cfecf6983414cdbff6375c77762bb3717a17f55214760308e88ca1537eab`
- target world/display scale: 320×240

The GP2X binary is particularly useful as independent compiled corroboration because functions such as `Level::animate`, `Train::triggerBomb`, `Train::rippleMove`, `Cannon::rotateLeft`, `TrackSpiral::calcRadius` and `TrainStation::animate` can be located directly by symbol.

Raw evidence is preserved under `docs/evidence/executable-parity/`.

## Core parity findings

| Behavior / invariant | Historical executable evidence | Browser restoration | Result |
|---|---|---|---|
| RNG initialization | GP2X `main` calls `time()` then `srandom()` | Native behavior documented; browser deliberately substitutes seeded RNG for reproducible tests | PASS, intentional adaptation |
| Bubble radius | GP2X compiled literal `6`; 0.4× scale => original `15`; OS4 binary contains `15` literals | `BUBBLE_RADIUS = 15` | PASS |
| Bubble diameter / ripple gap | GP2X compiled ripple literal `12`; 0.4× => `30`; OS4 contains `30` literals | `BUBBLE_DIAMETER = 30` | PASS |
| Touch threshold | GP2X `Train::touchingCarriages` uses `13` = GP2X diameter `12 + 1`; original rule is `30 + 1` | `TOUCH_THRESHOLD = 31` | PASS |
| Match size | GP2X `Train::removeGroupedCarriages` removes only when run count is `>2` | requires 3+ | PASS |
| Speed-bubble match quirk | compiled match scan checks special type while extending runs, preserving asymmetric source behavior | tested source-style asymmetry | PASS |
| Bomb radius | GP2X `Train::triggerBomb` literal `24`; 0.4× => `60`; strict radius check | `BOMB_RADIUS = 60`, strict `< radius` | PASS |
| Colour bomb | GP2X `Train::triggerColourBomb` reads impacted carriage colour then scans/removes every carriage of that colour | removes all target-colour carriages in impacted train | PASS |
| Insertion/ripple propagation | GP2X `Train::rippleMove` uses post-move gap, diameter `12`, and propagates only `12-gap` overlap | same algorithm at diameter 30 | PASS |
| Split-chain behavior | compiled train code operates on connected list segments; source/binary flow consistent with reconnect/ripple behavior | implemented and regression-tested | PASS |
| Cannon rotation step | GP2X compiled double = `π/60` | `ROTATION_STEP = Math.PI / 60` | PASS |
| Cannon rotation limit | GP2X compiled double = `π/2`; OS4 binary also contains `π/2` | clamp ±`Math.PI/2` | PASS |
| Cannon length | GP2X compiled `18`; 0.4× => original `45`; OS4 binary contains `45` doubles | `CANNON_LENGTH = 45` | PASS |
| Bullet movement | GP2X `Bullet::animate` only advances x/y then animates bubble; no wall-reflection branch | linear projectile; off-screen culling; no bounce | PASS |
| Maximum active bullets | GP2X `Level::canFireBullet`: `cmp #10`, true for `<=10` | same historical quirk | PASS |
| Rainbow cadence | GP2X `Bubble::animate` tests old counter before decrement, resets to 15; effective change every 16 animate calls | exact 16-call quirk tested | PASS |
| Speed expiry | GP2X compiled branch checks timer, expires to normal and selects a normal colour | same behavior | PASS |
| Spiral radius law | GP2X `TrackSpiral::calcRadius` encodes coefficient `-0.1` and `exp` | `startRadius * exp(-abs(theta)/10)` | PASS |
| Level frame order | GP2X `Level::animate`: cannons → train stations → bullets/off-screen → timer → bullet hits/state | same source-order sequencing | PASS |
| Shot-created match timing | collision is checked after train match processing in compiled `Level::animate` | ordinary insertion match deferred to next train frame | PASS |
| Train-station spawn order | compiled `TrainStation::animate` calls `Train::animate` first, then station-clear/spawn/return logic | same order; new carriage does not move until following tick | PASS |

## GP2X port differences — not upstream parity failures

The GP2X executable/data are a **resolution/tuning derivative**, not the baseline the browser restoration should copy blindly.

Direct comparison of all 66 bundled XML files shows:

- OS4 and GP2X each contain the same **61 `.lvl` + 5 `.gms` paths**;
- only 4/66 files are byte-identical;
- all 61 level XML files were adapted for GP2X;
- cannon/track coordinates are overwhelmingly **0.4×** the 800×600 baseline;
- train speeds are normally **0.4×** the OS4 values;
- GP2X bubble radius is 6 vs 15 baseline, diameter 12 vs 30, cannon length 18 vs 45, bomb radius 24 vs 60;
- GP2X level bullet speed was deliberately normalized/tuned to **8.00** rather than simply scaled from the OS4 level values;
- GP2X `lockFrameRate()` waits until elapsed time is greater than 32 ms, producing approximately a 30 Hz handheld loop rather than the original/OS4 25 Hz / 40 ms baseline;
- `BubbleTrain.gms` differs only in letter-case of the level filenames (`01-b.lvl` etc. versus `01-B.lvl`).

Therefore the web restoration correctly retains the **OS4/upstream 800×600, 25 Hz baseline** and uses GP2X only as compiled behavioral corroboration.

See:

- `docs/evidence/executable-parity/gp2x-level-scaling.csv`
- `docs/evidence/executable-parity/gp2x-vs-os4-level-hashes.csv`

## OS4 executable corroboration

The OS4 final executable has insufficient function symbols for the same function-by-function annotation, but the binary itself was directly scanned. It contains big-endian literals corresponding to key upstream-scale constants, including:

- `π/60`
- `π/2`
- `15`
- `30`
- `31`
- `45`
- `60`

The literal scan is recorded at `docs/evidence/executable-parity/os4-literal-scan.txt`. Presence of a literal alone is weaker than symbolized function disassembly, so the report uses the GP2X function-level evidence for attribution and the OS4 scan only as corroboration.

## Regression lock added to the web project

`tests/executable-parity.test.js` converts the direct executable findings into automated guards:

- GP2X 6 / 12 / 24 / 18 values normalize to the browser's 15 / 30 / 60 / 45 at 0.4 scale;
- touching remains diameter+1 rather than naïve scaled 13→32.5 arithmetic;
- cannon step remains `π/60`;
- spiral exponential coefficient remains `/10`.

The complete suite is now **60/60 passing**.

## What remains unverified

The following still require an actual native/emulated historical runtime and visual capture, not static disassembly:

1. wall-clock first-spawn timing and perceptual pacing on an original-compatible OS4 runtime;
2. exact presentation/menu focus and input feel;
3. native pause/audio behavior;
4. rendered visual coordinates frame-for-frame;
5. high-score/config file byte compatibility, which the browser port intentionally does not claim;
6. visual/audio identity, intentionally replaced with clean-room assets.

An attempt was made to obtain a suitable ARM/PowerPC emulator in this environment, but no QEMU/OS4 runtime is installed and the environment cannot fetch the required external static emulator binary. No live-runtime claim is therefore made.

## Classification after this audit

- **Source parity:** PASS for implemented core gameplay behavior.
- **Historical-data parity:** PASS for the 61 original OS4/upstream levels and 5 game manifests, preserved byte-for-byte.
- **Direct static executable parity:** **PASS for audited core invariants.**
- **Live native/runtime differential parity:** PENDING.
- **Audiovisual parity:** intentionally not claimed; clean-room replacement policy remains in force.

No code change was required to repair a gameplay mismatch during this executable audit. The differences discovered were GP2X-specific scaling/tuning choices that should **not** be imported into the 800×600 restoration.

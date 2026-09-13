# Parity plan and mandatory tests

## Baseline

Parity baseline is the **Dwarf City/OS4 800x600 gameplay/source snapshot**, not the GP2X GBAX derivative. The GP2X package resized geometry and adjusted speeds for 320x240.

Runtime execution of the original OS4 binary was not performed in this audit environment because it is an AmigaOS4 executable and the required target runtime is unavailable. Source/data parity therefore begins with source-derived behavior and later requires visual/runtime comparison on a suitable OS4/original build environment.

## Golden rules

- 25 Hz simulation semantics first.
- Preserve source quirks before “fixing” them.
- No wall bounce.
- Bubble radius 15 / diameter 30.
- Touch threshold <=31.
- Group removal requires same colour + touching + length >=3.
- Track geometry is line/arc/exponential spiral.
- Multiple trains independent.
- Bullet and carriage random generation must be seedable in tests.

## Test matrix

| Test | Required assertion |
|---|---|
| chain advancement | driving segment advances `speed * multiplier` per simulation tick |
| spacing | ripple propagates only through contact/overlap; stops at gap >30 |
| station spawn | next carriage appears only after tail clears start by >30 |
| station return | backward overflow returns tail carriage to factory |
| shot | bullet velocity follows cannon angle and level speed |
| screen exit | projectile is deleted; no bounce/reflection |
| line move | exact distance and leftover across endpoint |
| arc move | linear distance -> angle/radius; correct rotation |
| spiral move | preserves original discrete exponential-radius algorithm |
| collision | hit threshold uses centre distance <=30 |
| insertion | before/after side comes from active track section |
| insertion spacing | creates 15 px forward/backward ripple |
| match 3+ | touching same-colour run removed |
| separated colour run | identical colours across >31 gap do not match |
| chain reaction | later reconnection can trigger a new 3+ removal |
| bomb | removes impacted-train carriages within radius <60 |
| colour bomb | removes all same-colour carriages in impacted train |
| rainbow | immediate first change, then every 16 animate calls (source-code quirk) |
| speed bubble | seeded multiplier/lifetime; expiry -> normal + new colour |
| split chain | only rear/driving connected segment advances |
| end path | forward overflow -> crashed -> level game over |
| level victory | all active trains empty AND factories empty |
| credits | retry decrements unless -1; 1 credit ends game |
| timer | pause excluded; stored unit matches original `/100` behavior |
| RNG | same seed -> same gameplay sequence |
| level loader | all supported XML attributes/primitives load |
| campaign | `.gms` order and theme selection preserved |

## Differential fixtures

Create tiny clean-room test levels instead of copying shipped level designs into the port test suite:

1. single horizontal line;
2. two connected lines;
3. clockwise arc;
4. anticlockwise arc;
5. spiral;
6. line->arc->line transition;
7. two independent trains;
8. short track forced crash;
9. speed reverse forced station return.

## Later runtime parity

When an executable environment is available, capture:

- menu/control behavior;
- first-spawn timing;
- 25-FPS motion distances;
- insertion side on line/arc/spiral;
- match timing;
- special-bubble durations;
- pause timer behavior;
- level transition/retry/high-score flows.

Record expected observations here before changing the port.


## Automated coverage status — Milestone 1

As of the first faithful-engine milestone, `npm test` provides **26 passing clean-room tests** covering: line/arc/spiral movement, section transitions, insertion side, deterministic RNG, no-initial-triple generation, split-chain advancement, 15+15 insertion spacing, gap propagation, collision threshold, match 3+, separated runs, speed-bubble match exclusion, bomb, colour bomb, forward crash, station return, station spawn clearance, level/game-manifest loading, cannon straight shots, projectile culling, victory and game-over.

Still pending from the full matrix: exact rainbow timing, exact speed-bubble lifetime/expiry and random multiplier distribution, chain-reaction timing under native-runtime comparison, campaign credits, pause-aware fastest-time behavior, special-population XML availability counts, and native differential captures.


## Automated coverage status — Milestone 2

Milestone 2 supersedes the M1 engine approximations and currently reports **39 passing tests**. Added/strengthened coverage includes: source-style cannon magazine/reload, 45 px muzzle origin, inherited XML section starts, bullet special quotas, carriage special quotas, exact rainbow cadence, discrete speed-bubble multiplier/lifetime, timer activation/expiry, source-order collision traversal, post-move overlap ripple, reverse movement, source speed-match asymmetry, delayed ordinary-insertion matching, station frame ordering, non-snapping crash/return overflow, and a full split/reconnect/secondary-removal chain reaction.

Still pending from the complete matrix: credits/retry flow, pause-aware level timer and fastest-times persistence, complete `.gms` campaign progression, audio, native executable differential captures, and final responsive UI parity.

## Automated coverage status — Milestone 3

Milestone 3 reports **51 passing tests**. It adds pause-aware tenths-of-a-second timing, complete ordered `.gms` campaign progression, finite/infinite credits and retry flow, cumulative completed-level timing, fastest-time ordering/persistence, settings persistence, terminal-run ranking insertion, retry RNG stream separation, and load coverage for the new three-level clean-room demonstration campaign.

The browser persistence format is deliberately new JSON/localStorage and is not claimed to match historical `bubbletrain.hsc` bytes. The demo campaign layouts are newly authored and are not historical parity fixtures.

Still pending for parity certification: native executable differential captures, original-content rights resolution, original menu/config/high-score byte-format comparison, final clean visual/audio content, device/accessibility matrix and sustained playtesting.

## Automated coverage status — Milestone 4

Milestone 4 reports **55 passing tests** and replaces the runnable demo's content source with the cleared historical campaign data. New tests enumerate exactly **61 `.lvl` + 5 `.gms` files**, verify representative audited hashes, resolve all five original manifests on a case-sensitive web layout, prove the five campaign lengths (10/20/20/11/50), cover all **61 unique original levels**, and instantiate/execute every level. A separate smoke run executed 250 simulation frames on each historical level without exceptions.

The original XML remains byte-identical. The web-specific case resolver compensates externally for historical manifest paths such as `easy/...` versus archive directory `Easy/...`.

Still pending for parity certification: native executable differential captures, original menu/editor behavioral comparison, final clean audiovisual design, sustained full-campaign playtesting, and browser/device/accessibility coverage.


## Automated coverage status — Milestone 7 Release Candidate

Milestone 7 keeps **57/57 automated tests passing** and adds an explicit release gate (`npm run release:check`). The gate verifies:

- all **3 historical archive hashes**;
- all **66 historical `.lvl/.gms` hashes**;
- all **33 clean-asset manifest hashes**;
- zero runnable references to quarantined historical media;
- all 8 clean theme backgrounds;
- local HTTP delivery and MIME types for HTML, JS, SVG, `.gms` and `.lvl`;
- an automated randomized soak across **61 levels × 3 attempts = 183 attempts**, totaling **128,589 simulation ticks**, with finite carriage/bullet positions throughout.

A release-prep bug was also fixed: Options/Fastest Times now pause and resume procedural gameplay music together with simulation. The local development server now serves SVG and historical XML data with explicit MIME types.

**Parity certification remains pending** because this environment cannot execute the original AmigaOS4 binary and therefore cannot provide native differential captures. A manual visual/input matrix on real Chromium, Firefox, WebKit and touch hardware also remains required. Milestone 7 should therefore be labeled **Release Candidate**, not final parity-certified release.


## Executable parity status — Milestone 8

Milestone 8 adds **direct static analysis of the actual historical executables**, not merely source-code comparison. The OS4 1.0final PowerPC executable and the symbolized GP2X/GBAX 2006 ARM executable were identified and hashed; the GP2X binary was disassembled function-by-function for core mechanics.

Direct compiled evidence confirms the restoration's core invariants: bubble radius/diameter normalization, diameter+1 touching threshold, 3+ grouping, bomb radius, colour-bomb all-colour removal, post-move overlap ripple, cannon `π/60` step and ±`π/2` limit, cannon length, no wall bounce, `<=10` active-bullet quirk, Rainbow 16-call cadence, Speed expiry, exponential spiral coefficient `-0.1`, Level frame ordering, delayed shot-created matches, and TrainStation animate-before-spawn ordering.

The GP2X package also proves that it is a deliberate handheld derivative: geometry and ordinary train speeds are mostly scaled to 0.4 for 320×240, its frame limiter targets >32 ms (~30 Hz), and level bullet speeds are retuned to 8.00. These are **port-specific divergences** and are not imported into the web baseline, which remains OS4/upstream 800×600 at 25 Hz.

Three new executable-derived regression tests bring the suite to **60/60 passing**. Full evidence and offsets are documented in `docs/executable-parity-report.md` and `docs/evidence/executable-parity/`.

**Direct static executable parity: PASS for audited core gameplay invariants.**

Live runtime differential parity remains pending because an AmigaOS4/GP2X execution environment is not available here. The project must therefore still avoid the stronger label “live parity-certified” until native/emulated captures are actually made.

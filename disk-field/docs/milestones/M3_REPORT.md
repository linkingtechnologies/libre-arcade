# Disk Field HTML5 M3 — production-readiness milestone

## Scope

M3 hardens the M2 browser port for public static deployment while deliberately leaving the validated physics and level dataset unchanged. Baseline remains historical Disk Field 1.01; 1.0 remains the PyWeek contest snapshot.

## Production changes

### Progression

Progress is stored as the number of unlocked levels, matching the historical selector model while avoiding an original-style regression where replaying an earlier level could overwrite later progress. The browser implementation is monotonic: completing an old level never relocks a later one.

New pure progression helpers are unit-tested for:

- corrupt/missing stored values;
- lower/upper bounds;
- archaeology mode;
- the complete unlock chain from level 1 through level 17;
- replaying an already-completed early level.

### Storage robustness

`localStorage` reads/writes are wrapped. If storage is unavailable or denied, Disk Field remains playable for the current session rather than failing during startup.

### End-screen fidelity

The 2007 `endScreen()` returned after a key press or approximately five seconds. M3 restores the five-second automatic return while keeping tap/key dismissal.

### Browser lifecycle

When the document becomes hidden, active gameplay is paused and held inputs are cleared. This prevents a tab switch or mobile app switch from advancing a fixed-timestep simulation without the player seeing it.

### Mobile/touch

M3 adds safe-area-aware padding, larger coarse-pointer controls, compact short-landscape layout, and touch-callout suppression. The simulation remains 800×600 logical pixels; CSS only changes presentation size.

### Deterministic diagnostics

Normal level 7 / `Dodge!` behavior remains historically random. Supplying `?seed=<value>` creates repeatable random wall initialization for bug reports and QA. This option changes no rules and is inactive unless explicitly requested.

### Accessibility

The canvas is tied to the help text, the status area is an ARIA live region, and rotation-control/canvas labels follow the current Italian/English language.

## Regression gate

After M3 changes:

- 7/7 historical oracle scenarios pass;
- 85/85 vector-field samples pass;
- all discrete collision/hole/completion states remain exact in the oracle corpus;
- maximum position drift remains below 0.0025 px in the existing oracle envelope;
- all 17 levels remain numerically stable for up to 1,200 ticks each;
- selector preview still leaves disks stationary;
- all 17 active levels instantiate and accept their goal center as a valid completion point;
- the complete 1→17 unlock chain passes;
- the public deployment tree contains no quarantined original font/audio asset or reference-tree payload.

`npm test` runs the whole gate.

## Play-through status

The production checks prove level construction, simulation stability, completion predicates, progression, and the historical oracle cases. A separate automated route-search experiment successfully found complete control sequences for the first two levels but was not reliable enough on later obstacle levels to serve as a whole-game solvability proof. M3 therefore does **not** claim that an automated agent has solved all 17 levels.

This is not evidence of a gameplay defect: the 17 level definitions are unchanged from the original released game, and the port preserves their physics against the oracle. A final human play-through remains the appropriate acceptance test for difficulty, ergonomics, and subjective playability.

## Browser visual smoke test

A headless Chromium screenshot run was attempted in the build container, but the installed Chromium process does not terminate correctly even on `about:blank` in this environment. The browser screenshot was therefore not used as a release gate. Static module syntax checks and the Node simulation/regression suite pass.

## Asset boundary

No licensing decision changed in M3. Historical font and audio remain quarantined under `/reference` in the full archaeology bundle. The public build uses Canvas primitives, system fonts, and procedural Web Audio only.

## M3 status

**Code/physics regression:** green.  
**Progression/storage:** green.  
**Public asset boundary:** green.  
**Responsive/touch implementation:** green by code/static review; physical-device acceptance still recommended.  
**Full human 17-level play-through:** pending acceptance test.

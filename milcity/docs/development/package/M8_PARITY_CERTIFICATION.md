# MilCity M8 — Parity certification

M8 is a certification milestone, not a redesign. Baseline: original MilCity-Blue 1.0.5 source archive preserved in `reference/`.

## Source-to-browser parity matrix

| Scenario | Java 1.0.5 oracle | Browser M8 | Status |
|---|---|---|---|
| Construction / blackout recovery | `PlayerAbstract`, `Building`, PowerPlant override | same ordering/timing model | PASS (static + executable JS) |
| First missile / 1x1 building | `Weapon.makeEffect`, COMMAND_HIT/DESTROYED | +10 hit +10 destroyed | PASS |
| Crater creation | `CELL_EXPLOSION_1` then renderer advances to destroyed | M7 render-driven explosion path retained | PASS |
| Spy | discovers building/shielded cells, no damage | same | PASS |
| Shield | negative protected cell makes incoming shot look like miss | same | PASS |
| Blackout | loss after strictly more than 120 s, or inability to finance recovery | same | PASS |
| Easy AI | same AI policy structure; original uses clock-seeded `new Random()` | deterministic QA substitute uses JavaRandom | CONDITIONAL |

## Certification boundary

The browser is source-parity certified for the deterministic rules above. It is **not yet visually/emulator certified** against a running J2ME 1.0.5 session because no J2ME emulator is available in this runtime. AI random trajectories cannot be byte-for-byte compared to an historical session because the original repeatedly creates unseeded `java.util.Random()` instances from wall-clock state.

## Residual risks

1. Runtime scheduling/thread interleaving may cause second-level differences versus a real handset/emulator.
2. Render-driven explosion progression needs visual confirmation in CITY mode at 10 FPS.
3. Exact key mapping/font rasterization/splash appearance still needs emulator evidence.
4. Asset provenance remains YELLOW; original PNGs are reference-only.

## M8 verdict

Core gameplay parity is strong enough to proceed. Before declaring historical parity complete, run the included J2ME 1.0.5 JAR in FreeJ2ME or an equivalent emulator and record the same seven scenarios.

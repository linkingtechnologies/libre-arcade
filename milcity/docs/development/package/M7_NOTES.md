# MilCity M7 — Temporal / impact parity

M7 remains a source-faithful restoration milestone, not a redesign.

## Confirmed from the Java 1.0.5 source

- `GameEngine` is instantiated at **10 FPS**.
- `LocalPlayer` / `AIPlayer` state loops sleep approximately **1000 ms** between updates.
- A weapon changes every affected non-water, non-shielded grid cell to `CELL_EXPLOSION_1` (30).
- `GridView.render()` in CITY mode advances explosion cells on every render: `30 → 31 → 32 → 33 → 34 → 28`.
  At 10 FPS the visible explosion therefore lasts about **0.5 s**.
- This renderer-driven transition is gameplay-visible: the final value 28 (`CELL_DESTROYED`) is a permanent crater and is no longer buildable grass.
- Shielded cells are negative internally in Java; generic weapons report them as a miss but do not create an explosion.
- Radar misses start at `STATUS_CELLHIT_MAX = -1`. The military `GridView` decrements those values once every ten renders, down to -128.
- Radar grayscale is exactly `192 + status`, so a fresh miss is approximately gray 191 and becomes progressively darker.
- The original startup splash is shown for **3000 ms** on white.

## M7 browser behavior

- Simulation tick: 1 Hz.
- Render cadence: 10 FPS.
- Explosion state is now stored in the actual grid and advanced by CITY rendering, preserving the unusual original coupling between rendering and state.
- Craters block later construction.
- Radar miss decay is render-driven and occurs every ten MILITARY frames.
- Startup includes a procedural 3-second splash inspired by the historical composition. The original `Splash_MilCity_Koojoo.png` is **not** redistributed or imported.

## Deliberate limitation

The procedural splash and pixel-art cells are reconstructions, not copies. Asset provenance remains YELLOW, so historical PNG files stay under `reference/` only.

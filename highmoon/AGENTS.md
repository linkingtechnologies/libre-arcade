# AGENTS.md

- The simulation modules in `public/src/` (`rng`, `vector2`, `simulation`, `galaxy`, `world`, `weapons`, `game-shot`, `historical-runtime`, `ai`, `game-controller`, `constants`) are the validated baseline. Change them only together with the affected tests and a comparison against the native oracle traces. Never tune trajectories by eye, and never hide a `libm` difference with an empirical constant.
- Historical quirks are behavior to preserve, not bugs to fix: moons and ring stones exert no gravity, `WEIGHT_WORMHOLE` is stale, collision is discrete, `draw()`-time state and `rand()` consumption are reproduced by `historical-runtime.js`. A "fixed" variant would need its own explicit mode, separate from the archaeological one.
- Rendering and audio have no authority over the simulation. They must not read or mutate the historical RNG, define collision radii, gravity weights, timing or AI geometry.
- Never add original HighMoon graphics or sounds (GIF, PNG, WAV, the icon) or the original TAR, in `public/`, `reference/` or anywhere else in this folder. Their per-file provenance is unresolved (`REFERENCE_POLICY.md`, `specs/audit-phase4/`). `tests/reference-integrity.mjs` and `tests/production-safety.mjs` fail if they appear. `.gitignore` also excludes them.
- `reference/reference/HighMoon/` holds the preserved upstream source and documents, byte-identical. Never edit it, including the upstream `NEWS`. The instrumented copy is derived from it (`reference/instrumentation.patch`).
- The native oracle can only be rebuilt with the withheld original tree restored locally and a C++ toolchain. Do the rebuild in a disposable copy and never overwrite the checked-in traces.
- The port is GPL-3.0-or-later; the upstream C++ is GPL-2.0-or-later, and files derived from it (the instrumented copy, oracle tooling) keep that license.
- No runtime frameworks, bundler or network dependencies; the only remote reference allowed in `public/` is the collection's GoatCounter beacon and the two credit links in the HTML.
- Do not describe the game as a certified 1.0. Firefox, Safari/iOS, hosted-URL smoke tests and human sign-off are open (`docs/FINAL_QA_RC5.md`).
- `npm run check` (lint plus the regression suite) must pass before packaging.

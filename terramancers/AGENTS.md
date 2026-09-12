# AGENTS.md

## Project intent

This is a preservation-first port of Terramancers. v1.0 is a production browser restoration, but historical gameplay behavior remains the baseline for future changes.

## Rules

1. Keep `reference/originals/Terramancers-LPC-2012.zip` byte-for-byte unchanged.
2. Do not edit material under `reference/extracted/`; it is a convenience extraction of the preserved archive.
3. Changes in the web implementation must be classified in `reference/audit/PRESERVED_VS_RECONSTRUCTED.md` as parity, platform adaptation, historical bug fix, or enhancement.
4. Preserve the historical simulation rules unless a separate non-parity mode is explicitly introduced.
5. Do not normalize diagonal speed, modernize collision geometry, seed the RNG, change tree cadence, or alter capture rules in the parity implementation.
6. Keep simulation timing at nominal 180 ticks/s (`60 FPS × 3 TPF`) and walking animation state on its separate historical 60 Hz repaint clock.
7. Never make active gameplay depend on the monitor refresh rate.
8. During an active match, keep the logical screen dimensions frozen. Resize/orientation changes may scale or letterbox the scene but must not regenerate the map.
9. Keep the runtime dependency-free and client-side: HTML, CSS, vanilla JavaScript, Canvas 2D.
10. No framework, build service, backend, or network service may be required to play.
11. Keep asset attribution intact. New or replacement artwork must have provenance recorded before it is committed.
12. Tests must cover every intentional behavioral change to the core or timing model.
13. English historical labels are the parity baseline. Localization is a platform feature and must not overwrite the English baseline.
14. Keep browser-facing text concise and player-oriented; archaeology detail belongs in `reference/audit/` and repository documentation, not the in-game UI.
15. Before a release, run `npm test`, JavaScript syntax checks, and verify the SHA-256 of the preserved original ZIP.

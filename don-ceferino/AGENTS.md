# AGENTS.md

This repository is a preservation-first web port of Don Ceferino Hazaña 0.97.8.

Rules for changes:

1. Never edit files under `/reference/ceferino-0.97.8/` or the original tarball.
2. Keep the browser build framework-free and fully client-side.
3. Preserve 100 Hz logical timing in parity mode.
4. Do not "fix" historical quirks without first adding a test that demonstrates the old behavior and documenting the intentional deviation.
5. Keep quarantined bitmap fonts and XM music out of production code unless their provenance evidence is updated in the audits.
6. Active historical graphics, levels and WAV SFX must remain byte-identical to their `/reference` originals.
7. Prefer direct loading of original formats when practical; `base.map` remains the normative level source.
8. Run `npm test` before packaging a release.
9. User-facing text should remain concise and available in Italian and English.

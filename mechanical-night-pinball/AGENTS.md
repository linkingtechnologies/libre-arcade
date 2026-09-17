# AGENTS.md

- Do not commit historical SWF/release/source archives or extracted historical graphics/audio to the public repository.
- Public runtime must use only clean-room artwork/audio.
- Base parity target is DocDonkeys Pinup-Pinball 1.0; the default player profile additionally restores the documented Flash press-snap.
- `?flipper=docdonkeys` must remain available as the strict 2018 comparison profile.
- Keep physics behind `src/physics/physics-adapter.js`.
- Do not silently change audited/calibrated physics constants; document intentional deviations in specs/docs and add regression tests.
- No runtime frameworks; Canvas 2D + Web Audio; client-side only.
- Keep normal UI free of developer/debug text; diagnostics require explicit query parameters.
- `npm run release` must pass before packaging/deploy.

# Turkey Cooking Simulator — Complete Preservation Package

This archive includes the latest player-facing, Italian-localized `1.0.0-rc1` candidate in `game/`, and the development archaeology/verification evidence in `archaeology/`.

## Play
Serve `game/src/` over HTTP (ES modules cannot reliably run via `file://`), then open `index.html`. The game is client-side only; see `game/HOW_TO_PLAY.md` (English/Italian). Example: `cd game/src && python3 -m http.server 8000`.

## Contents
- `game/src/`: playable Canvas/vanilla JS game.
- `game/reference/`: available provenance, reference notes, original README and license information; historical restricted artwork/audio is not bundled.
- `game/docs/PRESERVATION_NOTES.md`: stable preservation rationale.
- `game/README.md`, `game/HOW_TO_PLAY.md`, `game/LICENSE`, `game/THIRD_PARTY_NOTICES.md`: public documentation.
- `archaeology/docs/`: milestone investigation reports and behavioral oracle descriptions, segregated from the player-facing release.
- `archaeology/tests/`: reference model, replay fixtures and regression suites.
- `archaeology/*RESULTS*`, `*SHA256SUMS*`: recorded earlier checks and manifests.

## Release state and licensing
Candidate, **not** final `1.0.0`: manual real-browser cross-browser smoke is still outstanding. The runtime does not redistribute original CC BY-NC artwork/audio. Original source rights and attribution should be checked in `game/reference/` and `game/THIRD_PARTY_NOTICES.md`. The `archaeology/` folder is evidence and test material, not needed to run the game.

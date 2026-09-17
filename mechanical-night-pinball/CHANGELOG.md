# Changelog

## Unreleased

- Restructured the game into this collection's standard `public/` → `game/` layout: `index.html`, `styles.css`, `src/` and `assets/` now live under `public/`; the production build folder is `game/` instead of `dist/`.
- Added the standard `package.json` scripts (`dev`, `build`, `start`, `test`, `lint`, `check`), `scripts/serve.mjs` and `eslint.config.mjs` shared by every game in the collection, alongside this project's own `verify:source`/`verify:game`/`release` pipeline (kept, just retargeted from `dist/` to `game/`).
- Added the GoatCounter analytics snippet used by every other game.
- Renamed the 17 `test/*.mjs` regression files to `test/*-test.mjs` so `node --test` discovers them directly, replacing the hand-chained `&&` test script.
- No gameplay, physics, table, scoring or audio changes.

## 1.1.0-rc2

- Added simultaneous desktop flipper mappings: `←/→`, `Z/M`, and `A/L`.
- Added source aggregation so overlapping aliases do not cause premature flipper release.
- Updated IT/EN player instructions.


## 1.1.0-rc1

- Split sound effects and background music into independent controls.
- Added a clearly audible 16-second project-authored CC0 synth loop (`assets/music/mechanical-night-loop.ogg`).
- Kept procedural ambience as a decode/load fallback only.
- Preserved audio/language settings across restarts.

## 1.0.0 — 2026-09-17

- Clean-room HTML5/JavaScript restoration completed.
- Source-driven table geometry, scoring, ramps, tunnels, peg recovery, multiplier and extra-ball state machines.
- Custom physics solver calibrated against the archived Box2D 2.3.2 reference.
- Open-chain collision fix, low-speed restitution threshold, sleep/wake, stable resting contacts and high-speed substep hardening.
- Vertical follow camera inspired by the historical Flash presentation.
- Flash-enhanced one-shot flipper press snap as the default player profile; strict DocDonkeys 2018 profile available with `?flipper=docdonkeys`.
- Fully new clean-room SVG artwork and procedural Web Audio; no historical expressive assets in the public source or production build.
- Responsive title/menu, IT/EN UI, touch controls and game-over flow.
- `?debug=states` and `?debug=colliders` diagnostics.
- Production/source guardrails and SHA-256 manifests.

Detailed development history is available in `docs/history/`.

# AGENTS.md

## Project goal
Preserve Donkey Bolonkey's historical gameplay behavior while making it run entirely in a modern browser with plain HTML5 + JavaScript.

## Hard constraints
- No framework, backend, or required build step.
- Keep historical source under `/reference` unchanged.
- Do not copy media out of `reference/dkbk/dkbk.dat` unless `specs/ASSET_AUDIT.md` is updated with a positive provenance decision.
- Keep gameplay/core separate from rendering and UI.
- Treat `/reference/dkbk/levels.h` as the canonical level source.
- Fixed gameplay timestep: 60 Hz.
- New code is GPL-3.0-or-later.

## Parity policy
When historical behavior is known from source, preserve it even when it looks unusual. Browser-only conveniences must be documented as adaptations in `specs/PARITY.md`.

## Language
Code, comments, technical documentation and archaeology notes: English. Player-facing UI: Italian and English.

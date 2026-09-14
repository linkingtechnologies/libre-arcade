# AGENTS.md

## Project principles

- Preserve historical reference material separately from new code.
- Do not modify original archives placed under `/reference`.
- Do not copy code or assets from a reference unless its licence and provenance have been explicitly audited.
- Keep the playable core independent from DOM, rendering, audio and localisation.
- The board definition must remain data-driven.
- Random gameplay must use the seeded RNG, never `Math.random()`.
- Every gameplay regression should receive a deterministic automated test.
- User-facing text belongs in the IT/EN localisation layer.
- Keep developer/legal/archaeology terminology out of the normal game UI.
- Prefer original, public-domain, CC0 or otherwise GPLv3-compatible visual/audio assets.

- Accessibility changes must not move game rules into the UI layer.
- Historical archives enter `/reference` only after hashing and direct licence/asset audit.
- Keep primary mobile controls reachable without duplicating game logic.

## Accessibility guardrail — player identity

Never encode player identity by color alone. Preserve the redundant color + geometric symbol + surface-pattern system in board tokens, player status, setup previews and turn notices. Any future visual redesign must retain a non-color cue at normal play sizes and meaningful localized ARIA labels.

# Production release checklist — v1.0.0

## Gameplay

- [x] deterministic RNG
- [x] replay same seed
- [x] save/restore exact RNG state
- [x] 2–4 local players
- [x] optional CPU players
- [x] classic special spaces
- [x] exact finish + bounce
- [x] Well/Prison replacement
- [x] occupied-space exchange

## Presentation and accessibility

- [x] responsive board and no-scroll active play layouts
- [x] historical board themes bundled locally
- [x] project-authored vector icons and audio
- [x] reduced motion
- [x] IT/EN UI
- [x] keyboard focus visibility and translated ARIA labels
- [x] player identity uses symbol + pattern + colour
- [x] primary player symbols remain usable in forced-colours mode
- [x] setup remains usable on short desktop and narrow mobile viewports

## Archaeology/legal

- [x] `/reference` separated from project code
- [x] per-reference provenance/status records
- [x] SHA-256 retained for each locally examined historical archive
- [x] quarantined archives excluded from production distribution
- [x] admitted historical board artwork has provenance and checksum records
- [x] code and historical/media licensing described separately
- [x] top-level archaeology dossier included

## Verification

- [x] automated test suite passes
- [x] deterministic stress simulation previously exercised with 500 completed games during release development
- [x] static HTTP smoke test passes
- [x] runtime check: no `Math.random()` in gameplay code
- [x] runtime check: no external HTTP dependency for the playable game
- [x] production ZIP SHA-256 generated at packaging time

# M6 Status — Libre Arcade Packaging

M6 turns the M5 browser build into a near-production package without altering
the certified historical engine.

## UX
- Main game surface remains intentionally compact.
- Help and credits moved to a native Info dialog.
- Credits are not printed on the main game screen.
- Libre Arcade project link is clickable inside the credits dialog.
- EN/IT covers gameplay, help, keyboard instructions and credits.
- Keyboard, mouse and touch remain supported.
- No vertical page scrolling is required during play.

## Legal/package
- Added GPLv3 `LICENSE` notice.
- Added `THIRD_PARTY_NOTICES.md`.
- Added archaeology and license audit notes.
- Historical raster assets remain excluded from the browser distribution.
- No AI assets.

## Engine gate
The M3 historical engine/model is intentionally unchanged. M6 must continue to
pass the 22 deterministic historical oracle cases.

# Changelog

## Unreleased

- Joined the Libre Arcade collection: restructured into the shared
  `public/` → `game/` layout, added `dev`/`build`/`start`/`lint`/`check`
  npm scripts (built on the collection's own `scripts/serve.mjs`/
  `scripts/build.mjs`), an ESLint config, and `PROVENANCE.md`/
  `SOFTWARE_ARCHAEOLOGY.md` linking back to the collection's own philosophy
  document. Independently re-verified the archive's SHA-256 against
  `reference/SHA256SUMS`, read `LICENSE.txt`/`setup.py` directly to confirm
  the GPL-3.0-only (not -or-later) conclusion, and re-inspected the raw PNG
  bytes of `play.png`/`stop.png` to confirm their embedded "Unlicensed
  preview image" copyright comment, rather than relying on the existing
  audit's summary alone. Fixed lint findings surfaced by the shared ESLint
  config (missing `getComputedStyle`/`URL` browser globals, 4
  `no-useless-escape` findings from unnecessary `\"` escapes inside regex
  character classes) — no behavior change. No gameplay, rules or AI content
  changed.
- Improved turn clarity and pacing based on play-testing feedback: the
  current player's name and Human/Computer status are now shown in a large
  color-matched badge (`#activeColor`) instead of a thin 8px color strip,
  the current player's row in the sidebar is tinted with their own color
  instead of a subtle gray outline, and the badge pulses while it's a human
  player's turn to act. AI turns are slower and easier to follow: each
  step now waits 850ms (up from 260ms), with an extra pause (1300ms) the
  moment the turn actually hands off to a new player, so a turn change
  registers before the next dice roll happens. Also shrank the oversized
  `<h1>glParchis</h1>` title and tightened the header, reclaiming vertical
  space for the board on shorter viewports. No gameplay, rules or AI
  content changed.
- Removed an unintended vertical scrollbar on the setup screen. The cause
  was two separate CSS oversights: every `h1`/`h2`/`h3`/`p` only ever had
  its `margin-top` reset to 0, so each element's default browser
  `margin-bottom` (up to ~20px) was silently stacking up the setup panel;
  and the topbar's language `<label>` stacked its "Lingua" text above the
  `<select>` (70px tall) instead of sitting beside it. Fixed the margin
  reset globally and made the language control a single inline row.
  Verified with no scrollbar down to a 1024×650 viewport. Also boosted the
  Web Audio sound-effect gains (previously 0.018–0.04, now 0.05–0.1) after
  they turned out to be inaudible at normal speaker volume — same
  clean-room oscillator cues, just louder.

## 0.5.0 — Phase 5, production-ready static build

- Ported glParchis 20181125 (Mariano Muñoz / Turulomio, GPL-3.0-only) from
  Python/PyQt5/PyOpenGL to framework-free HTML5/Canvas/vanilla JavaScript.
- Implemented the native 3/4/6/8-seat boards, four pawns per player, mixed
  human/CPU seats, starter-roll ties, compulsory home exit on 5, 6→7 when
  all pawns are out, barriers and compulsory barrier opening on 6, safe
  squares, capture +20, finish +10, exact finish, and the three-consecutive-
  sixes penalty with final-ramp exemption.
- Ported the original probabilistic AI priority order and exact numerical
  difficulty thresholds (40/55/70/85/100), including the historical
  priority-2 threat-detection bug (`mem.jugadores.actual` rejecting ordinary
  opponent threats) and the Python tuple-truthiness quirk in the
  start-square special case — both preserved bug-for-bug rather than fixed.
- Replaced the entire original media set — icons, avatars, WAV effects,
  textures — with procedural Canvas board/pawn/die rendering and clean-room
  Web Audio oscillator cues, after `docs/ASSET-AUDIT.md` found unresolved or
  explicitly non-free provenance (including two preview icons whose own
  embedded metadata names them as an unlicensed third-party asset).
- Added local save/resume via `localStorage`, a deterministic/scripted RNG
  for regression tests, viewport-aware responsive layout, and Italian/
  English UI.
- Omitted the original's optional installation-statistics, global-statistics
  and update-check HTTP calls as unnecessary for a static, privacy-friendly
  build.

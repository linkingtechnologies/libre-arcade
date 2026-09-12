# Changelog

## Unreleased

- Joined the Libre Arcade collection: restructured into the shared
  `public/` → `game/` layout, added `dev`/`build`/`start`/`lint` npm scripts
  and an ESLint config.
- Re-scoped the public-release exclusion policy after independently
  re-downloading and re-verifying the audited archive: `reference/` now
  preserves the full 0.3.0 source tree (SDL_Console code and the
  libsge-derived collision fragment included, as historical evidence),
  physically omitting only the ten specific files with genuinely
  unresolved or third-party-reused provenance, instead of excluding the
  entire tree. Updated `test/repository.test.js` accordingly and added
  `PROVENANCE.md`/`SOFTWARE_ARCHAEOLOGY.md` linking back to the
  collection's own philosophy document. No gameplay or parity content
  changed. Fixed 3 pre-existing unused-variable lint findings in
  `public/src/game.js` (dead import, two unused function parameters — no
  behavior change).

## 0.2.4 — final release hardening

- Fixed Help/About modal behavior: Escape now closes the dialog normally and resumes only when the dialog itself had paused an active game.
- Prevented game hotkeys from firing behind modal dialogs or stealing Space/arrow-key behavior from focused UI controls.
- Released directional input on window blur/visibility loss to prevent a stuck-moving paddle after task switching.
- Made local preference/high-score storage defensive against blocked or corrupted `localStorage`.
- Made manual/dialog/visibility pause freeze presentation deadlines as well as gameplay time.
- Added explicit canvas focus after gameplay actions for reliable keyboard control.
- Added audio scheduling tests proving that an unlocked AudioContext actually schedules both music and effects.
- Added deterministic 50,000-tick engine fuzz validation during release audit; no non-finite state, crash or entity runaway was observed.

## 0.2.3 — Audio unlock fix

- Fixed Web Audio startup on browsers that keep `AudioContext` suspended until a user gesture is explicitly completed.
- Added awaited audio unlock on Start and audio toggles, plus pointer/keyboard fallback unlocking.
- Music scheduling now starts only when the context is actually `running`.
- Enabling Effects plays a short confirmation tone.
- Increased replacement music/effect gain modestly for reliable audibility across browsers.

## 0.2.2 — clean public release

- Removed the complete Yanoid 0.3.0/0.3.5 tarballs and extracted upstream trees from the redistributable package.
- Replaced `/reference` with a manifest containing authoritative SourceForge locations, audited SHA-256 values and local archaeology guidance.
- Added public-release hygiene tests that fail if historical archives, WAV/XM audio, SDL_Console font names or extracted upstream trees reappear.
- Added `.gitignore` guards against accidentally committing the audited upstream archives/trees.
- Updated licensing/archaeology documentation so preserved historical evidence is clearly separated from redistributed runtime material.
- No gameplay, physics, map, graphics or audio-generation behavior changed from 0.2.1.

## 0.2.1 — original presentation assets

- Added a newly authored 5×7 bitmap font atlas for Canvas messages and overlays; no historical SDL_Console font data is reused.
- Added an original four-bar, 64-step chiptune/tracker-style loop synthesized entirely with Web Audio oscillators.
- Added separate Effects and Music toggles with persisted browser preferences.
- Music pauses with the game/visibility state and resumes from the current pattern position.
- Switched the surrounding UI to a system monospace stack to visually harmonize with the bitmap game text without shipping a third-party font file.
- Added tests for the new font atlas, music sequence and continued exclusion of historical SDL_Console fonts.

## 0.2.0 — parity hardening

- Preserved the 0.3.0 `SetPaddle()` launch quirk: current speed 2.0 with -0.03 deceleration at map start.
- Preserved paddle/static wall response, including velocity/acceleration stop and historical min/max tracking order.
- Preserved the CUT reset quirk: resetting the paddle target does not reset its current velocity.
- Matched native one-update delayed removal/accounting for balls and breakable bricks.
- Matched the native y-ordered first collision-response choice.
- Matched `MAPDONE` overriding `CUT/DEAD` when the last ball and last brick disappear together.
- Matched the two 1500 ms end-of-level text phases.
- Corrected map8 chain callbacks: one hit executes two `basic_brick_hit()` calls, giving 20 points and two power-up rolls.
- Confirmed `REMOVEALL` does **not** destroy `brick-stay`: `TBrick::MarkDying()` refuses `hitnum < 0`.
- Aligned replacement audio trigger semantics with the original script callbacks.
- Added the original per-level time display and active shot countdown to the web HUD.
- Localized runtime overlays/messages in both English and Italian.
- Added repository-integrity tests for historical SHA-256 values, referenced sprites and static entrypoints.

## 0.1.0 — first playable preservation milestone

- Initial HTML5/JavaScript port of the Yanoid 0.3.0 contest gameplay.
- Nine original maps, eleven-stage contest progression, power-ups, shots, scoring, lives and Web Audio replacements.
- Preserved 0.3.0 and 0.3.5 source archives and archaeology documentation in the original 0.1.0 package; the archives were later removed from the public distribution in 0.2.2.

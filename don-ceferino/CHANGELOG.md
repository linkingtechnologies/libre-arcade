# Changelog

## Unreleased

- Joined the Libre Arcade collection: restructured into the shared
  `public/` → `game/` layout, added `dev`/`build`/`start`/`lint` npm scripts
  (built on this project's own `tools/serve.mjs`, parameterized to accept a
  root directory, plus a new `tools/build.mjs`) and an ESLint config, and
  `PROVENANCE.md`/`SOFTWARE_ARCHAEOLOGY.md` linking back to the collection's
  own philosophy document. Independently re-verified the archive's SHA-256
  and read `COPYING`/a source header/a `LICENSE-KIND.FILES` notice directly
  rather than relying on the existing audit's summary alone. Fixed 8
  pre-existing lint findings (5 empty `catch {}` blocks given explanatory
  comments, 3 unused imports removed — no behavior change). Updated one
  existing test's dependency-count assertion to allow the shared collection
  lint tooling as a devDependency, since it previously asserted zero
  devDependencies of any kind. No gameplay or parity content changed.

## 1.0.3 — obsolete URL artwork hotfix

- Removed only the obsolete `www.losersjuegos.com.ar` text from the runtime copy of `pres_losers.jpg`.
- Preserved the historical `pres_losers.jpg` unchanged under `/reference/ceferino-0.97.8/data/ima/`.
- The runtime image remains the original composition, dimensions and artwork; no replacement logo, new characters or redesign were introduced.
- Updated asset provenance documentation and regression tests so this single intentional derivative is not mistaken for a byte-identical historical asset.
- No gameplay, timing, physics, levels, controls, audio or other historical graphics changed.

## 1.0.2 — gaucho sprite geometry hotfix

- Fixed `gaucho.png` slicing to match `libgrafico.cc`: **3 rows × 8 columns**, with control point **(43, 105)**.
- Restored the historical **110×110 px** player frames; the previous 4×6 definition produced fractional 146.67×82.5 crops, visible flicker, partial sprites and misleading movement.
- Added sprite-sheet divisibility validation to the browser asset loader so invalid row/column metadata now fails fast instead of rendering corrupted frames.
- Added source-derived regression tests for gaucho geometry, hotspot, frame crop and destination anchor.
- No physics, 100 Hz simulation, levels, collision logic, audio, or historical asset bytes changed.

## 1.0.1 — renderer hotfix

- Fixed New Game crash caused by the graphics loader registering `gaucho.png` as `player` while the renderer requested `assets.gaucho`.
- Added a renderer regression test that instantiates the gameplay renderer with the loader asset contract and verifies the gaucho is drawn.
- No gameplay, timing, level, audio, or historical asset data changed.

## 1.0.0 — parity freeze

- Froze the source-derived 0.97.8 gameplay and shell behavior as the browser parity baseline.
- Promoted the 12 WAV effects loaded by historical `audio.cc` into active runtime assets after a separate license/provenance audit.
- Preserved SDL_mixer channel-0 semantics: a new effect interrupts the currently playing effect.
- Added sound events for shots, ball hits, life loss, rope/trident ceiling contact, block breaks and item pickups, plus historical menu tick/select sounds.
- Kept `menu.xm` disabled because its embedded MID2XM/General-MIDI-style sample provenance cannot be independently reconstructed.
- Documented the historical `Mix_Chunk *sonidos[11]` versus 12 loaded sounds out-of-bounds defect without reproducing it.
- Added a persistent sound-effects option.
- Hardened localStorage access for privacy/restricted environments.
- Added pause/input clearing on blur, `visibilitychange` and `pagehide`.
- Added guarded fullscreen handling, image decode fallback, explicit loading UI and recoverable asset-load failure UI.
- Added correct `audio/wav` MIME handling to the bundled static server.
- Expanded automated coverage for audio integrity/playback semantics, storage failure tolerance and production shell safeguards.

## 0.3.0 — complete game-shell milestone

- Added the six-screen original introduction and six-screen ending with source-faithful 100 Hz step thresholds.
- Added the original menu background, title graphics and `simple_sprite` title entrance behavior.
- Added How to Play using the original `how_to_play.png` artwork.
- Added browser-adapted Options (fullscreen, touch controls, replay intro).
- Added the three-page credits flow.
- Added seven-entry high-score persistence using the exact default table from `utils.cc`.
- Preserved strict `>` high-score qualification and original insertion ordering.
- Added Game Over continue semantics: score/lives reset while the extra-life threshold remains untouched, as in 0.97.8.
- Added historical `JU`, `SJ` and `BO` cheats.

## 0.2.0 — gameplay parity milestone

- Reworked the game state machine from the original `juego.cc` process flow.
- Added exact normal/quick message lifetimes derived from `fuente.cc`.
- Added level-intro, timeout, life-loss and level-complete timing phases.
- Preserved the historical freeze, repeated-item, breaking-block and linked-list shot-slot quirks.
- Added source-faithful pause/resume keyboard behavior.

## 0.1.0 — archaeological baseline

- Preserved the original 0.97.8 tarball and extracted sources.
- Completed GPL/source-header and asset-directory license audit.
- Added browser-native Canvas core, original levels and active historical graphics.
- Quarantined unresolved audio/font assets pending separate audit.

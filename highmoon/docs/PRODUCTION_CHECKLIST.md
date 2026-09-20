# Production readiness checklist

## Green

- [x] Historical physics/AI regression suite passes.
- [x] 100-seed procedural galaxy invariant test passes.
- [x] 3000-frame CPU-vs-CPU smoke test passes without NaN/deadlock.
- [x] Canonical CPU oracle still matches 7 candidates and RNG index 12585.
- [x] No historical GIF/WAV/JPG/MP3/OGG/FLAC assets in release tree.
- [x] No external runtime URL/dependency and no `Math.random()`.
- [x] Clean-room procedural audio and Canvas presentation.
- [x] Audio contract exercises every sound event with deterministic procedural noise and no historical RNG usage.
- [x] Refined sound design: filtered explosions/impacts, differentiated weapons, spatial Wormhole/warp and short victory fanfare.
- [x] Consumer UI contains no seed/debug/oracle/release-candidate clutter.
- [x] Real modal menu with mode, difficulty, galaxy, audio, language, fullscreen and restart.
- [x] Menu pauses safely and game shortcuts cannot act behind it.
- [x] Desktop 1366×768, 1440×900 and 1366×600 layout: no X/Y overflow.
- [x] Mobile portrait 390×844 and 375×667: no X/Y overflow.
- [x] Mobile landscape 844×390: no X/Y overflow; compact overlay controls.
- [x] Menu remains operable in all tested viewports; short screens scroll inside the modal (not the game page).
- [x] Touch controls, safe-area insets and reduced-motion support.
- [x] IT/EN interface.
- [x] Welcome menu before first simulation tick, three modes selectable before Play, and a Play button always visible at 375×667.
- [x] IT/EN gameplay instructions and Credits accessible from the menu, original author and both project links credited.

## Browser and gameplay verification

- [x] Winner event, game-over timer/reset and all player modes covered by `tests/release-scenarios.mjs`.
- [x] Five CPU difficulties exercised for 2,200 logic frames each.
- [x] Chromium actual Canvas/game-app, desktop layout and two-player keyboard shot.
- [x] Chromium emulated mobile touch charge/release, menu, IT/EN and real Web Audio Context `running`.
- [x] Updated first-launch menu verified in Chromium with in-memory ES modules on 1366×768, 390×844, 375×667 and 844×390: no tick before Play, modal pause, language switch, mode selection and visible Play.
- [x] HTTP 200 static server smoke of HTML/CSS/JS on localhost via curl (Chromium navigation blocked by environment policy).

## Before tagging 1.0.0

- [ ] Manual live Firefox smoke test on a normal user machine.
- [ ] Manual Safari/iOS smoke test, especially Web Audio unlock and touch hold/release.
- [ ] Live Chromium smoke test after deployment (actual app and Web Audio tested via an in-memory document; HTTP navigation is blocked in this environment).
- [ ] Deploy to the actual Libre Arcade static hosting path and verify cache/relative paths/fullscreen.
- [ ] Final art-direction sign-off on the clean-room vector look.

No remaining known blocker from covered simulation/AI regressions, media exclusion or tested layouts; complete parity, untested devices and actual deployment are not certified.

## Artwork
- [x] Five planet types + UFOs rendered as new procedural graphics.
- [x] No upstream GIF/PNG/WAV pixel/PCM data added.
- [x] Historical media inventory and separate clearance status recorded.
- [x] Chromium isolated procedural-art drawing smoke test; integrated browser navigation blocked by host.
- [ ] Integrated Firefox/Safari/iOS game and audio smoke tests pending.

# Archaeology notes

## Historical baseline

Nova Pinball was written by Wesley "keyboard monkey" Werner in 2015. This restoration freezes release v0.2.3 as the executable baseline while retaining v0.2.2.2 as an earlier comparison point.

The web port is a clean reimplementation. It does not execute or translate the original Lua runtime, and it does not include the quarantined original media.

## Credit provenance

The archaeological record preserves the upstream author's own credit chain rather than reducing the project to a single author line. Wesley Werner is the original game author; the later project page credits Eric Ahnell for the 2019 LÖVE 11.2 compatibility update. Upstream also explicitly credits Beyond, Sizenko Alexander, Nate Halley, Steve Dekorte and Tomas Pettersson for historical third-party work used by Nova Pinball.

See `UPSTREAM_CREDITS.md` for roles, links, engine-repository lineage and the Software Heritage reference. Those historical credits are preserved even when the corresponding asset is quarantined from the public web distribution.

## What is preserved in the restoration

- exact table component definitions converted from `nova.pinball` to JSON;
- original dimensions and ball start position;
- original physics constants where the browser engine has a direct equivalent;
- original one-way gate semantics;
- original launch-lane slingshot behavior;
- original flipper angle limits;
- original 6-ball and 3-nudge/TILT rules;
- historical dynamic Matter Jettison mission insertion after the first main cycle;
- true simultaneous multiball and lowest-ball camera tracking;
- per-ball tag cooldown and ball-specific Black Hole lock/release.

## What is reconstructed

The browser collision solver and rendering are new code. LÖVE Physics/Box2D is not embedded. This is deliberate so the project remains framework-free and client-side, but it means mechanical parity must be validated empirically against the original executable.

## Asset policy

The restoration uses only procedural Canvas rendering. Original fonts, music and images are not needed to test the mechanical port. See `reference/MANIFEST.md` for quarantine notes.

## Prototype 0.6 presentation layer

The historical score model is preserved but persistence is clean-room JSON/localStorage rather than `pickle.lua`. The original audio files are not copied: the browser build synthesizes its own effects at runtime with Web Audio. Menu/pause behaviour follows the original concepts while adapting desktop-only actions to the browser.

## Prototype 0.7 / RC1 presentation layer

The 0.7 pre-RC adds only clean-room presentation and browser UX: generated stars, particles, score popups, responsive touch layout, Fullscreen API support and rebalanced procedural Web Audio. No quarantined upstream font, image, WAV or tracker module is copied into the web package. Gameplay constants and mission order remain tied to the v0.2.3 baseline.


## RC1 packaging

The release candidate adds explicit GPL-3.0-or-later metadata, a provenance `NOTICE.md`, a release audit, dedicated `tests/`, and corrected menu/pause navigation. It does not introduce new gameplay or historical media.


## RC2 public-distribution policy

RC2 formalizes the conservative media decision. The historical tracker soundtrack is part of the preserved record, but it is not included in the public web package because the surviving release materials do not document redistribution terms clearly enough for reuse in a modified web restoration. The original release archives are likewise not embedded in `/reference`; the repository keeps hashes, provenance and upstream download locations instead. This decision does not alter gameplay, physics or scoring.


## RC3 browser hardening

RC3 is intentionally non-mechanical: no gameplay or physics constants change. It guards browser persistence so blocked storage cannot prevent startup or scoring, adds an in-memory session fallback, and automatically releases held flippers/pauses when browser focus is lost or the page is hidden. These changes are browser-safety adaptations rather than historical gameplay modifications.


## RC4 audio and fullscreen hardening

RC4 does not alter historical mechanics. The web-only SFX layer now waits for AudioContext resume to complete before emitting an effect, addressing browsers that begin Web Audio in a suspended state. The clean procedural effects are also raised to a more practical master level; no upstream WAV or tracker audio is copied. Fullscreen footer layout is widened/kept on one line as a browser UI adaptation.

## RC5 source-and-asset fidelity pass

RC5 returns to the v0.2.3 Lua sources and bundled artwork as a *reference*, without redistributing those media. The audit found that earlier browser builds had simplified a meaningful portion of the presentation layer: the ball-cursor menu, pre-launch table pan, in-canvas Score/Balls strip, 36 px green LED message queue, Mission Hints setting, teal pause panel, animated About presentation and the scrolling Game Over transition.

Those behaviours are now reimplemented cleanly. The table renderer also follows the original palette and visual hierarchy more closely (purple radial field, dark-blue structures, grey/pink flippers, yellow/purple kickers, metallic/yellow bumpers and black/blue NOVA inserts). See `docs/UI_PARITY.md` and `docs/ASSET_REFERENCE.md`.

This fidelity pass does not copy the original raster pixels, fonts, WAVs or tracker music and does not modify the frozen mission/physics/scoring rules.


## RC6 audio and typography fidelity pass

RC6 re-audits the original audio calls rather than treating the historical WAV folder as a generic effects pack. The v0.2.3 release contains 19 WAV files, but source inspection shows that 18 are actually referenced at runtime; `powerup-2.wav` is present but unused. The public restoration continues to exclude those WAV bytes and instead synthesizes clean equivalents for their historical roles, including Black Hole lock/release, Hydrogen/Fusion cue, Timewarp, Wormhole/Wormhole Close and Supergravity Bonus.

The historical font binaries also remain excluded. Instead of the earlier browser fallback font, RC6 uses a clean procedural 5×7 dot-matrix renderer for the in-canvas LED/HUD language.

The Beyond tracker soundtrack is still not redistributed. RC6 adds three optional modern CC0 background loops as a clearly separated modernization. `None` remains the default archival setting. Provenance, licenses and hashes are in `public/assets/music-modern/CREDITS.md` and `docs/MODERN_MUSIC.md`.

# Changelog

## RC6 — final visual parity

- Restored `showMessage` to one 16-pixel world column per processed tick; RC5 visually advanced only one column every two ticks even though the 32-tick kernel state machine was correct.
- Preserved the live camera fine-scroll phase for `LEVEL CLEAR!` / `OUT OF FUEL!`: message columns now begin at `-(GAME_CAM_X & 15)` instead of snapping to screen x=0.
- Recreated the tick-17 transition into the blank alternate nametable at the right edge and applied the same fine-scroll phase to the raster flash band.
- Corrected the mower low-fuel palette flash to the source rule `(GAME_FUEL >> 2) < 14` (raw fuel 0..55) and `FRAME_CNT & $10 != 0`; RC5 used threshold 58 and the opposite phase.
- Added camera-phase regressions for offsets 0, 1, 7 and 15 pixels plus reveal/blank-page and low-fuel flash tests.

## RC5 — title raster alignment fix

- Corrected the three title-screen raster split boundaries from the earlier coarse approximation (`27/90/153/178`) to the source-timed NTSC positions (`27/94/161/185`).
- The previous splits cut through the lower rows of **LAWN** and **MOWER**, making each word appear horizontally sheared during the entrance animation.
- The corrected splits fall in the blank gaps between **LAWN**, **MOWER** and **PRESS START**, preserving Shiru's intended opposite-direction word entrance without slicing glyphs.
- Kept the RC2 tile-0 blank nametable fix, RC3 PPU/CHR hardening and RC4 audio level hardening unchanged.
- Added frozen entry/mid/settled title visual oracles and dedicated split-placement regressions.

## RC4 — audio level / mute hardening

- Audited all five music streams and all fourteen historical SFX against the actual Web Audio gain mapping.
- Kept every FamiTone register stream and all relative channel/SFX gains unchanged.
- Raised only the browser master gain from `0.72` to `1.50`; exhaustive music/SFX register scanning still bounds the worst linear Web Audio peak at `0.390` (about `-8.18 dBFS`) before the existing safety compressor.
- Added an 8 ms master-gain smoothing time constant for manual mute/unmute, avoiding hard gain discontinuities/clicks.
- Added focused audio-balance/headroom regressions; the frequent grass-cut noise remains intentionally subtle while warnings/impact SFX remain prominent.

## RC3 — PPU/CHR hardening

- Restored CHR animation during the pre-message `LEVEL CLEAR` / `OUT OF FUEL` countdowns, including the original NTSC skip behavior and changing delay threshold.
- Frozen CHR animation while pause is already active; the pause-entry tick still completes exactly as on the NES.
- Restored animated background pattern-bank switching on the `WELL DONE` final screen.
- Enforced the original sprite-0 split semantics: the top HUD and fuel bar always use pattern table 0.
- Recreated `showMessage`'s mid-frame nametable flash band using the original `GAME_FLASH_CNT` cadence, without synthetic black surfaces.
- Added six focused PPU/CHR regression tests and new visual references.

## RC2 — renderer transition fixes

- Fixed intermittent black-block artefacts in `OUT OF FUEL` / flow messages by restoring `showMessage`'s forced background pattern bank 0.
- Fixed the flashing black band on the title screen: the original cleared second nametable displays CHR tile #0 repeatedly; it must not be rendered as a solid black surface.
- Added regression oracles for both CHR-bank message rendering and title split/blank nametable rendering.

## M9 — Production Readiness / RC1
- Long-run kernel and FamiTone stress tests.
- Suspend Web Audio while the page is hidden, preventing held tones in background tabs.
- Modal background isolation and focus return.
- Final release-tree cleanup: deployable payload separated from preservation/audit material.
- Final syntax, asset, license and responsive/runtime checks.

## M8 — Release UX
- Touch controls, EN/IT wrapper, audio toggle, instructions/credits modal and responsive shell.
- Hardened optional localStorage handling.

## M7 — Audio and transitions
- Original FamiTone music/SFX streams interpreted through Web Audio.
- Source-faithful title movement, fades and palette transitions.

## M6 — Complete game flow
- All 10 levels, level-clear, out-of-fuel retry, finale and return to title.

## M5 — Canvas renderer
- Original CHR graphics, HUD, metasprites, scrolling and playable Level 1.

## M4 — Headless kernel
- Browser-ready JavaScript rules kernel with deterministic tests.

## M3 — Behavioral oracle
- Exact 10-level extraction, RNG vectors and numeric movement/fuel oracle.

## M2 — Baseline diff
- v1.1 competition ROM compared with v1.12 source baseline.

## M1 — Recovery
- Historical competition package and source archive recovered, hashed and licensed.

# M27 — Message fitting and player readability

Version: **1.0.0-rc.4**  
Date: **2026-10-12**

## Verdict

**GAMEPLAY / DETERMINISTIC CORE: UNCHANGED / GREEN**  
**TRANSIENT MESSAGE CONTAINMENT: GREEN (AUTOMATED)**  
**PLAYER VISUAL READABILITY: GREEN (IMPLEMENTATION), MANUAL VISUAL CONFIRMATION REQUIRED**  
**M26 PROCEDURAL AUDIO ENGINE: UNCHANGED / GREEN**  
**REAL DEVICE VISUAL + AUDIBLE SMOKE: EXTERNAL CHECK REQUIRED**

M27 responds to two defects found during the RC3 desktop smoke: transient feedback such as
`Missed call` could visibly escape its dark notification panel, and the protagonist still read as a
moving rectangle rather than a person. No gameplay rule, collision geometry, stage topology or audio
routing is changed.

## Message fitting

The feedback strip no longer uses low-resolution system-font `fillText`. It now reuses the clean-room
5×7 bitmap text renderer introduced for the HUD in M26. The strip:

- computes text width deterministically in logical canvas pixels;
- centers short messages such as `Missed call` inside the panel;
- wraps long IT/EN feedback to a maximum of two lines;
- normalizes accented Latin characters to their base bitmap glyph (`è` → `E`, etc.);
- keeps all glyph pixels inside the panel rather than relying on browser font ascender/baseline metrics.

This specifically removes the baseline-overflow mechanism visible in RC3.

## Protagonist rendering

The old body was essentially one `10×17` torso rectangle plus a head. M27 replaces only the renderer
with a new procedural 16×24 clean-room office-worker sprite composed from pixel rectangles:

- hair crown and directional side hair;
- face, eye and one-pixel profile nose;
- jacket with separate arms;
- white blouse/collar;
- A-line skirt;
- distinct legs and shoes;
- two alternating horizontal walk poses;
- left/right facing details;
- retained knocked-state tint, answer gesture and wisdom outline.

The sprite is still drawn directly by Canvas code. No original graphic, raster file, SVG, external
font or AI-generated asset is included.

## Gameplay invariance

`src/player.js` and `src/simulation.js` are byte-identical to M26. Therefore the certified 16×24
logical collision footprint, movement, wrapping, ladders, speed, interactions and campaign behavior
are untouched. M27 changes only presentation code and test/release metadata.

## Audio

`web/audio.js` is byte-identical to M26. The full M26 fake-`AudioContext` suite remains part of the
regression run, so all 16 procedural cues, mute/unmute and event routing are still exercised.
Physical speaker/headphone audibility remains an external-browser check.

## Automated results

- Full M9→M27 regression invoked by `npm test`: **293/293 PASS**.
- New M27 tests: **12/12 PASS**.
- JavaScript/module syntax checks: **56/56 PASS**.
- Local HTTP smoke: **200 OK**.
- Sampled audio/raster player assets: **0**.

See `M27_SUITE_SUMMARY.json` for the machine-readable summary.

## Next gate

Run RC4 in the same normal browser used to report the defects and verify first:

1. `Missed call`, long Wisdom feedback and IT equivalents remain entirely inside their panel;
2. the protagonist reads immediately as a small human/office-worker sprite and visibly walks;
3. Start/Ring/Answer/Miss/Pause/Resume audio remains audible;
4. desktop/mobile no-scroll behavior remains unchanged.

If those checks pass, no gameplay work is expected before final `1.0.0`.

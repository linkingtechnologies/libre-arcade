# Zooming Secretary — M14 HTML5 Shell

## Result

**M14: GREEN — first browser shell implemented.**

This is the first user-facing HTML5 milestone after the M13 implementation GO. It integrates the frozen gameplay core into a browser without importing any original NES media or level byte arrays.

## Included

- 256×240 virtual Canvas, CSS-scaled to the available viewport
- fixed 50 Hz logical scheduler, independent of render refresh rate
- keyboard controls: arrows / WASD
- touch D-pad using Pointer Events
- pause/resume and automatic pause on blur/visibility loss
- IT/EN UI
- simple HUD for calls, misses and remembered topic
- clean-room placeholder rendering for player, phones, cabinets, coffee, NPC, platforms and ladders
- a deliberately synthetic two-call training office
- full integration with the M12/M13 `Simulation` core

## Legal/media boundary

M14 contains **no** original ROM, CHR, maps, sprites, labels, manual, music, FamiTracker data or historical C/assembly sources. The training level geometry is newly created for the shell and is not a reconstruction of any original Zooming Secretary stage.

## Timing

The browser shell runs one logical gameplay tick every 20 ms (50 Hz). Rendering is driven by `requestAnimationFrame` and may run at a different refresh rate. Visibility loss pauses the shell instead of fast-forwarding hidden gameplay.

## Deliberate limitations

- placeholder artwork only
- no audio yet
- no original/certified level topology distributed
- no campaign/menu/ending flow yet
- no persistence yet

These are M14 scope boundaries, not missing core behavior.

## Test result

All inherited and new public tests pass: **72/72** (M9 15 + M10 15 + M11 10 + M12 12 + M13 8 + M14 12).

The local HTTP server returned `200 OK`. Automated Chromium navigation was blocked by the execution environment's administrator policy; see `M14_BROWSER_QA.md`.

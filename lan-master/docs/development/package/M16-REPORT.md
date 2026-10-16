# Lan Master — M16 responsive board enlargement

## Result

**PASS — release 1.0.1.**

M16 addresses the oversized empty area visible around the gameplay board on roomy displays. The internal renderer remains exactly 256×240; only the CSS display size of `#game` changes.

## Behavior

- Gameplay canvas is allowed to fill the available `.nes-frame` while preserving the 16:15 NES aspect ratio.
- Display size is capped at **512×480 (2×)** so common desktop layouts retain crisp, regular pixel doubling.
- On narrower viewports the canvas grows to the largest fitting width/height supported by the frame rather than falling back to the old fixed 256×240 display.
- Title and ending canvases are intentionally unchanged.
- The existing `image-rendering: pixelated/crisp-edges` policy remains active.

## Managed-browser evidence

- 654×639: game canvas **512×480**; no document overflow.
- 1280×960: game canvas **512×480**; no document overflow.
- 390×844: game canvas **376×352.5**; no document overflow.
- 320×568: game canvas **306×286.875**; no document overflow.
- Pointer coordinates continue to map through the existing bounding-rectangle transform, and the M14 playability gate remains green.

## Preservation boundary

Compared with M15, only `src/style.css` changes in the shipped runtime. `index.html`, `src/app.js`, core/levels/rendering/audio/transition modules and all archaeological reference files remain byte-identical.

The historical M14/M15 freeze tests were updated only to permit the exact known M16 stylesheet SHA-256 while continuing to reject changes to every other frozen runtime/reference file.

# UI direction — v0.3

## Goal

The v0.3 interface is the first visual identity pass. It deliberately does not copy a historical or commercial board pixel-for-pixel.

## Archaeological reuse policy

Historical board-game software is used for interaction patterns: visible turn ownership, a persistent player/status panel, a single obvious dice action, concise event feedback and a clear separation between setup and play.

No graphical assets or UI code from the reference projects are included in this package.

## Board geometry

The classic board uses an 8×8 inward square spiral. An 8×8 grid provides exactly 64 geometric positions: spaces 1–63 plus one decorative central medallion. Space 63 therefore lands immediately beside the medallion, giving the route a clear inward destination.

The geometry is generated in `src/ui/boardLayout.js` and covered by automated tests.

## Accessibility

- Player pieces differ by both colour and symbol.
- Special spaces include icons, not colour alone.
- User text is available in Italian and English.
- The layout scales down to narrow screens without requiring a separate mobile board definition.
- `prefers-reduced-motion` is respected by the stylesheet.

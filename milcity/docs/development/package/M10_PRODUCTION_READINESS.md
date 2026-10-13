# MilCity M10 — pre-release / production-readiness review

M10 does not change the parity-certified gameplay core. It is a release-cleanup pass over M9.

## Release-facing cleanup

- Removed "candidate" wording from the browser title and user-facing credits.
- Simplified the persistent footer to `MilCity · Libre Arcade`.
- Kept archaeology/provenance detail in Credits rather than on the main play surface.
- Preserved separate Instructions and Credits screens in English and Italian.
- Preserved the original menu flow, including Exit, without exposing QA controls.
- Reduced the minimum emulated-phone size from 180×240 to 120×160 so short displays can still fit the complete interface without page scrolling.
- Historical PNGs remain reference-only and are not imported by the browser.

## Automated release gates

1. Core parity suite.
2. M5 UI-flow suite.
3. M6 visual/static suite.
4. M7 timing/impact suite.
5. M8 parity scenarios.
6. M9 UX suite.
7. M10 production-readiness suite.

## Manual checks still recommended before tagging 1.0.0

- Chrome/Firefox/Safari desktop smoke test.
- Mobile portrait touch test at approximately 360×640 and 390×844 CSS px.
- Small/short desktop test around 1024×600 and 800×480.
- Full Easy match and one Madness match without console errors.
- Switch EN↔IT from main menu, instructions and during a game.
- Verify focus/touch responsiveness of every on-screen control.
- Compare a few key frames against MilCity 1.0.5 in a J2ME emulator when available.

These are external/browser-device checks, not known gameplay defects.

## Release status

**Code/gameplay:** release candidate quality.

**Historical asset redistribution:** still HOLD. The procedural renderer avoids making that an obstacle to publishing the browser restoration.


## M10.1 responsive correction
A real-browser screenshot exposed a responsive defect in M10: the CSS expression used to derive `--scale` relied on unsupported/invalid multiplication semantics, so the frame could fall back to its 120×160 minimum while the 240×320 inner UI remained unscaled. M10.1 moves scale computation to JavaScript, keeps 240×320 as the logical resolution, allows desktop enlargement up to 1.65×, and scales down only when the available stage requires it.

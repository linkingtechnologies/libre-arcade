# XO World M7 — Pre-release hardening

M7 keeps the certified M3 engine and game model unchanged and focuses only on browser UX, accessibility, packaging and viewport verification.

## Changes

- Fixed keyboard navigation so Left/Right never cross row boundaries.
- Added localized off-screen board instructions linked through `aria-describedby`.
- Made the live status atomic for assistive technology.
- Added graceful fallback if `localStorage` is unavailable.
- Added reduced-motion and no-hover media handling.
- Re-ran the full AI/model/browser/package gates.
- Added a responsive viewport contract covering short-height, phone-width, narrow-phone, safe-area and square-canvas constraints.
- Attempted real Chromium screenshots, but the container Chromium cannot initialize its DBus environment; no unverified screenshots are included.

## Historical fidelity

No rule, AI priority, random fallback behavior or terminal-state logic was changed in M7.

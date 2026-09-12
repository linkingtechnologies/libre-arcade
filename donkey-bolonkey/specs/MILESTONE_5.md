# Milestone 5 — production readiness

## Completed

- Reworked the browser shell into a fixed 100dvh layout with no document scrollbar.
- Added viewport-aware 4:3 canvas fitting based on the stage's actual available size.
- Added a dedicated bilingual **How to play / Come si gioca** dialog.
- Removed implementation/legal jargon from normal player-facing copy; technical detail remains in repository documentation.
- Added tap-to-continue behavior for warning, title, controls, credits and completed high-score screens.
- Show touch gameplay controls only while an active run can use them.
- Added a mobile-capable high-score name field so virtual keyboards can enter names while retaining the historical 22-character printable-ASCII constraint.
- Added screen-reader status announcements and focusable game canvas.
- Added a local SVG favicon, description metadata, no-referrer policy and a restrictive self-only Content Security Policy.
- Added production tests for EN/IT dictionary parity, required UI controls, local-only resources, no-scroll shell rules, non-technical player copy and quarantined-media isolation.
- Added UI refresh detection so automatic game-over/final/level state changes update DOM controls without waiting for another button press.

## Responsive verification

Headless Chromium layout checks were run for three UI states: intro, active gameplay controls and high-score name entry.

Viewports checked:

- 320×568
- 360×640
- 390×844
- 667×375
- 844×390
- 768×1024
- 1280×720
- 1366×768

For each state/view size:

- document/body remained within the viewport with no scroll overflow;
- top-menu buttons remained inside the viewport;
- the fitted canvas remained 4:3;
- gameplay/name-entry control docks stayed inside the fixed shell.

## Preservation boundary

The responsive shell, tap navigation, accessibility announcements and mobile name-entry field are browser adaptations. They do not alter gameplay state rules or the source-derived 60 Hz simulation.

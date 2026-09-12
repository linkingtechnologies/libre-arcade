# Production QA — 1.0.3 parity hotfix

## Automated gates

The release must pass `npm test` with no failures. The suite covers:

- legal/header checks and original tarball integrity;
- byte identity of active historical graphics, levels and WAV effects, except the documented URL-free runtime derivative of `pres_losers.jpg`;
- all 30 level records and randomized headless simulation;
- fixed-step timing, physics, collision order and historical quirks;
- intro/final/menu/high-score/continue/cheat behavior;
- audio event mapping and SDL_mixer-style single-channel interruption;
- localStorage failure tolerance;
- loading/fatal fallback UI;
- page visibility/focus pause guards;
- JavaScript syntax validation;
- zero runtime npm dependencies.

The bundled development server is also checked by serving the release over HTTP and requesting representative HTML, JavaScript, map, image and WAV files.

## Browser behavior hardening included

- 640×480 logical Canvas with responsive scaling;
- `overflow:hidden` at document level to prevent accidental page scroll;
- touch controls with safe-area support;
- pause and input clearing on blur, `visibilitychange` and `pagehide`;
- guarded localStorage access;
- guarded fullscreen calls;
- image decode fallback to normal load events;
- loading state and recoverable fatal-load screen;
- preloaded original WAV sound effects with a user mute option;
- no application framework, backend or runtime package dependency.

## External manual smoke checklist

The execution environment used to build this archive blocks browser navigation (`ERR_BLOCKED_BY_ADMINISTRATOR`) and its standalone headless Chromium process does not complete navigation. A genuine browser matrix therefore cannot be truthfully claimed from inside this container.

Before calling a hosted deployment browser-certified, open the static build in current Chrome/Edge, Firefox and Safari and check:

1. intro can be advanced/skipped and reaches the menu;
2. menu title animation completes and keyboard focus works;
3. new game loads level 1 and accepts keyboard controls;
4. sound effects play after user interaction and the sound toggle persists;
5. pause occurs when the tab loses visibility/focus;
6. fullscreen enters/exits where supported;
7. touch controls appear on a phone/tablet and no vertical scrollbar appears;
8. Game Over continue, high-score entry and final sequence work;
9. DevTools console stays free of errors.

This manual matrix is deployment QA, not an unresolved source-parity defect.

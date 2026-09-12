# Production readiness

This package is the production-candidate build for the **local/offline Njam 1.21 preservation target**. Network Host/Join is explicitly outside this release scope.

## Automated gates

Run:

```text
node test/core.mjs
node test/production.mjs
node --check src/main.js
node --check src/game.js
node --check src/editor.js
node --check src/highscores.js
```

The production test verifies required runtime files, DOM selector integrity, explicit asset references, non-empty sound effects, historical archive SHA-256 values and the absence of a runtime network transport.

## Hardening in this candidate

- High scores fall back safely when browser storage is unavailable or blocked.
- Touch controls are selected by pointer capability rather than screen width, so modern phones/tablets keep controls in landscape.
- Compact landscape controls reduce clipping risk on short touch viewports.
- Menu entries can be activated by one mouse click or tap; historical keyboard navigation remains unchanged.
- The Fullscreen utility is hidden when the browser does not support the Fullscreen API.
- The page remains a static, framework-free deployment with no required backend.

## Manual acceptance gate

Before calling a specific public deployment fully accepted, smoke-test that deployed URL on current Chrome/Edge/Firefox desktop and at least one Android Chrome and iOS Safari device. Confirm: no page scrollbar/clipping, menu and audio unlock after first interaction, one complete game in each local mode, high-score persistence, editor load/test/export/reimport, Fullscreen where supported, and zero console errors/404s.

The automated environment used to build this package cannot substitute for those physical/browser-specific acceptance checks.

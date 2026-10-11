# Production readiness — 1.0.0

Status: **PASS** for the Libre Arcade browser release.

## Functional gates

- generator and both solver paths ported from recovered 1.8 sources;
- deterministic M2 generator/solver oracle regression;
- 300 generated-puzzle uniqueness regression;
- M3 gameplay/persistence parity suite;
- M7 autosave/lifecycle suite;
- byte-identical Java 1.8 ↔ JavaScript save compatibility;
- M8 Web Worker isolation, timeout/cancel/restart/error handling;
- M9 responsive board smoke at desktop, mobile and 320×480 compact viewport;
- M10 Custom Puzzle and named Save/Load;
- M11 accessibility/storage/error hardening.

## Browser/UI hardening

- no vertical page scroll during the tested gameplay viewports;
- mouse, touch and keyboard paths;
- one tabbable grid cell at a time (roving focus);
- localized cell/board/control ARIA labels;
- conflicts reflected with `aria-invalid`;
- native dialogs labelled with `aria-labelledby`;
- reduced-motion and forced-colors CSS support;
- undo/redo disabled when unavailable;
- UI is made inert during worker operations;
- worker timeout/crash/busy/cancel states have user-facing messages;
- failed new-game generation restores the previous game timer/state;
- localStorage failures are contained by safe preference access and storage-layer error handling;
- Settings can reset saves, autosave and local preferences.

## Packaging

- no runtime framework or CDN;
- no external fonts or sounds;
- client-side only;
- historical reference files frozen with SHA-256 hashes;
- GPLv3 restoration licence plus LGPL original notices;
- no QA seeds, solver metrics, backtracking data or archaeology/debug controls in the player UI.

## Known intentional differences from the 2006 UI

The browser UI does not reproduce the 128×128 pointer-hitbox overlap or other presentation defects that are unrelated to generator/solver/gameplay parity. Expensive historical solving runs in a Web Worker to prevent UI freezes, while preserving the solver algorithm and output.

## Deployment note

Serve over HTTP(S). ES Modules and Web Workers are used; opening the HTML directly from `file://` is not the supported deployment mode.

## Sandbox browser-test note

The execution sandbox used during restoration blocks browser navigation to both `file://` and local HTTP URLs by administrator policy. The automated browser smoke tests therefore render the exact production HTML/CSS through Playwright `set_content()` for viewport/layout/accessibility checks. Engine, persistence, generator/solver and Worker behaviour are exercised by the JavaScript/Node test suites. A short manual smoke test on the final deployed HTTPS URL remains recommended after publication.

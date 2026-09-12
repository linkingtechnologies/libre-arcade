# Production readiness

## Release 1.1.0

Release 1.1.0 is the current browser package intended to be uploaded directly to a
static host such as GitHub Pages. It does **not** change the 0.3 gameplay/parity
baseline. Release 1.0.0 established the production shell; 1.1.0 adds English/Italian
localization inside that shell. Production changes remain confined to browser UI,
loading/preferences and documentation.

## User-facing browser reconstruction

The following items are intentional browser additions rather than claims about the
2013 Cocos UI:

- a **How to Play** screen derived from the original `README.txt` controls and game
  mechanics;
- responsive HTML menu controls over the preserved title image;
- a browser-safe Quit message, because ordinary web pages cannot reliably close
  their own tab;
- focus management for menu navigation;
- a loading state that keeps the menu inert until required images and fonts are
  ready;
- a no-JavaScript fallback message.

These additions do not change board state, scoring, AI decisions, RNG consumption,
weapon behavior, turn timing or win/loss rules.

## Browser robustness

- Original audio begins prefetching during startup, while Web Audio decoding waits
  for a user gesture as required by browser autoplay policies.
- Audio fetch/decode failures are isolated so one unavailable sound does not stop
  the game from loading.
- The music preference treats Web Storage as optional and still works when storage
  is unavailable or blocked.
- The fullscreen checkbox follows `fullscreenchange`, including browser-driven exits
  such as Escape/F11.
- Required image failures surface a concise startup error instead of exposing a
  half-working menu.
- The page includes same-origin Content Security Policy, description/referrer
  metadata and no inline event handlers.

## Static hosting

Serve the repository root over HTTP(S). No build step, backend or runtime package is
required. Paths are relative, so the game can be hosted from a GitHub Pages project
subdirectory as well as a domain root.

Do not test the production build through `file://`; native ES modules, fetch-based
audio loading and browser security rules are intended to run over HTTP(S).

## Release checks

Run:

```text
npm run check
```

This performs JavaScript syntax checks, the full regression/audit suite, and the
1000-seed deterministic AI stress run.

Release 1.1.0 has 65 automated regression/audit checks. Preservation checks still
verify both source archives, both expanded `/reference` trees and all original
browser asset copies byte-for-byte.

## Known non-blocking archival gap

The preserved Python 2.7/Cocos executable has still not been captured side-by-side
with the browser in a compatible archival runtime. Therefore 1.1.0 is production
ready as a browser restoration, but it does not claim pixel-identical rasterization
to the historical OpenGL executable. See `visual-parity.md` for the future capture
protocol.

## Localization

Production release 1.1.0 adds a bilingual browser shell (English/Italian). Menu labels, help, accessibility labels, status messages and all player-facing Canvas text are localized. English is the fallback and preserves the original wording used by the 2013 game. Italian is selected automatically only when no saved preference exists and the browser locale is Italian. The preference is optional local state and does not affect deterministic gameplay, RNG, AI, timing or `/reference`.

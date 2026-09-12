# Port status

## Current milestone: 0.2.4 public-clean release

Implemented and verified against the audited Yanoid 0.3.0 source tree:

- Contest logical field (800×600) and responsive browser scaling.
- All nine original Python map scripts rewritten in JavaScript.
- Exact eleven-stage `maplist.py` progression.
- Dynamic `map8.py` behavior, including the historical double `basic_brick_hit()` chain callback.
- Original paddle acceleration/deceleration constants and the unusual `SetPaddle()` initial current speed of 2.0.
- Original paddle/static wall response and min/max tracking order.
- 0.3.0 bounding-box collision metadata and ball reflection equations.
- Y-sorted first collision-response ordering for overlapping targets.
- Per-map ball acceleration and 10 ms maximum physics sub-step.
- Native one-update delayed removal/accounting for balls and breakable bricks.
- Five-life flow, CUT reset behavior and simultaneous last-ball/last-brick MAPDONE overwrite semantics.
- Normal, three-hit and indestructible bricks.
- Original power-up table, including the 19% spawn condition and weighted-selection bugs.
- Multiball, life +/-1, score bonuses/penalties, normal/super shots and paddle resizing.
- `REMOVEALL` behavior, including the fact that truly indestructible `brick-stay` objects remain indestructible.
- Original shot duration/cooldown timing and per-level three-minute time bonus.
- Original 1500 ms map intro, 1500 ms lost-ball cut and two-phase 1500+1500 ms level-complete presentation timing.
- Original per-level elapsed-time HUD and shot countdown, adapted to the web UI.
- Selected contest gameplay graphics; historically third-party fonts/audio are excluded.
- New Web Audio effects plus a newly authored 64-step tracker-style chiptune instead of ambiguous historical audio/music. Audio is explicitly unlocked from user gestures before playback to comply with modern browser autoplay policies.
- New original 5×7 bitmap font for in-canvas messages.
- Independent persisted Effects/Music controls, with defensive fallback when browser storage is unavailable or corrupted.
- Desktop keyboard and responsive touch controls, with focus-loss input release and modal-safe keyboard handling.
- English/Italian UI, pause, fullscreen and local high score.

## Public-release hygiene

- Neither upstream tarball is redistributed (a byte-identical archive would still contain the ten omitted files below).
- `reference/yanoid-0.3.0/` preserves the extracted, SHA-256-verified 0.3.0 source in full, **except** ten specific files with genuinely unresolved or third-party-reused provenance: the two SDL_Console font PNGs, `yanoid.xm`, and seven named WAV files (see `THIRD_PARTY_NOTICES.md`). Reused *code* areas (SDL_Console source, the libsge collision fragment) are preserved as historical evidence, unlike the reused *media*.
- `reference/yanoid-0.3.5/` is not extracted or redistributed at all.
- `.gitignore` prevents the raw `.tar.gz` archives from being accidentally committed.
- Automated repository tests (`test/repository.test.js`) enforce the absence of the ten specific omitted files and both raw archives anywhere in the repository.

## Verification completed

- The independently audited upstream archive hashes remain recorded in `reference/UPSTREAM_SHA256SUMS`.
- JavaScript map entity type/position/sprite lists were compared during the audit with execution of all nine original Python map scripts.
- Automated Node tests cover progression, map counts, paddle physics, collision response, native removal timing, power-up quirks, map8 callbacks, state-transition edge cases, public-release hygiene and referenced asset presence.
- Presentation tests cover the new font atlas, chiptune data, Web Audio scheduling, modal/input behavior and storage fallback.
- A deterministic 50,000-tick fuzz run completed without non-finite state, crash or runaway entity growth.
- All JavaScript source and test files pass `node --check`.
- The automated suite currently passes 38/38 tests.

## Remaining validation before claiming 100% executable parity

A native Yanoid 0.3.0 executable has not been run side-by-side with this port in the current environment. A fresh browser end-to-end navigation run is also blocked by the managed Chromium policy in this environment, so browser-specific layout/audio smoke testing should still be performed once on the deployment browser. The source-level behavior is modeled in detail and protected by tests, but subtle SDL/Python/runtime ordering or rendering differences can only be ruled out by a native differential run.

Until that comparison exists, the project should be described as **source-audited, parity-oriented and production-ready for public static hosting**, not as byte/executable-identical behavior.

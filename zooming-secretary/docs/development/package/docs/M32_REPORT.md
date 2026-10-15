# M32 — Ladder-input reliability + vertical-wrap guidance

Version: **1.0.0-rc.9**  
Date: **2026-10-13**

## Verdict

**REPORTED LADDER LOCKUP: REPRODUCED**  
**BROWSER INPUT FIX: GREEN**  
**ORDINARY UPWARD LADDER STRESS: GREEN**  
**HISTORICAL TOP/BOTTOM LADDER WRAP: PRESERVED**  
**DETERMINISTIC GAMEPLAY CORE: UNCHANGED**  
**MANUAL BROWSER FEEL CHECK: RECOMMENDED**

M32 addresses the RC8 report that, after playing for a while, pressing Up could stop climbing ladders.
The failure was reproduced without changing the stage geometry or certified movement core.

## Root cause

The deterministic player core deliberately preserves the original opposite-input rule: if **UP and DOWN are both held**, neither vertical direction is accepted. That behavior is part of the frozen gameplay contract.

The browser layer previously represented the four directions as independent booleans. A stale `DOWN=true` could survive a missed `keyup`, focus/visibility transition, touch/pointer edge case or similar browser event sequence. A later Up press would then deliver **UP+DOWN** to the core. The core correctly cancelled the conflicting vertical intent, but to the player this looked like a broken ladder.

M32 fixes the browser boundary rather than changing historical gameplay:

- a fresh **UP** press clears stale DOWN;
- a fresh **DOWN** press clears stale UP;
- keyboard autorepeat does not reassert an older direction as a new intent;
- keyboard release clears the corresponding direction;
- touch/pointer uses the same direction adapter;
- pause, stage transitions, title transitions, window blur and hidden-tab transitions clear held directions.

LEFT+RIGHT remains independent so M32 does not silently rewrite unrelated source-faithful input semantics.

## Ladder stress coverage

M32 adds a production-movement stress test over every ordinary upward ladder shaft found in the eight playable stage maps. Each shaft is tested at fixed-point speeds **16, 24 and 34** (initial, normal and maximum coffee-boost target speed). All tested upward entries climb successfully.

The regression also reproduces the reported stuck state directly on the real Day 1 ladder: with stale UP+DOWN the certified core does not move vertically; applying a new browser UP intent clears DOWN and the same ladder immediately climbs.

## Original vertical-wrap ladders remain directional

Some later maps deliberately use ladders that continue through the top or bottom screen boundary. M32 does **not** convert these into generic bidirectional stairs. The original wrap behavior remains:

- ladder leaving the **bottom**: continue **DOWN** to wrap upward;
- ladder leaving the **top**: continue **UP** to wrap downward through the historical vertical route.

The level intro guidance now explains this in English and Italian for the stages that use the edge-wrap route.

## Scope boundary

M32 changes only the browser input adapter, browser routing/held-state cleanup, help copy, tests and release documentation.

The following remain byte-identical to the already certified builds:

- `src/player.js` — deterministic movement/collision core;
- `src/simulation.js` — gameplay simulation;
- `web/renderer.js` — M28 clean-room gameplay renderer;
- `web/audio.js` — M26 procedural audio engine.

## Automated result

- Full M8→M32 regression: **349/349 PASS**.
- New M32 tests: **12/12 PASS**.
- JavaScript/module syntax checks: **64/64 PASS**.
- Local HTTP smoke: **200 OK** for `/`, `web/app.js`, `web/directional-input.js` and `web/audio.js`.
- Local ES-module dependency audit: **83 relative imports / 0 missing files**.
- Forbidden raster/sampled/historical media scan: **0 files**.

A normal-browser human check is still useful because the reported problem was experiential/browser-input related, but the concrete stuck-state failure is now reproduced and covered by regression.

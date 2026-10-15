# M29 — Real playability certification

Version: **1.0.0-rc.6**  
Date: **2026-10-12**

## Verdict

**CORE PLAYABILITY: GREEN**  
**DAY 1 INPUT-ONLY PLAYTHROUGH: GREEN — 10/10, 0 misses**  
**DAY 2 INPUT-ONLY PLAYTHROUGH: GREEN — 15/15, 2 misses**  
**ALL INTERACTABLE MOVEMENT REACHABILITY: GREEN — 56/56**  
**GAMEPLAY / RENDERER / AUDIO CODE: UNCHANGED FROM M28**  
**MANUAL BROWSER FEEL / PHYSICAL AUDIO: STILL EXTERNAL**

M29 was created specifically to answer a question that ordinary regression tests could not answer:
can the reconstructed game actually be navigated with normal directional input rather than by tests
that place the player directly on an object?

The answer is **yes** within the scope certified below.

## Input-only playthroughs

A small deterministic controller was run through the real `Simulation` using only the same directional
input states available to a player. It never assigns player coordinates, phone state, score or stage
status.

- **Day 1:** fully reactive controller; it waits for a real ring, visits the requested cabinet when
  necessary, climbs the real ladders and reaches the ringing phone. Result: **WON**, 10 answered,
  **0 missed**, 2,172 ticks.
- **Day 1 idle-loss control:** no directional input. Result: **LOST** at the third missed call; miss
  ticks remain exactly **855, 1107, 1689**.
- **Day 2:** input-only navigation through the three-floor map with the live Chief NPC and normal
  three-miss limit. Result: **WON**, 15 answered, **2 missed**.

These are not coordinate-forced completion tests.

## Whole-campaign movement reachability

M29 also performs an exhaustive movement-state search from the real spawn of every playable stage.
The search calls the production `tickPlayerMotion()` routine and expands only LEFT/RIGHT/UP/DOWN
input states. It performs no coordinate teleport and does not modify map cells.

Result: **56/56 interaction positions are reachable**, covering every phone, every topic cabinet,
every coffee pickup and all six Dream table positions plus the Dream phone position.

This is especially useful for the unusual historical maps that use falls and vertical ladder wrap;
a naive floor-by-floor navigator can incorrectly report some of those positions as unreachable.
The exhaustive input search does reach them.

See `m29-reachability-audit.json` and `../tools/run-m29-reachability-audit.mjs`.

## Regression

- Full M8→M29 automated suite: **315/315 PASS**.
- New M29 certification tests: **10/10 PASS**.
- JavaScript/module syntax checks: **59/59 PASS**.
- Local HTTP smoke: **200 OK**.
- `src/player.js` and `src/simulation.js`: byte-identical to M28.
- M28 `web/renderer.js`: byte-identical.
- Verified M26+ procedural `web/audio.js`: byte-identical.

## What M29 does and does not prove

M29 proves that normal movement input can win the opening game, can complete the more complex Day 2,
and can physically reach every gameplay interaction point in all eight stages. Existing parity and
campaign tests continue to certify the complete Day 1→Ending rules/state progression.

It is **not** a claim that an automated human-like agent has naturally beaten every later stage and
Dream without oracle knowledge. Those stages are intentionally harder and contain NPC interference.
A final human playthrough remains valuable for difficulty/feel, as does the real-browser audible and
responsive smoke already requested by earlier RCs.

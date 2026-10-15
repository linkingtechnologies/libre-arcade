# M31 — Title screen + persistent ringing fidelity pass

Version: **1.0.0-rc.8**  
Date: **2026-10-13**

## Verdict

**TITLE-SCREEN STRUCTURE: GREEN / CLEAN-ROOM**  
**TITLE RNG CADENCE: GREEN**  
**72-TICK POST-START TRANSITION: GREEN**  
**PERSISTENT RINGING POLICY: GREEN**  
**DETERMINISTIC GAMEPLAY CORE: UNCHANGED**  
**PHYSICAL SPEAKER/HEADPHONE OUTPUT: EXTERNAL MANUAL CHECK**

M31 closes two fidelity gaps found during human RC review: RC7 had no real initial title state and the phone emitted only a short sound when `RING_START` occurred.

## Title screen

The browser now opens on a dedicated title screen instead of immediately showing the Day 1 intro. The title presentation is newly authored HTML/CSS using simple pixel-like office geometry; no original NES title/logo pixels, CHR tiles, screenshots or later-port artwork are bundled.

Behavioural fidelity added in M31:

- title idle advances a dedicated `Rng8` with one `rand16()` per logical title tick;
- `rand16()` consumes two consecutive `rand8()` steps, matching the frozen archaeology oracle;
- pressing Start captures the title-derived RNG state for Day 1;
- a **72 logical tick** transition is preserved before the existing Day 1 onboarding card;
- keyboard Enter/Space and a real accessible Start button are supported; pointer/touch can also start the title state;
- EN/IT switching updates title copy without importing historical title media.

The deterministic core remains isolated: no DOM, title timing or audio scheduling was added to `src/simulation.js`.

## Persistent phone ringing

The existing procedural `ring` cue in `web/audio.js` is unchanged. M31 adds a browser-layer ringing policy (`web/ringing.js`):

- `RING_START` still plays the cue immediately;
- while at least one phone remains in heat/ringing state, the cue repeats every **50 logical gameplay ticks**;
- no repeat is generated while paused because gameplay ticks do not advance;
- once no phone is ringing, repetition stops naturally;
- multiple simultaneous calls share one repeat cadence, preventing an unreadable stack of overlapping ringtone loops.

This affects presentation only. Phone states, counters, answer windows, miss timing and call scheduling remain owned by the certified simulation.

## Scope boundary

M31 changes browser presentation/routing only: `web/app.js`, `web/ringing.js`, `index.html`, `web/style.css`, release documentation and M31 tests. `src/player.js`, `src/simulation.js`, `web/renderer.js` and `web/audio.js` remain byte-identical to M30.

## Automated result

- Full M8→M31 regression: **337/337 PASS**.
- New M31 tests: **12/12 PASS**.
- JavaScript/module syntax checks: **62/62 PASS**.
- Local HTTP smoke: **200 OK**; title-screen markup is served.
- Forbidden raster/sampled/historical media scan: **0 files**.

The remaining manual RC work is visual/feel smoke in a normal browser and verification that repeated ringing is physically audible through real speakers/headphones at a useful volume.

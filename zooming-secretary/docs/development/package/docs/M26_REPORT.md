# M26 — UI polish and Web Audio verification

Version: **1.0.0-rc.3**  
Date: **2026-10-12**

## Verdict

**GAMEPLAY / DETERMINISTIC CORE: UNCHANGED / GREEN**  
**PAUSE UI POLISH: GREEN**  
**HUD RASTERIZATION FIX: GREEN**  
**WEB AUDIO SCHEDULING / EVENT ROUTING: GREEN**  
**REAL DEVICE VISUAL + AUDIBLE SMOKE: EXTERNAL CHECK REQUIRED**

M26 is a focused release-candidate polish pass triggered by the first normal-browser screenshot of
M25. It does not add gameplay rules or change any certified stage topology.

## UI changes

The M25 pause screen exposed two redundant pieces of UI. M26 removes both:

- the top-bar Pause/Resume action is now visible only while gameplay is actively running; while the
  pause card is open, the card's **Resume** action is the single resume control;
- the pause card no longer repeats the complete footer help line. It now shows only the concise
  bilingual resume hint (`P / Esc`). The permanent footer remains the full keyboard reference.

## HUD text rendering

The game intentionally displays the 256×240 logical canvas at a corrected 4:3 presentation ratio.
System-font text rasterized at the low internal resolution can therefore become soft/fringed when
stretched by the browser. M26 replaces only the HUD labels/counters with a small clean-room 5×7
bitmap renderer. Gameplay geometry, Canvas resolution and the 4:3 display correction are unchanged.

No font file or external asset is added.

## Sound verification

The runtime still uses the clean-room `AudioEngine` and synthesizes every effect through Web Audio;
there are no sampled or historical sound files.

M26 adds a deterministic fake-`AudioContext` harness that verifies:

- creation and resume of a suspended audio context;
- master gain creation and mute/unmute behavior;
- scheduling of all 16 runtime cues: `start`, `ring`, `answer`, `topic`, `miss`, `coffee-ready`,
  `coffee`, `teleport`, `ghost`, `knock`, `wisdom`, `win`, `lose`, `pause`, `resume`, `ui`;
- the `knock` cue contains both noise and tonal components;
- application event routing reaches the complete sound vocabulary;
- muted audio schedules no new sources;
- no `.wav`, `.mp3`, `.ogg`, `.flac`, `.m4a`, `.ftm` or `.nsf` media is bundled.

This establishes that the Web Audio code paths and scheduling are functional. The container has no
trustworthy physical audio output path, so speaker/headphone audibility and perceived volume remain
part of the external browser smoke.

## Automated results

- Full M9→M26 regression: **281/281 PASS**.
- New M26 tests: **12/12 PASS**.
- JavaScript/module syntax checks: **55/55 PASS**.
- Local HTTP smoke: **200 OK**.
- Forbidden sampled/historical audio files: **0**.

## Browser limitation

A Chromium `--dump-dom` retry still times out before DOM output in this container. The errors are the
same environment family already recorded by M24/M25: missing system/session D-Bus services and
UPower, followed by zygote termination. This is not counted as a browser pass.

## Next gate

Test RC3 in a normal desktop/mobile browser. In addition to the existing visual matrix, explicitly
confirm that at least Start, Ring, Answer, Miss, Pause/Resume and mute/unmute are audible and that
muting remains persistent after reload. If that passes and no new UI defect appears, the candidate
can move to final `1.0.0` without gameplay changes.

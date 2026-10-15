# M30 — Answer-mechanic onboarding and instruction clarity

Version: **1.0.0-rc.7**  
Date: **2026-10-13**

## Verdict

**ANSWER MECHANIC EXPLANATION: GREEN**  
**IT/EN ONBOARDING: GREEN**  
**RESPONSIVE OVERLAY POLICY: GREEN / STATIC**  
**GAMEPLAY / RENDERER / AUDIO: UNCHANGED**

M30 addresses a real usability gap discovered during the human RC review: a player could see a ringing phone but the UI did not clearly explain that Zooming Secretary has **no answer button**.

## What changed

- Day 1 now explicitly says that answering is automatic once the player reaches the ringing phone with the matching remembered topic.
- Every normal-stage intro shows a separate compact **How to answer / Come rispondere** rule card:
  1. observe the topic symbol on the ringing phone;
  2. touch the filing cabinet / schedario with the same symbol;
  3. touch the ringing phone;
  4. no Answer/Rispondi button exists.
- Dream uses a separate exception message because topic matching is bypassed there.
- The rule card disappears during gameplay, pause, win/loss and campaign-transition overlays, avoiding persistent UI clutter.
- `README.md` now documents the same mechanic.

## Scope boundary

M30 changes only `web/app.js`, `index.html`, `web/style.css`, release metadata/documentation and tests. The certified gameplay files `src/player.js` and `src/simulation.js`, the M28 renderer and the verified procedural audio engine remain byte-identical.

## Automated result

- Full M8→M30 regression: **325/325 PASS**.
- New M30 instruction tests: **10/10 PASS**.
- JavaScript/module syntax checks: **60/60 PASS**.
- Local HTTP smoke: **200 OK** and the new answer-rule element is served.
- Forbidden raster/sampled/historical media scan: **0 files**.

See `m30-test-report.json` and `M30_SUITE_SUMMARY.json`.

The remaining external RC checks are the same as before: normal-browser visual/feel smoke and physical speaker/headphone audio output.

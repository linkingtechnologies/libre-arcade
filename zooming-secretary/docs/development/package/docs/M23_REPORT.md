# M23 — Production-readiness pass

Status: **GREEN for code/distribution; browser visual automation not certified in this container**.

M23 does not change the M12-frozen gameplay model or add stages. It turns the complete M22
campaign into a publishable Libre Arcade browser package while keeping the M13 media boundary.

## What changed

### Player-facing UI

- Reworked top bar with Pause, Sound, Credits and IT/EN controls.
- Credits moved into a dedicated modal; historical attribution is not shown in the gameplay HUD.
- The Libre Arcade link appears only in Credits, not in the footer/gameplay area.
- Added Reset preferences for language/audio local storage.
- Ending copy is player-facing and no longer contains archaeology/restoration terminology.
- Main viewport remains no-scroll; touch layout and a compact landscape mode are retained.

### Final clean-room renderer

`PlaceholderRenderer` has been retired and replaced by `ArcadeRenderer`.

The browser still uses only programmatic shapes at the certified 256×240 virtual resolution,
but NPCs, phones, cabinets, coffee, tables, player and HUD now have a coherent production visual
treatment rather than the original neutral shell styling. No historical sprite/CHR image is
included or traced.

### Audio

M23 adds `web/audio.js`, a small Web Audio synthesizer. Sound effects are generated at runtime
from oscillators and short procedural noise buffers for:

- stage start;
- phone ring;
- answer;
- cabinet/topic pickup;
- missed call;
- coffee ready/pickup;
- Dream teleport;
- Ghost catch;
- ManBox knock;
- Dibrov wisdom;
- win/lose/pause/resume/UI feedback.

There are no WAV/OGG/MP3/FTM assets in the package and the sound engine has no network/runtime
dependency.

The 2019 OpenGameArt collection **NES 8-bit sound effects** by `shiru8bit` was re-checked as a
GREEN alternative source. The page states CC-BY 3.0 and CC0, says users may choose between them,
and states that the 81-effect collection includes sounds taken from Zooming Secretary among
other Shiru games. M23 does **not** bundle that ZIP because the build environment could not fetch
the binary archive; this is not a runtime blocker because M23 uses its own procedural Web Audio
layer.

Reference: https://opengameart.org/content/nes-8-bit-sound-effects

### Cleanup

- Removed public `window.__ZS_Mxx__` debug globals and `debugApi` exposure.
- Retained named internal stage starters only as normal campaign/UI routing.
- Kept regression tests and archaeology documentation in the source package; none is exposed in
  the player-facing UI.
- No AI-generated assets are used.

## QA

Full regression after M23:

- M8/M9 baseline: 15/15
- M10: 15/15
- M11: 10/10
- M12: 12/12
- M13: 8/8
- M14: 12/12
- M15: 14/14
- M16: 14/14
- M17: 16/16
- M18: 18/18
- M19: 19/19
- M20: 20/20
- M21: 20/20
- M22: 20/20
- M23: 18/18

**Total: 231/231.**

Additional static/runtime-host checks:

- 46/46 JavaScript/MJS files pass `node --check`;
- local HTTP server returns 200 for `/`;
- M13 media-policy scan remains green: no forbidden historical binary/media formats;
- no public debug global remains in `web/app.js`.

## Browser automation limitation

Chromium is installed, but the container's headless browser process repeatedly blocks while
trying to access unavailable DBus/UPower services and times out before producing a DOM dump or
screenshot. Therefore M23 does **not** claim automated visual/cross-browser certification.
Manual browser smoke testing remains the only release-candidate check outside this environment.

## Gate

- Gameplay parity: **GREEN / frozen**
- Campaign completeness: **GREEN**
- Player UI cleanup: **GREEN**
- Responsive/no-scroll policy: **GREEN (static/tested)**
- Credits / Libre Arcade link: **GREEN**
- SFX implementation: **GREEN**
- Media/licensing scan: **GREEN**
- Automated visual browser certification: **YELLOW — environment limitation**

M23 is therefore a **production release candidate** rather than a claim of cross-browser visual
certification.

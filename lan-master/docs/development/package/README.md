# Lan Master — 1.0.1 (M16)

Faithful HTML5 + plain JavaScript restoration of **Lan Master** by Shiru for Libre Arcade. The game runs entirely client-side, with no framework, server or external runtime dependency. Open `index.html` directly in a modern browser or serve the directory as static files.

## Release status

**Web restoration: PRODUCTION READY. Package status: 1.0.1.**

M16 is a presentation-only patch on top of the M15 1.0.0 final release. It enlarges the gameplay canvas when the viewport has room while keeping the 256×240 internal NES framebuffer, game logic, level data, rendering assets, audio and transition timing unchanged.

The final label certifies the preserved game behavior within the documented automated/browser scope. Physical Android/iPhone hardware, unrestricted `file://`/hosted navigation on every browser, and subjective speaker/headphone acceptance remain external field-validation items rather than claims made by this package. The separate native NES reproducible-build gate also remains an independent archaeology task.

### Included gameplay

- 50 historical levels and 49 level passcodes;
- secret `6502` ending and `68xx` sound diagnostic retained;
- corrected dual-channel connectivity;
- deterministic original RNG/scramble/degradation behavior;
- original title/game/ending CHR, nametables and palettes;
- original music data, 12 SFX and DPCM through the self-contained Web Audio player;
- original reveal/restart/clear/timeout/fade/wellDone transitions;
- responsive 256×240 internal framebuffer, displayed up to 512×480 on roomy viewports with no vertical page scrolling;
- mouse, touch and keyboard controls;
- EN/IT guidance and localized in-game pause/clear/timeout panels; original title/ending artwork remains historically English;
- dedicated Credits page with the Libre Arcade link;
- Reset settings action in Credits;
- no gameplay autosave: historical passcodes remain the resume mechanism.

## Controls

- Arrows / D-pad: move
- A or Z: rotate 90°
- B or X: rotate 270°
- Shift / SELECT: rotate 180°
- Enter / START: pause

## Final acceptance evidence

The managed-browser gate proves:

- **49/49** historical level passcodes open the intended levels;
- `6502` opens the historical ending;
- a complete **Level 1 → Level 50 → ending → menu** campaign traverses the production state machine;
- L1, L11, L25 and L50 are solved using the production pointer + keyboard control path;
- L11 is also solved on a 390×844 touch-emulated viewport using the visible A/B/SEL controls;
- EN/IT persistence and scoped settings reset work;
- no page JavaScript errors or mobile overflow occur in the tested paths;
- all gameplay/audio/graphics regressions remain green; M14/M15 freeze sentinels accept only the known M16 stylesheet delta;
- M16 responsive checks prove a 512×480 gameplay canvas at 654×639 and 1280×960, plus viewport-fit enlargement on 390×844 and 320×568 without page overflow.

The campaign gate uses the already-certified 50 solved witnesses only to provide solved board orientations; level completion, clear tables, hide/reveal transitions, progression, passcodes and ending are advanced by the production application state machine.

## QA

Run the complete static/regression suite with:

```bash
node tests/test-core.js
node tests/test-gfx.js
node tests/test-audio.js
node tests/test-integration.js
node tests/test-transitions.js
node tests/test-m11-integration.js
node tests/test-production.js
node tests/test-m13-ui.js
node tests/test-m14-release.js
node tests/test-m15-release.js
node tests/test-m16-release.js
```

Run the managed browser gates with:

```bash
python3 tools/m13-browser-smoke.py
python3 tools/m14-playability-gate.py
python3 tools/m16-responsive-gate.py
```

See `M16-REPORT.md` and `PRODUCTION_CHECKLIST.md`.

## Packaging

M16 is published in two forms:

- **web**: player-facing static package with `index.html`, runtime source, license/notices and concise release documentation;
- **source**: complete preservation package including tests, tools, certified witnesses and `/reference` archaeology material.

Both packages execute the same M16 web payload; only `src/style.css` differs from M15 runtime files.

## Acceptance boundary

The managed Chromium environment blocks direct `file://` and localhost navigation, so browser QA reconstructs an in-memory page from the exact production HTML/CSS/JS payload. The playability harness adds a **test-only closure hook** at runtime to drive exact ticks and inspect state; that hook is not present in `src/app.js` and is not part of the shipped game.

Real Safari/Firefox and physical Android/iPhone interaction, actual speaker/headphone output, and direct hosted/file navigation are not universally certified by this automated environment. They are documented as external field-validation items. The M16 patch changes presentation sizing only, not gameplay behavior.

## Archaeological note

The separate strict native reproducibility checkbox from M7.2 remains open: the exact official `lan_master_src.zip + NESASM 3.1 -> byte-identical ROM` build has not been executed in this environment. This does **not** invalidate the certified HTML5 behavior; it is an independent build-provenance task.

# OGLBricks · Libre Arcade (HTML5 M6 beta)

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/oglbricks/public/index.html)**

A **playable M6 beta** of Alexey Markarov's OGLBricks 0.2, a falling-block game published on SourceForge in 2013 under the MIT license. The goal is to preserve its configurable field and its catalog of 27 source-defined piece shapes, rather than produce another generic clone of the genre. It is **not certified as behaviorally identical to the Windows original**; see [`specs/AUDIT.md`](specs/AUDIT.md).

## Play

```sh
npm run dev      # serve public/ at http://localhost:8080
npm run build    # package public/ into game/
npm start        # build, then serve game/
```

Any static web server works as well (`python3 -m http.server 8080` from `public/`, nginx, GitHub Pages). Do **not** open `index.html` over `file://`: browser module security blocks the local imports. All gameplay is client-side; no npm, build framework or online API is needed to run it.

## Controls

Arrow left and right to move, Down to accelerate the descent, Up to rotate clockwise, P to pause. On a phone, use the four on-screen buttons. The toolbar offers New game, Pause, a speaker button to mute or unmute, and Menu. Sounds start enabled, play only after a user interaction (browser audio policy) and remain optional; turning them off silences notes already playing, and the choice is remembered when local storage is available. No original audio asset or external sound library is used.

Menu holds Settings (field width and height 10 to 50, piece sizes 1 to 5, starting speed), How to play, Credits and the language choice. Save and Load sit beside the board. English and Italian are switchable; Italian is selected automatically only on Italian browser settings.

**Save format:** `OGLBricks-save.json`, web port only. The original Windows `.sg` and `settings.bin` are not interoperable with this build. The game saves locally as you play when browser storage is available and resumes when the page is reopened; the Save button also downloads a portable JSON copy. If storage is blocked or full, keep the downloaded copy. Menu → Start fresh clears the locally saved game and settings after a confirmation.

## Layout and tests

- `public/`: the game itself, served as it is. `index.html`, `style.css` and `js/` are the only files that ship.
- `npm run check`: ESLint plus 38 Node tests (Node 18 or later, no dependencies beyond ESLint). They cover the engine across field sizes and piece groups, the 27 shapes against the source-derived extraction, web save validation, the DOM and translation contract, and the audio cues.
- `python3 tools/smoke_http.py`: serves `public/` and checks every asset's status, content type and bytes, with the Python standard library alone.
- `python3 tools/visual_smoke.py`, `tools/m5_browser_smoke.py`, `tools/m6_audio_browser_smoke.py`, `tools/clean_ui_smoke.py`: optional headless Chromium checks of layout, input, locale, save and load, storage failure and audio (needs Python Playwright). They inject local assets, because direct browser navigation was blocked in the environment where they were written.
- [`specs/AUDIT.md`](specs/AUDIT.md): the archaeology and the six milestones, with the open discrepancies. [`specs/port-map.md`](specs/port-map.md): what maps to what, and how strong the evidence is. [`PROVENANCE.md`](PROVENANCE.md), [`SOFTWARE_ARCHAEOLOGY.md`](SOFTWARE_ARCHAEOLOGY.md) and [`STORY.md`](STORY.md) cover origin, recovery and the short version for a reader.
- `reference/`: the original MIT notice, `MANIFEST.sha256` with the SHA-256 of the four historical archives, and `SOURCES.md` with the upstream folders they came from. The archives themselves are deliberately not committed; `PROVENANCE.md` explains why, and what that costs.

## Provenance and distribution

Original OGLBricks © 2012 Alexey Markarov, MIT. New HTML5 implementation: Libre Arcade, GPL-3.0-or-later. This port uses source-derived shape data and gameplay rules; it does **not** redistribute the original 3D models, fonts, audio, executable or Qt/Assimp DLLs. See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md), [`LICENSE`](LICENSE) and `reference/OGLBricks-MIT-LICENSE.txt`.

The page carries the collection's GoatCounter snippet (visit counts only, no cookies and no personal data). It is the only remote request the page makes; there is no other third-party script.

**M6 is a beta, not a certificate of parity with the original.** The unresolved score discrepancy, runtime event timing and original `.sg` compatibility are documented in `specs/AUDIT.md`. The original Windows program has never been run in this project.

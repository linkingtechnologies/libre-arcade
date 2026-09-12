# Donkey Bolonkey

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/donkey-bolonkey/public/index.html)**

A preservation-oriented HTML5/JavaScript restoration of **Donkey Bolonkey**, David A. Capello's SpeedHack 2001 puzzle game. See [`SOFTWARE_ARCHAEOLOGY.md`](SOFTWARE_ARCHAEOLOGY.md) for the recovery story and [`PROVENANCE.md`](PROVENANCE.md) for exactly what was and wasn't ported.

## Status

The browser edition is now **production-ready for static hosting** within the documented preservation boundary. It includes all six historical levels, the source-derived gameplay loop and scoring, title/warning/controls/credits/high-score flow, procedural replacement graphics, synthesized replacement audio, responsive desktop/mobile UI, Italian/English player-facing text, touch controls, keyboard controls and local high-score persistence.

The remaining archaeology target is stronger executable-to-executable verification against a natively built Allegro 4 reference. The current port already has deterministic source-derived parity tests, but it does not claim bit-perfect rendering/audio or libc `rand()` parity.

## Run

```bash
npm run dev
```

Then open `http://localhost:8080/`. `npm run build` packages `public/` into
`game/` for deployment to any static web server; `npm start` builds and
serves that packaged output. Any other static HTTP server pointed at
`public/` works too — there is no build step, framework, backend, cookie,
analytics service, remote asset, or required network call. It is suitable
for GitHub Pages as-is.

## Controls

- `Enter`: start / confirm a high-score name / retry the current level after game over
- `Tab` / Right arrow: next bubble
- Left arrow: previous bubble (web convenience)
- `Space`: swap
- `P`: pause
- `Esc`: leave the current run and continue to high scores (or credits after final completion)

Touch controls are shown only during active gameplay. Introductory screens can be advanced by tapping the game area. A real text field is shown for high-score entry so mobile virtual keyboards work correctly.

## Archaeology

The historical source snapshot is preserved under `/reference/dkbk`. It is a 2001–2003 upstream snapshot distributed by Debian under the upstream version label `2001`.

The original research archive SHA-256 is recorded under `/reference`. The **repo-safe** package intentionally omits the original tarball and `dkbk.dat`, whose media provenance is not sufficiently clear for public redistribution. The **full laboratory** package keeps those quarantined originals for research only.

See `/specs/ARCHAEOLOGY.md`, `/specs/ASSET_AUDIT.md`, `/specs/PARITY.md`, `/specs/PRODUCTION_CHECKLIST.md`, `/specs/MILESTONE_2.md` through `/specs/MILESTONE_5.md`, and `/specs/NATIVE_BUILD.md`.

## Preservation vs reconstruction

Preserved/ported from the historical GPL-2.0-or-later source: gameplay rules, six levels, 60 Hz model, movement ordering, scoring, crusher/death behavior, particle equations and cadence, title/banner timing, high-score rules and post-game flow.

Reconstructed/adapted for the web: responsive shell, touch navigation, previous-bubble control, bilingual copy, mobile name-entry field, localStorage persistence, procedural visuals, synthesized Web Audio and browser accessibility features.

## Tests

Run:

```bash
npm run check
```

The Milestone 5 suite contains **34 deterministic tests** covering gameplay, flow, audio events, six-level end-to-end progression, source-derived traces, bilingual UI structure, production markup and the repo-safe asset boundary.

A headless Chromium layout pass was also performed for intro, gameplay and high-score-name states at representative phone, tablet and desktop viewports from **320×568 through 1366×768**. The document stayed scroll-free, primary menu controls stayed visible and the game canvas retained a 4:3 display box.

## Licensing

Historical Donkey Bolonkey source and level definitions: Copyright (C) 2001 David A. Capello, GPL-2.0-or-later — confirmed directly in every source file's own header ("version 2 ... or, at your option, any later version"), not inferred.

This web restoration: GPL-3.0-or-later, exercising that "or later" permission — the same pattern `netris/PROVENANCE.md` uses for Netris. Replacement runtime graphics and synthesized-audio code are part of this port and use the same license.

See `PROVENANCE.md` and `THIRD_PARTY_NOTICES.md`.

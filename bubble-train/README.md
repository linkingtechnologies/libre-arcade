# Bubble Train — faithful historical restoration

Software-archaeology preservation and browser restoration of **Bubble Train**, the 2004-era SDL action/puzzle game by Adam Child (Dwarf City) and Craig Marshall.

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/bubble-train/public/index.html)**

See [`SOFTWARE_ARCHAEOLOGY.md`](SOFTWARE_ARCHAEOLOGY.md) for the recovery story and [`PROVENANCE.md`](PROVENANCE.md) for exactly what was and wasn't ported.

## Status

**Decision: GO WITH CLEAN AUDIOVISUAL ASSETS.**

The audited Bubble Train C++ is GPL-2.0-or-later, so the new browser port code is GPL-3.0-or-later. Historical graphics, bitmap fonts, music and sound effects remain quarantined and are not used by the runnable build. `List.h` is a quarantined third-party source file and is not copied.

A deeper license-scope audit cleared the **61 bundled original `.lvl` files and 5 original `.gms` game manifests** at high confidence under Bubble Train's project-level GPL grant. Milestone 4 therefore restores the historical campaigns while keeping the audiovisual presentation clean-room.

The project is now at **Milestone 11: player help + cleaned Release Candidate package**.

## What is now faithful

- Pure JavaScript ES modules, Canvas and Web Audio; no framework/runtime dependencies.
- 800×600 source coordinate system with responsive scaling and 25 Hz fixed-step simulation.
- Source-derived `line`, `arc`, exponential `spiral`, train/ripple, insertion, matching and special-bubble behavior.
- Original `.lvl` / `.gms` XML parser and campaign order.
- **61 original level files + 5 original game manifests**, preserved byte-for-byte from the audited OS4 1.0final package.
- Five historical game selections: **Easy, Normal, Hard, Bubble Train, Everything**.
- External case-resolution shim for the historical `easy/normal/hard` path-capitalization mismatch; original XML is not edited.
- Original campaign themes are retained as manifest metadata and now map to **eight new clean-room background packs** (`default`, `arctic`, `beach`, `mexico`, `mountains`, `sea`, `sky`, `space`) without loading any historical theme artwork.
- Credits/retry, pause-aware timing, cumulative time and source-style global fastest-times ranking.
- Fastest-time records now retain the selected historical `.gms` game name, matching the original table's logical fields.
- Responsive English/Italian UI with keyboard, pointer and touch controls, plus an in-game **How to play / Come si gioca** guide for objective, controls, special bubbles and audio settings.
- Synthesized clean-room Web Audio now includes richer **procedural SFX plus lightweight menu/gameplay music**, alongside the CC0 vector asset pack for bubbles, cannon, HUD and eight theme backgrounds; no historical artwork is loaded.
- Seeded deterministic gameplay RNG for automated parity work.
- **64/64 automated tests passing**, including executable-derived regression guards, plus a release gate that verifies all preserved hashes, clean-asset separation, HTTP/MIME delivery and a **128,589-tick soak run** across all 61 historical levels.
- **Direct static executable parity PASS** for audited core mechanics: the actual OS4 PowerPC executable and symbolized GP2X ARM executable were inspected directly; no gameplay-core mismatch was found.

See `docs/milestone-11-package-cleanup-help.md`, `docs/milestone-9-root-entry-aiming-fix.md`, `docs/executable-parity-report.md`, `docs/milestone-7-release-prep.md`, `RELEASE-CHECKLIST.md` and `specs/level-data-license-memo.md`.

## Current release note

Milestone 12 fixes browser audio reliability: the Web Audio context is now unlocked repeatedly on pointer/touch/keyboard input, queued effects are preserved until audio is running, and the procedural music bus is mixed at an audible level instead of being effectively double-attenuated. Milestone 13 rebalances that same procedural music bus, which was still too quiet relative to the sound effects.

## Run

```sh
npm run dev
```

Then open `http://localhost:8080/`. `npm run build` packages `public/` into
`game/` for deployment to any static web server; `npm start` builds and
serves that packaged output.

This project also keeps its own archaeology-grade tooling:

```sh
npm test

# full automated RC gate: tests + hash/quarantine audit + soak run + HTTP smoke
npm run release:check
```

If port 8080 is already in use:

```sh
PORT=8765 npm run dev
```

Controls: **Left/Right** aim, **Space** fire, **P** pause; pointer movement aims and pointer press fires. On smaller screens, on-screen aim/fire controls are shown.

Use **How to play / Come si gioca** for a short player-facing explanation. Use **Options → Game** to choose one of the five original `.gms` campaigns, and **Options → Audio** to disable music and sound effects.

## Fidelity boundary

The runnable build now combines:

- **historical gameplay data**: original `.lvl` and `.gms`, unmodified;
- **source-derived mechanics**: independently implemented in JavaScript from the audited C++ behavior;
- **clean audiovisual presentation**: no original PNG/JPEG/bitmap-font/WAV/OGG assets.

This is therefore a **faithful historical restoration with clean audiovisual assets**, not a pixel/audio-identical binary port.

The original data files remain separately documented under `public/data/original-levels/`; the root GPL-3.0-or-later license applies to newly authored port code, not as a claim of authorship over preserved historical files.

## Repository map

- `public/` — the deployable static application; `npm run build` packages it into `game/`.
  - `public/index.html` + `public/main.js` — entry point for the responsive playable restoration using original level data + clean visuals/audio/music.
  - `public/src/` — new GPL-3.0-or-later faithful-port code.
  - `public/assets-clean/` — newly authored CC0-1.0 SVG gameplay/UI assets, eight theme backgrounds and provenance manifest.
  - `public/data/original-levels/files/` — 61 `.lvl` + 5 `.gms`, byte-preserved historical XML, served at runtime so `public/` stays self-contained.
  - `public/data/original-levels/MANIFEST.sha256` — hashes for those 66 XML files.
- `reference/` — byte-preserved historical archives; never modify.
- `tests/` — parity, game-flow and full historical-data tests.
- `tools/` — this project's own archaeology-grade QA scripts (`release-check.mjs`, `release-soak.mjs`, `http-smoke.mjs`) behind `npm run release:check`.
- `scripts/` — the collection's standard `dev`/`build` static-server scripts.
- `docs/` — milestone implementation notes, executable evidence and all historical milestone manifests.
- `specs/` — history, legal, asset, gameplay, architecture, levels, IP and parity audits.
- `THIRD_PARTY_NOTICES.md` — quarantine/third-party register.
- `AGENTS.md` — hard rules for future work.

## Package cleanup

The playable package has been tidied without discarding archaeology. Historical material remains intact under `reference/`, `public/data/original-levels/`, `specs/` and `docs/evidence/`. Older milestone hash snapshots are preserved under `docs/manifests/` instead of cluttering the project root. Development-only asset preview PNGs were removed; runnable clean assets remain under `public/assets-clean/`.

## Release-candidate status

`npm run release:check` currently passes the automated release gate. In addition, Milestone 8 completed a **direct static comparison of the actual historical executables**. The symbolized GP2X binary independently confirms the implemented core mechanics, while the OS4 final executable corroborates the upstream-scale constants. No gameplay-core mismatch was found.

The build remains a **Release Candidate** rather than a live parity-certified final release because two observational gates remain:

1. **live runtime differential capture** from an original-compatible OS4/GP2X execution environment;
2. **manual browser/device/accessibility matrix** on real Chromium/Firefox/WebKit and touch hardware.

The historical level editor is optional follow-up work and is **not** a blocker for the gameplay restoration release.

## Licensing scope

- New port code: **GPL-3.0-or-later** (`LICENSE`, `LICENSES/GPL-3.0.txt`).
- Historical Bubble Train level/game XML: preserved under the documented upstream GPL scope; see `public/data/original-levels/README.md`, `LICENSES/GPL-2.0.txt` and `specs/level-data-license-memo.md`.
- `/reference`: preserved artifacts retaining their own notices/status; not relicensed by the root license.
- New clean vector assets: **CC0-1.0**, under `public/assets-clean/`.
- Original audiovisual assets: **QUARANTINE**, not used by the runnable build.
